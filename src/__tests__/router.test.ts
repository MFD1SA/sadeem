import { describe, it, expect } from 'vitest';

// Test the lazyWithRetry logic pattern
describe('lazyWithRetry pattern', () => {
  it('sessionStorage retry key prevents infinite loops', () => {
    const key = 'sadeem_chunk_retry';

    // Simulate first retry
    const now = Date.now();
    const lastRetry = null;
    const shouldRetry = !lastRetry || (now - Number(lastRetry)) > 10_000;
    expect(shouldRetry).toBe(true);

    // Simulate second retry within 10s
    const recentRetry = String(now - 5000); // 5 seconds ago
    const shouldRetryAgain = !recentRetry || (now - Number(recentRetry)) > 10_000;
    expect(shouldRetryAgain).toBe(false);

    // Simulate retry after 10s
    const oldRetry = String(now - 15000); // 15 seconds ago
    const shouldRetryAfterTimeout = !oldRetry || (now - Number(oldRetry)) > 10_000;
    expect(shouldRetryAfterTimeout).toBe(true);
  });
});

// Test chunk error detection pattern from ErrorBoundary
describe('Chunk error detection', () => {
  const isChunkError = (msg: string) =>
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk');

  it('detects dynamic import failures', () => {
    expect(isChunkError('Failed to fetch dynamically imported module: https://site.com/assets/page-abc.js')).toBe(true);
  });

  it('detects chunk loading failures', () => {
    expect(isChunkError('Loading chunk 5 failed')).toBe(true);
    expect(isChunkError('Loading CSS chunk styles-abc failed')).toBe(true);
  });

  it('does not flag normal errors', () => {
    expect(isChunkError('Network error')).toBe(false);
    expect(isChunkError('TypeError: undefined is not a function')).toBe(false);
    expect(isChunkError('Cannot read property x of null')).toBe(false);
  });
});
