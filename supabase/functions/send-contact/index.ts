// ============================================================================
// SADEEM — send-contact Edge Function
// 1. Always saves submission to contact_submissions table (guaranteed storage)
// 2. Optionally sends email via Resend if RESEND_API_KEY + CONTACT_EMAIL are set
//    FROM is onboarding@resend.dev (works without domain verification)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const CONTACT_EMAIL  = Deno.env.get('CONTACT_EMAIL')  ?? '';
// Use Resend's shared domain — works on free tier without domain verification
const FROM_EMAIL = 'SADEEM Contact <onboarding@resend.dev>';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { name, email, phone, company, message } = body as {
      name?: string; email?: string; phone?: string; company?: string; message?: string;
    };

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'الاسم والبريد الإلكتروني والرسالة مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صحيحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 1: Save to DB (primary, always attempted) ─────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name:    name.trim(),
        email:   email.trim(),
        phone:   phone?.trim() || null,
        company: company?.trim() || null,
        message: message.trim(),
      });

    if (dbError) {
      console.error('[send-contact] DB insert error:', dbError);
      return new Response(
        JSON.stringify({ error: 'فشل حفظ الرسالة. يرجى المحاولة لاحقًا.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 2: Send email via Resend (best-effort, won't fail the request) ─
    if (RESEND_API_KEY && CONTACT_EMAIL) {
      const subject = `رسالة جديدة من سديم — ${name.trim()}${company?.trim() ? ` (${company.trim()})` : ''}`;
      const htmlBody = buildEmailHtml({ name: name.trim(), email: email.trim(), phone: phone?.trim(), company: company?.trim(), message: message.trim() });

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM_EMAIL, to: [CONTACT_EMAIL], reply_to: email.trim(), subject, html: htmlBody }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.error('[send-contact] Resend error (non-fatal):', resendRes.status, errText);
        } else {
          console.log('[send-contact] Email sent successfully');
        }
      } catch (emailErr) {
        console.error('[send-contact] Email exception (non-fatal):', emailErr);
      }
    } else {
      console.log('[send-contact] No email secrets configured — submission saved to DB only');
    }

    // Submission saved to DB ✓ — always return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[send-contact] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'خطأ غير متوقع. يرجى المحاولة لاحقًا.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Email HTML builder ───────────────────────────────────────────────────────
function buildEmailHtml(p: { name: string; email: string; phone?: string; company?: string; message: string }) {
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
      <p>سديم — منصة إدارة تقييمات جوجل</p>
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
    <div class="footer">تم الإرسال عبر نموذج التواصل في sadeem.app • للرد: ${esc(p.email)}</div>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
