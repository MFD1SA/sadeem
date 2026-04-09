// ============================================================================
// SENDA — Edge Function: generate-reply (Hardened)
// Rate-limited per user (20 req / 10 min), input validated, timeout 8s
// ============================================================================

import { makeCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts';
import { isNonEmptyString, logEvent, withTimeout } from '../_shared/validate.ts';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-2.5-flash-lite';

const FN = 'generate-reply';
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 min
const TIMEOUT_MS = 8000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) });
  }

  const cors = makeCorsHeaders(req);

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit per bearer token hash (user-scoped)
  const tokenKey = authHeader.slice(-16); // last 16 chars as key
  const clientIP = getClientIP(req);
  const rl = await checkRateLimit(`ai:${tokenKey}:${clientIP}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP });
    return rateLimitResponse(60, cors);
  }

  try {
    const handler = async () => {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (!apiKey) {
        logEvent(FN, 'error', 'GEMINI_API_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { prompt, temperature = 0.6, maxOutputTokens = 400 } = body;

      // Validate prompt
      if (!isNonEmptyString(prompt)) {
        return new Response(
          JSON.stringify({ error: 'prompt is required and must be a non-empty string' }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      // Validate numeric params
      const safeTemp = Math.min(Math.max(Number(temperature) || 0.6, 0), 2);
      const safeTokens = Math.min(Math.max(Math.floor(Number(maxOutputTokens) || 400), 1), 2000);

      // Cap prompt length (prevent abuse)
      const safePrompt = prompt.slice(0, 10000);

      logEvent(FN, 'info', 'Generating reply', { promptLen: safePrompt.length, temp: safeTemp });

      const startTime = Date.now();

      const geminiRes = await fetch(
        `${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: safePrompt }] }],
            generationConfig: {
              temperature: safeTemp,
              maxOutputTokens: safeTokens,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const durationMs = Date.now() - startTime;

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        const msg = (errBody as { error?: { message?: string } }).error?.message
          || `Gemini error: ${geminiRes.status}`;
        logEvent(FN, 'error', 'Gemini API error', { status: geminiRes.status, error: msg, durationMs });
        return new Response(
          JSON.stringify({ error: msg }),
          { status: geminiRes.status, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const data = await geminiRes.json();
      logEvent(FN, 'info', 'Reply generated', { durationMs });
      return new Response(
        JSON.stringify({ ...data, durationMs }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
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
      JSON.stringify({ error: 'Unknown error' }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
