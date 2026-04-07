// ============================================================================
// SENDA — In-memory rate limiter for Edge Functions (Deno)
// Sliding window per key (IP or user_id). Auto-prunes expired entries.
// ============================================================================

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
let lastPrune = Date.now();

/**
 * Check if a key has exceeded the rate limit.
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Prune stale entries every 60s to prevent memory growth
  if (now - lastPrune > 60_000) {
    for (const [k, v] of store) {
      v.timestamps = v.timestamps.filter(t => t > cutoff);
      if (v.timestamps.length === 0) store.delete(k);
    }
    lastPrune = now;
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: maxRequests - entry.timestamps.length, retryAfterMs: 0 };
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
export function rateLimitResponse(retryAfterMs: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    },
  );
}
