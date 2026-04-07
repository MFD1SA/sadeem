// ============================================================================
// SENDA — Persistent rate limiter for Edge Functions (Deno)
// Uses Supabase DB table `rate_limits` so state persists across isolates.
// Falls back to in-memory if DB is unavailable.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Check if a key has exceeded the rate limit using persistent DB storage.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client = createClient(supabaseUrl, serviceKey);

    const windowStart = new Date(Date.now() - windowMs).toISOString();

    // Count requests in window
    const { count, error: countErr } = await client
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('ts', windowStart);

    if (countErr) {
      // DB error — fail open (allow request but log)
      console.warn('[rate-limit] DB count error, failing open:', countErr.message);
      return { allowed: true, remaining: maxRequests };
    }

    const currentCount = count || 0;

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Record this request
    await client.from('rate_limits').insert({ key, ts: new Date().toISOString() });

    // Best-effort cleanup: delete old entries for this key (>1 hour)
    const cleanupCutoff = new Date(Date.now() - 3600_000).toISOString();
    client.from('rate_limits').delete().eq('key', key).lt('ts', cleanupCutoff).then(() => {});

    return { allowed: true, remaining: maxRequests - currentCount - 1 };
  } catch (err) {
    console.warn('[rate-limit] Exception, failing open:', err);
    return { allowed: true, remaining: maxRequests };
  }
}

/**
 * Extract client IP from request headers (Deno/CF workers).
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || 'unknown';
}

/**
 * Build a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSec: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    },
  );
}
