// ============================================================================
// SENDA — send-email Edge Function (Hardened)
// Rate-limited (10 req / 10 min), input validated, timeout 8s
// ============================================================================

import { makeCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts';
import { isNonEmptyString, isValidEmail, sanitizeString, logEvent, withTimeout } from '../_shared/validate.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = 'SENDA <onboarding@resend.dev>';

const FN = 'send-email';
const RATE_LIMIT_COUNT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
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

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit
  const tokenKey = authHeader.slice(-16);
  const rl = await checkRateLimit(`email:${tokenKey}:${clientIP}`, RATE_LIMIT_COUNT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(60, cors);
  }

  try {
    const handler = async () => {
      const body = await req.json();
      const { to, subject, html } = body as {
        to?: string; subject?: string; html?: string;
      };

      // Validate
      if (!isValidEmail(to)) {
        return new Response(
          JSON.stringify({ error: 'Valid email address required for "to"' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      if (!isNonEmptyString(subject)) {
        return new Response(
          JSON.stringify({ error: 'subject is required' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
      if (!isNonEmptyString(html)) {
        return new Response(
          JSON.stringify({ error: 'html body is required' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const sTo = sanitizeString(to, 320);
      const sSubject = sanitizeString(subject, 500);
      const sHtml = html.slice(0, 50000); // cap HTML at 50KB

      if (!RESEND_API_KEY) {
        logEvent(FN, 'warn', 'RESEND_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Email service not configured' }),
          { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [sTo],
          subject: sSubject,
          html: sHtml,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        logEvent(FN, 'error', 'Resend API error', { status: res.status, error: errText });
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      logEvent(FN, 'info', 'Email sent', { to: sTo });
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
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
