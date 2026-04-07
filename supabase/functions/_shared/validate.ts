// ============================================================================
// SENDA — Shared input validation helpers for Edge Functions
// Lightweight validators (no Zod dependency in Deno runtime).
// ============================================================================

export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

export function isValidEmail(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export function isValidUUID(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export function isPositiveNumber(val: unknown): val is number {
  return typeof val === 'number' && val > 0 && isFinite(val);
}

export function sanitizeString(val: string, maxLen = 1000): string {
  // Strip HTML tags to prevent stored XSS, then trim and truncate
  return val.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

/** Structured log for edge function monitoring */
export function logEvent(fn: string, level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    fn,
    level,
    message,
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Wrap a handler with a timeout. If the handler exceeds `ms`,
 * the request returns a 504 Gateway Timeout.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}
