// ============================================================================
// SENDA — send-contact Edge Function (Hardened)
// 1. Rate-limited per IP (5 req / 15 min)
// 2. Input validated + sanitized
// 3. Structured JSON logging
// 4. Timeout protection (8s)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts';
import { isNonEmptyString, isValidEmail, sanitizeString, logEvent, withTimeout } from '../_shared/validate.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const CONTACT_EMAIL  = Deno.env.get('CONTACT_EMAIL')  ?? '';
const FROM_EMAIL = 'SENDA Contact <onboarding@resend.dev>';

const FN = 'send-contact';
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 min
const TIMEOUT_MS = 8000;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }

  const cors = makeCorsHeaders(req);
  const clientIP = getClientIP(req);

  // Block unauthorized browser origins
  if (!isOriginAllowed(req)) {
    logEvent(FN, 'warn', 'Blocked unauthorized origin', { origin: req.headers.get('origin'), ip: clientIP });
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Rate limit per IP (persistent DB-based)
  const rl = await checkRateLimit(`contact:${clientIP}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(60, cors);
  }

  try {
    const handler = async () => {
      const body = await req.json();
      const { name, email, phone, company, message } = body as {
        name?: string; email?: string; phone?: string; company?: string; message?: string;
      };

      // Input validation
      if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(message)) {
        return new Response(
          JSON.stringify({ error: 'الاسم والبريد الإلكتروني والرسالة مطلوبة' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      if (!isValidEmail(email)) {
        return new Response(
          JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صحيحة' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize inputs
      const sName    = sanitizeString(name, 200);
      const sEmail   = sanitizeString(email, 320);
      const sPhone   = phone ? sanitizeString(phone, 20) : null;
      const sCompany = company ? sanitizeString(company, 200) : null;
      const sMessage = sanitizeString(message, 5000);

      // Save to DB
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: sName,
          email: sEmail,
          phone: sPhone,
          company: sCompany,
          message: sMessage,
        });

      if (dbError) {
        logEvent(FN, 'error', 'DB insert failed', { error: dbError.message });
        return new Response(
          JSON.stringify({ error: 'فشل حفظ الرسالة. يرجى المحاولة لاحقًا.' }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      logEvent(FN, 'info', 'Contact submission saved', { email: sEmail });

      // Send admin notification email (best-effort)
      if (RESEND_API_KEY && CONTACT_EMAIL) {
        const subject = `رسالة جديدة من سيندا — ${sName}${sCompany ? ` (${sCompany})` : ''}`;
        const htmlBody = buildEmailHtml({ name: sName, email: sEmail, phone: sPhone, company: sCompany, message: sMessage });

        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to: [CONTACT_EMAIL], reply_to: sEmail, subject, html: htmlBody }),
          });

          if (!resendRes.ok) {
            const errText = await resendRes.text();
            logEvent(FN, 'warn', 'Admin email failed (non-fatal)', { status: resendRes.status, error: errText });
          } else {
            logEvent(FN, 'info', 'Admin notification email sent');
          }

          // Send thank-you to submitter (best-effort)
          try {
            const thankYouRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: FROM_EMAIL,
                to: [sEmail],
                subject: 'شكراً لتواصلك — سيندا',
                html: buildThankYouHtml(sName),
              }),
            });
            if (!thankYouRes.ok) {
              logEvent(FN, 'warn', 'Thank-you email failed (non-fatal)', { status: thankYouRes.status });
            }
          } catch (tyErr) {
            logEvent(FN, 'warn', 'Thank-you email exception (non-fatal)', { error: String(tyErr) });
          }

        } catch (emailErr) {
          logEvent(FN, 'warn', 'Email exception (non-fatal)', { error: String(emailErr) });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    };

    return await withTimeout(handler(), TIMEOUT_MS, FN);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('timed out')) {
      logEvent(FN, 'error', 'Request timeout', { ip: clientIP });
      return new Response(JSON.stringify({ error: 'Request timeout' }), {
        status: 504, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    logEvent(FN, 'error', 'Unexpected error', { error: msg });
    return new Response(
      JSON.stringify({ error: 'خطأ غير متوقع. يرجى المحاولة لاحقًا.' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Email HTML builders ─────────────────────────────────────────────────────
function buildEmailHtml(p: { name: string; email: string; phone?: string | null; company?: string | null; message: string }) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #f8fafc; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #06B6D4, #8B5CF6); padding: 24px 28px; }
    .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0; }
    .body { padding: 24px 28px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .value { font-size: 15px; color: #111827; font-weight: 500; }
    .message-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .message-label { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
    .message-text { font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap; }
    .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 16px 28px; font-size: 12px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>رسالة جديدة من نموذج التواصل</h1>
      <p>سيندا — منصة إدارة تقييمات جوجل</p>
    </div>
    <div class="body">
      <div class="field"><div class="label">الاسم</div><div class="value">${esc(p.name)}</div></div>
      <div class="field"><div class="label">البريد الإلكتروني</div><div class="value" dir="ltr">${esc(p.email)}</div></div>
      ${p.phone ? `<div class="field"><div class="label">رقم الهاتف</div><div class="value" dir="ltr">${esc(p.phone)}</div></div>` : ''}
      ${p.company ? `<div class="field"><div class="label">اسم الشركة</div><div class="value">${esc(p.company)}</div></div>` : ''}
      <div class="message-box">
        <div class="message-label">الرسالة</div>
        <div class="message-text">${esc(p.message)}</div>
      </div>
    </div>
    <div class="footer">تم الإرسال عبر نموذج التواصل في senda.app</div>
  </div>
</body>
</html>`;
}

function buildThankYouHtml(name: string) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #f8fafc; margin: 0; padding: 24px; }
    .card { background: #ffffff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #06B6D4, #8B5CF6); padding: 24px 28px; }
    .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 600; }
    .body { padding: 24px 28px; color: #374151; font-size: 15px; line-height: 1.8; }
    .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 16px 28px; font-size: 12px; color: #9CA3AF; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>شكراً لتواصلك معنا!</h1>
    </div>
    <div class="body">
      <p>مرحباً ${esc(name)}،</p>
      <p>تم استلام رسالتك بنجاح. سيقوم فريقنا بالرد عليك في أقرب وقت ممكن.</p>
      <p>نقدّر اهتمامك بسيندا — منصة إدارة تقييمات جوجل الذكية.</p>
      <p>مع تحيات فريق سيندا</p>
    </div>
    <div class="footer">سيندا — منصة إدارة تقييمات جوجل</div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
