import { describe, it, expect } from 'vitest';
import { renderStars, cn, getStatusColor, getSentimentColor, formatTimeAgo, formatDate, formatDateTime } from '@/utils/helpers';

// ─── renderStars ────────────────────────────────────────────────────────────

describe('renderStars', () => {
  it('renders 5 filled stars for rating 5', () => {
    expect(renderStars(5)).toBe('★★★★★');
  });

  it('renders 0 filled stars for rating 0', () => {
    expect(renderStars(0)).toBe('☆☆☆☆☆');
  });

  it('renders 3 filled + 2 empty for rating 3', () => {
    expect(renderStars(3)).toBe('★★★☆☆');
  });

  it('floors decimal ratings', () => {
    expect(renderStars(4.7)).toBe('★★★★☆');
    expect(renderStars(2.3)).toBe('★★☆☆☆');
  });

  it('always returns a 5-character string', () => {
    for (let r = 0; r <= 5; r++) {
      expect(renderStars(r)).toHaveLength(5);
    }
  });
});

// ─── cn (classNames) ────────────────────────────────────────────────────────

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns empty string for no truthy classes', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('handles single class', () => {
    expect(cn('single')).toBe('single');
  });
});

// ─── getStatusColor ─────────────────────────────────────────────────────────

describe('getStatusColor', () => {
  it('returns success for active statuses', () => {
    expect(getStatusColor('active')).toBe('success');
    expect(getStatusColor('replied')).toBe('success');
    expect(getStatusColor('auto_replied')).toBe('success');
    expect(getStatusColor('sent')).toBe('success');
    expect(getStatusColor('resolved')).toBe('success');
  });

  it('returns info for new/open statuses', () => {
    expect(getStatusColor('new')).toBe('info');
    expect(getStatusColor('open')).toBe('info');
    expect(getStatusColor('trial')).toBe('info');
  });

  it('returns warning for pending statuses', () => {
    expect(getStatusColor('pending')).toBe('warning');
    expect(getStatusColor('pending_reply')).toBe('warning');
    expect(getStatusColor('deferred')).toBe('warning');
  });

  it('returns danger for negative statuses', () => {
    expect(getStatusColor('negative')).toBe('danger');
    expect(getStatusColor('flagged')).toBe('danger');
    expect(getStatusColor('error')).toBe('danger');
    expect(getStatusColor('expired')).toBe('danger');
  });

  it('returns neutral for unknown statuses', () => {
    expect(getStatusColor('unknown_status')).toBe('neutral');
    expect(getStatusColor('')).toBe('neutral');
  });
});

// ─── getSentimentColor ──────────────────────────────────────────────────────

describe('getSentimentColor', () => {
  it('maps sentiments correctly', () => {
    expect(getSentimentColor('positive')).toBe('success');
    expect(getSentimentColor('neutral')).toBe('warning');
    expect(getSentimentColor('negative')).toBe('danger');
  });

  it('returns neutral for unknown sentiment', () => {
    expect(getSentimentColor('unknown')).toBe('neutral');
  });
});

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns fallback for invalid date', () => {
    const result = formatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});

// ─── formatDateTime ─────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('formats a valid ISO datetime string', () => {
    const result = formatDateTime('2024-06-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns fallback for invalid datetime', () => {
    const result = formatDateTime('invalid');
    expect(typeof result).toBe('string');
  });
});

// ─── formatTimeAgo ──────────────────────────────────────────────────────────

describe('formatTimeAgo', () => {
  it('returns "الآن" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('الآن');
  });

  it('returns minutes ago for timestamps within the hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(fiveMinAgo)).toMatch(/منذ 5 دقيقة/);
  });

  it('returns hours ago for timestamps within 24h', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toMatch(/منذ 3 ساعة/);
  });

  it('returns days ago for timestamps within a week', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toMatch(/منذ 2 يوم/);
  });
});
