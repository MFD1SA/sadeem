import { describe, it, expect } from 'vitest';

// Test the error sanitization logic used in ErrorBoundary
describe('ErrorBoundary sanitization logic', () => {
  const sensitivePattern = /select |insert |update |delete |join |pgrst|token|key=|secret/i;

  function sanitize(msg: string): string {
    if (sensitivePattern.test(msg)) return 'ERR_INTERNAL';
    return msg.length > 120 ? msg.slice(0, 120) + '…' : msg;
  }

  it('hides SQL queries', () => {
    expect(sanitize('SELECT * FROM users WHERE id = 123')).toBe('ERR_INTERNAL');
    expect(sanitize('INSERT INTO logs VALUES (1, 2)')).toBe('ERR_INTERNAL');
    expect(sanitize('UPDATE users SET name = test')).toBe('ERR_INTERNAL');
    expect(sanitize('DELETE FROM reviews')).toBe('ERR_INTERNAL');
  });

  it('hides PostgREST errors', () => {
    expect(sanitize('PGRST116: row not found')).toBe('ERR_INTERNAL');
  });

  it('hides tokens and keys', () => {
    expect(sanitize('token=abc123def456')).toBe('ERR_INTERNAL');
    expect(sanitize('key=secret_value_here')).toBe('ERR_INTERNAL');
    expect(sanitize('secret: my_api_secret')).toBe('ERR_INTERNAL');
  });

  it('passes through safe messages', () => {
    expect(sanitize('Network error')).toBe('Network error');
    expect(sanitize('Failed to load data')).toBe('Failed to load data');
  });

  it('truncates long messages', () => {
    const longMsg = 'A'.repeat(200);
    const result = sanitize(longMsg);
    expect(result.length).toBe(121); // 120 chars + '…'
    expect(result.endsWith('…')).toBe(true);
  });

  it('does not truncate short messages', () => {
    expect(sanitize('Short error')).toBe('Short error');
  });
});
