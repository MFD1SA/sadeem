// ============================================================================
// SADEEM — send-contact Edge Function
// Receives contact form data and sends an email to the configured recipient.
// The destination email is stored as a Supabase secret (CONTACT_EMAIL) and is
// NEVER exposed to the client. Uses Resend API (RESEND_API_KEY secret).
// ============================================================================

import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const CONTACT_EMAIL = Deno.env.get('CONTACT_EMAIL') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'نموذج التواصل <noreply@sadeem.app>';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      message?: string;
    };

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'الاسم والبريد الإلكتروني والرسالة مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: 'صيغة البريد الإلكتروني غير صحيحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!RESEND_API_KEY || !CONTACT_EMAIL) {
      console.error('[send-contact] Missing RESEND_API_KEY or CONTACT_EMAIL env vars');
      return new Response(
        JSON.stringify({ error: 'خدمة البريد الإلكتروني غير مهيأة' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subject = `رسالة جديدة من سديم — ${name.trim()}${company?.trim() ? ` (${company.trim()})` : ''}`;

    const htmlBody = `
<!DOCTYPE html>
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
      <div class="field">
        <div class="label">الاسم</div>
        <div class="value">${escapeHtml(name.trim())}</div>
      </div>
      <div class="field">
        <div class="label">البريد الإلكتروني</div>
        <div class="value" dir="ltr">${escapeHtml(email.trim())}</div>
      </div>
      ${phone?.trim() ? `
      <div class="field">
        <div class="label">رقم الهاتف</div>
        <div class="value" dir="ltr">${escapeHtml(phone.trim())}</div>
      </div>` : ''}
      ${company?.trim() ? `
      <div class="field">
        <div class="label">اسم الشركة / المؤسسة</div>
        <div class="value">${escapeHtml(company.trim())}</div>
      </div>` : ''}
      <div class="message-box">
        <div class="message-label">الرسالة</div>
        <div class="message-text">${escapeHtml(message.trim())}</div>
      </div>
    </div>
    <div class="footer">
      تم الإرسال عبر نموذج التواصل في sadeem.app • للرد، استخدم البريد: ${escapeHtml(email.trim())}
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [CONTACT_EMAIL],
        reply_to: email.trim(),
        subject,
        html: htmlBody,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('[send-contact] Resend error:', resendRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'فشل إرسال الرسالة. يرجى المحاولة لاحقًا.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
