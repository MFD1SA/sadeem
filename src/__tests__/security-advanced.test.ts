import { describe, it, expect } from 'vitest';

// =============================================================================
// Advanced Security Tests — Pure unit tests (no network/DB calls)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. CSRF / Token Security
// ---------------------------------------------------------------------------
describe('Security: CSRF and Token validation', () => {
  // JWT-like token format: three base64url segments separated by dots
  const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  it('accepts a well-formed JWT token format', () => {
    const token =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc_DEF-123';
    expect(JWT_PATTERN.test(token)).toBe(true);
  });

  it('rejects token with missing segments', () => {
    expect(JWT_PATTERN.test('eyJhbGciOiJIUzI1NiJ9.missing')).toBe(false);
    expect(JWT_PATTERN.test('single-segment')).toBe(false);
  });

  it('rejects token containing spaces or illegal characters', () => {
    expect(JWT_PATTERN.test('abc.def ghi.jkl')).toBe(false);
    expect(JWT_PATTERN.test('abc.def$.jkl')).toBe(false);
  });

  it('detects expired token based on exp claim', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const isExpired = (exp: number) => exp < Math.floor(Date.now() / 1000);

    expect(isExpired(pastExp)).toBe(true);
    expect(isExpired(futureExp)).toBe(false);
  });

  it('validates token refresh window (refresh only within last 5 min before expiry)', () => {
    const now = Math.floor(Date.now() / 1000);
    const shouldRefresh = (exp: number) => {
      const remaining = exp - now;
      return remaining > 0 && remaining <= 300; // 5 minutes
    };

    expect(shouldRefresh(now + 60)).toBe(true);   // 1 min left — refresh
    expect(shouldRefresh(now + 600)).toBe(false);  // 10 min left — no refresh
    expect(shouldRefresh(now - 10)).toBe(false);   // already expired — no refresh
  });
});

// ---------------------------------------------------------------------------
// 2. Input Sanitization
// ---------------------------------------------------------------------------
describe('Security: Input sanitization', () => {
  function sanitizeInput(input: string): string {
    return input
      .replace(/[<>'"]/g, '')           // strip HTML/XSS chars
      .replace(/--/g, '')               // strip SQL comment markers
      .replace(/[;{}]/g, '')            // strip statement terminators & braces
      .trim();
  }

  it('blocks SQL injection patterns in search inputs', () => {
    const malicious = "'; DROP TABLE reviews; --";
    const result = sanitizeInput(malicious);
    expect(result).not.toContain("'");
    expect(result).not.toContain('--');
    expect(result).not.toContain(';');
  });

  it('strips XSS payloads from review text', () => {
    const xss = '<script>document.cookie</script>Great service!';
    const result = sanitizeInput(xss);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('Great service!');
  });

  it('strips HTML injection from user names', () => {
    const name = '<b onmouseover="alert(1)">Admin</b>';
    const result = sanitizeInput(name);
    expect(result).not.toContain('<');
    expect(result).not.toContain('"');
    expect(result).toContain('Admin');
  });

  it('blocks path traversal in file names', () => {
    function sanitizeFilename(name: string): string {
      return name.replace(/\.\./g, '').replace(/[/\\]/g, '').trim();
    }
    expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32');
    expect(sanitizeFilename('normal-file.png')).toBe('normal-file.png');
  });

  it('handles Unicode normalization attacks (homoglyph)', () => {
    // Cyrillic "а" (U+0430) looks like Latin "a" (U+0061)
    function normalizeToASCII(input: string): string {
      return input.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
    }
    const sneaky = '\u0430dmin'; // Cyrillic а + "dmin"
    const normalized = normalizeToASCII(sneaky);
    expect(normalized).toBe('dmin'); // Cyrillic char stripped
    expect(normalized).not.toBe('admin');
  });
});

// ---------------------------------------------------------------------------
// 3. Rate Limiting Patterns
// ---------------------------------------------------------------------------
describe('Security: Rate limiting and backoff', () => {
  // Mirrors the 2-second delay pattern used in sync.ts between AI calls
  function computeBackoff(attempt: number, baseMs = 2000): number {
    return Math.min(baseMs * Math.pow(2, attempt), 60000);
  }

  it('computes correct exponential backoff at each retry level', () => {
    expect(computeBackoff(0)).toBe(2000);   // 2 s
    expect(computeBackoff(1)).toBe(4000);   // 4 s
    expect(computeBackoff(2)).toBe(8000);   // 8 s
    expect(computeBackoff(3)).toBe(16000);  // 16 s
  });

  it('caps backoff at 60 seconds', () => {
    expect(computeBackoff(10)).toBe(60000);
    expect(computeBackoff(20)).toBe(60000);
  });

  it('enforces maximum retry count', () => {
    const MAX_RETRIES = 5;
    function shouldRetry(attempt: number): boolean {
      return attempt < MAX_RETRIES;
    }
    expect(shouldRetry(0)).toBe(true);
    expect(shouldRetry(4)).toBe(true);
    expect(shouldRetry(5)).toBe(false);
    expect(shouldRetry(10)).toBe(false);
  });

  it('tracks request counts within a sliding window', () => {
    const WINDOW_MS = 60000;
    const MAX_REQUESTS = 100;
    const timestamps: number[] = [];
    const now = Date.now();

    function recordRequest(): boolean {
      const windowStart = now - WINDOW_MS;
      // Purge old entries
      while (timestamps.length > 0 && timestamps[0] < windowStart) {
        timestamps.shift();
      }
      if (timestamps.length >= MAX_REQUESTS) return false;
      timestamps.push(now);
      return true;
    }

    // Fill up to the limit
    for (let i = 0; i < MAX_REQUESTS; i++) {
      expect(recordRequest()).toBe(true);
    }
    // 101st request should be rejected
    expect(recordRequest()).toBe(false);
  });

  it('respects the 2-second inter-request delay from sync pattern', () => {
    const DELAY_MS = 2000;
    let lastRequestTime = -DELAY_MS; // allow first request immediately

    function canMakeRequest(currentTime: number): boolean {
      if (currentTime - lastRequestTime < DELAY_MS) return false;
      lastRequestTime = currentTime;
      return true;
    }

    expect(canMakeRequest(0)).toBe(true);      // first request allowed
    expect(canMakeRequest(1000)).toBe(false);   // only 1 s later
    expect(canMakeRequest(2000)).toBe(true);    // exactly 2 s
    expect(canMakeRequest(2500)).toBe(false);   // only 0.5 s later
    expect(canMakeRequest(4000)).toBe(true);    // 2 s after last success
  });
});

// ---------------------------------------------------------------------------
// 4. Data Validation
// ---------------------------------------------------------------------------
describe('Security: Data validation', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  it('validates email formats correctly', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('name+tag@domain.org')).toBe(true);
    expect(EMAIL_REGEX.test('user@example')).toBe(false);       // no TLD
    expect(EMAIL_REGEX.test('@example.com')).toBe(false);       // no local part
    expect(EMAIL_REGEX.test('user @example.com')).toBe(false);  // space
    expect(EMAIL_REGEX.test('')).toBe(false);
  });

  it('validates phone number formats', () => {
    // Saudi phone format: +966 5x xxx xxxx
    const SAUDI_PHONE = /^\+9665\d{8}$/;
    expect(SAUDI_PHONE.test('+966512345678')).toBe(true);
    expect(SAUDI_PHONE.test('+966412345678')).toBe(false);  // not 5x
    expect(SAUDI_PHONE.test('0512345678')).toBe(false);     // missing +966
    expect(SAUDI_PHONE.test('+96651234')).toBe(false);      // too short
  });

  it('validates URL formats and rejects non-http schemes', () => {
    function isValidHttpUrl(str: string): boolean {
      try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }
    expect(isValidHttpUrl('https://gandx.net')).toBe(true);
    expect(isValidHttpUrl('http://localhost:3000')).toBe(true);
    expect(isValidHttpUrl('ftp://evil.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('not-a-url')).toBe(false);
  });

  it('validates organization slug format (matching existing slug generator)', () => {
    function generateSlug(name: string): string {
      return name
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 40);
    }

    const slug = generateSlug('My Business!@#$%');
    expect(slug).toBe('my-business');
    expect(slug.length).toBeLessThanOrEqual(40);
    // Ensure no special chars sneak through
    expect(/^[\w\u0600-\u06FF-]+$/.test(slug)).toBe(true);
  });

  it('enforces review text length limits', () => {
    const MAX_REVIEW_LENGTH = 5000;

    function validateReviewText(text: string): { valid: boolean; reason?: string } {
      if (!text || text.trim().length === 0) return { valid: false, reason: 'Review text is empty' };
      if (text.length > MAX_REVIEW_LENGTH) return { valid: false, reason: 'Review text exceeds maximum length' };
      return { valid: true };
    }

    expect(validateReviewText('Great service!').valid).toBe(true);
    expect(validateReviewText('').valid).toBe(false);
    expect(validateReviewText('   ').valid).toBe(false);
    expect(validateReviewText('A'.repeat(5001)).valid).toBe(false);
    expect(validateReviewText('A'.repeat(5000)).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Error Information Leakage
// ---------------------------------------------------------------------------
describe('Security: Error information leakage prevention', () => {
  function sanitizeErrorMessage(raw: string): string {
    // Strip patterns that could leak internals
    let msg = raw;
    // Remove stack traces
    msg = msg.replace(/at\s+\S+\s+\(.*:\d+:\d+\)/g, '');
    // Remove file paths
    msg = msg.replace(/\/[\w./-]+\.(ts|js|tsx|jsx):\d+/g, '[redacted]');
    // Remove DB column references (table.column or schema.table)
    msg = msg.replace(/\b\w+\.\w+_\w+\b/g, '[redacted]');
    // Remove anything that looks like a connection string
    msg = msg.replace(/postgresql:\/\/[^\s]+/gi, '[redacted]');
    msg = msg.replace(/postgres:\/\/[^\s]+/gi, '[redacted]');
    // Remove API keys (long alphanumeric strings prefixed with key patterns)
    msg = msg.replace(/(key|token|secret|password|apikey)[=:]\s*\S+/gi, '$1=[redacted]');
    return msg.trim();
  }

  it('strips stack traces from error messages', () => {
    const raw = 'Error: something broke at Object.run (/app/src/services/sync.ts:42:10)';
    const sanitized = sanitizeErrorMessage(raw);
    expect(sanitized).not.toContain('/app/src/services/sync.ts');
    expect(sanitized).not.toContain(':42:10');
  });

  it('hides database column names from errors', () => {
    const raw = 'null value in column "users.access_token" violates not-null constraint';
    const sanitized = sanitizeErrorMessage(raw);
    expect(sanitized).not.toContain('users.access_token');
    expect(sanitized).toContain('[redacted]');
  });

  it('filters API keys from error output', () => {
    const raw = 'Request failed: apikey=sk-1234567890abcdef token=eyJhbGci...';
    const sanitized = sanitizeErrorMessage(raw);
    expect(sanitized).not.toContain('sk-1234567890abcdef');
    expect(sanitized).not.toContain('eyJhbGci');
  });

  it('masks database connection strings', () => {
    const raw = 'Connection error: postgresql://admin:secret@db.host.com:5432/production';
    const sanitized = sanitizeErrorMessage(raw);
    expect(sanitized).not.toContain('admin:secret');
    expect(sanitized).not.toContain('db.host.com');
    expect(sanitized).toContain('[redacted]');
  });

  it('preserves safe user-facing error messages', () => {
    const safe = 'Network connection failed. Please try again later.';
    const sanitized = sanitizeErrorMessage(safe);
    expect(sanitized).toBe(safe);
  });
});

// ---------------------------------------------------------------------------
// 6. Authentication Flow
// ---------------------------------------------------------------------------
describe('Security: Authentication flow', () => {
  it('correctly identifies expired sessions', () => {
    interface MinimalSession {
      user: { id: string };
      expires_at?: number;
    }

    function isSessionValid(session: MinimalSession | null): boolean {
      if (!session) return false;
      if (!session.expires_at) return false;
      // expires_at is Unix timestamp in seconds
      return session.expires_at > Math.floor(Date.now() / 1000);
    }

    const now = Math.floor(Date.now() / 1000);
    expect(isSessionValid(null)).toBe(false);
    expect(isSessionValid({ user: { id: '1' } })).toBe(false); // no expiry
    expect(isSessionValid({ user: { id: '1' }, expires_at: now - 60 })).toBe(false);
    expect(isSessionValid({ user: { id: '1' }, expires_at: now + 3600 })).toBe(true);
  });

  it('validates redirect URLs to prevent open redirect attacks', () => {
    const ALLOWED_ORIGINS = ['https://gandx.net', 'http://localhost:3000'];

    function isValidRedirect(url: string): boolean {
      // Reject protocol-relative URLs
      if (url.startsWith('//')) return false;
      // Reject javascript: and data: schemes
      if (/^(javascript|data|vbscript):/i.test(url)) return false;
      // Allow relative paths
      if (url.startsWith('/') && !url.startsWith('//')) return true;
      // For absolute URLs, check origin whitelist
      try {
        const parsed = new URL(url);
        return ALLOWED_ORIGINS.includes(parsed.origin);
      } catch {
        return false;
      }
    }

    expect(isValidRedirect('/dashboard')).toBe(true);
    expect(isValidRedirect('/auth/callback')).toBe(true);
    expect(isValidRedirect('https://gandx.net/login')).toBe(true);
    expect(isValidRedirect('https://evil.com/phish')).toBe(false);
    expect(isValidRedirect('//evil.com/redirect')).toBe(false);
    expect(isValidRedirect('javascript:alert(1)')).toBe(false);
    expect(isValidRedirect('data:text/html,<h1>pwned</h1>')).toBe(false);
  });

  it('validates OAuth state parameter format (anti-CSRF)', () => {
    // State should be a random hex string of sufficient entropy (>= 32 chars)
    const STATE_PATTERN = /^[a-f0-9]{32,64}$/;

    function isValidOAuthState(state: string | null | undefined): boolean {
      if (!state) return false;
      return STATE_PATTERN.test(state);
    }

    expect(isValidOAuthState('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(true); // 32 hex
    expect(isValidOAuthState(null)).toBe(false);
    expect(isValidOAuthState('')).toBe(false);
    expect(isValidOAuthState('short')).toBe(false);
    expect(isValidOAuthState('ZZZZ not hex at all!!')).toBe(false);
  });

  it('rejects session tokens that contain prototype pollution keys in raw JSON', () => {
    function isSafeTokenJson(raw: string): boolean {
      // Block __proto__, constructor, and prototype keys in raw JSON strings
      return !/__proto__|"constructor"|"prototype"/i.test(raw);
    }

    expect(isSafeTokenJson('{"sub":"123","role":"user"}')).toBe(true);
    expect(isSafeTokenJson('{"sub":"123","__proto__":{"admin":true}}')).toBe(false);
    expect(isSafeTokenJson('{"sub":"123","constructor":"Object"}')).toBe(false);
    expect(isSafeTokenJson('{"sub":"123","prototype":{"isAdmin":true}}')).toBe(false);
  });

  it('enforces password complexity requirements', () => {
    function isStrongPassword(pw: string): { valid: boolean; reason?: string } {
      if (pw.length < 8) return { valid: false, reason: 'Too short' };
      if (!/[A-Z]/.test(pw)) return { valid: false, reason: 'Missing uppercase' };
      if (!/[a-z]/.test(pw)) return { valid: false, reason: 'Missing lowercase' };
      if (!/[0-9]/.test(pw)) return { valid: false, reason: 'Missing digit' };
      return { valid: true };
    }

    expect(isStrongPassword('Str0ngPa$$').valid).toBe(true);
    expect(isStrongPassword('short').valid).toBe(false);
    expect(isStrongPassword('alllowercase1').valid).toBe(false);
    expect(isStrongPassword('ALLUPPERCASE1').valid).toBe(false);
    expect(isStrongPassword('NoDigitsHere!').valid).toBe(false);
  });
});
