import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let reviewsResult: { data: unknown; error: unknown };
let branchesResult: { data: unknown; error?: unknown };

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => ({
        eq: () => {
          if (table === 'reviews') return Promise.resolve(reviewsResult);
          // branches
          return Promise.resolve(branchesResult);
        },
      }),
    }),
  },
}));

import { analyticsService } from '@/services/analytics';

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reviewsResult = { data: [], error: null };
    branchesResult = { data: [], error: null };
  });

  it('getAnalytics throws on reviews query error', async () => {
    reviewsResult = { data: null, error: { message: 'fail' } };

    await expect(analyticsService.getAnalytics('org-1')).rejects.toBeTruthy();
  });

  it('getAnalytics returns zeroed analytics when no reviews exist', async () => {
    reviewsResult = { data: [], error: null };
    branchesResult = { data: [], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.avgRating).toBe(0);
    expect(result.totalReviews).toBe(0);
    expect(result.responseRate).toBe(0);
    expect(result.sentimentBreakdown).toEqual({ positive: 0, neutral: 0, negative: 0 });
    expect(result.branchStats).toEqual([]);
  });

  it('getAnalytics computes average rating correctly', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 5, status: 'new', sentiment: 'positive', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '2', rating: 3, status: 'new', sentiment: 'neutral', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = { data: [{ id: 'b1', internal_name: 'Main' }], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.avgRating).toBe(4); // (5+3)/2 = 4.0
    expect(result.totalReviews).toBe(2);
  });

  it('getAnalytics computes response rate from replied and auto_replied statuses', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 4, status: 'replied', sentiment: 'positive', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '2', rating: 3, status: 'auto_replied', sentiment: 'neutral', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '3', rating: 2, status: 'new', sentiment: 'negative', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = { data: [], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.responseRate).toBe(67); // 2/3 = 66.67 -> 67
  });

  it('getAnalytics builds correct rating distribution', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 1, status: 'new', sentiment: null, branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '2', rating: 1, status: 'new', sentiment: null, branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '3', rating: 5, status: 'new', sentiment: null, branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = { data: [], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.ratingDistribution[1]).toBe(2);
    expect(result.ratingDistribution[5]).toBe(1);
    expect(result.ratingDistribution[3]).toBe(0);
  });

  it('getAnalytics builds sentiment breakdown including null as neutral', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 4, status: 'new', sentiment: 'positive', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '2', rating: 2, status: 'new', sentiment: 'negative', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '3', rating: 3, status: 'new', sentiment: null, branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = { data: [], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.sentimentBreakdown).toEqual({ positive: 1, neutral: 1, negative: 1 });
  });

  it('getAnalytics aggregates branch stats with response rate per branch', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 5, status: 'replied', sentiment: 'positive', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '2', rating: 3, status: 'new', sentiment: 'neutral', branch_id: 'b1', published_at: '2025-01-01T00:00:00Z' },
        { id: '3', rating: 4, status: 'auto_replied', sentiment: 'positive', branch_id: 'b2', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = {
      data: [
        { id: 'b1', internal_name: 'Branch A' },
        { id: 'b2', internal_name: 'Branch B' },
      ],
      error: null,
    };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.branchStats).toHaveLength(2);

    const b1 = result.branchStats.find(b => b.branchId === 'b1')!;
    expect(b1.branchName).toBe('Branch A');
    expect(b1.count).toBe(2);
    expect(b1.avgRating).toBe(4); // (5+3)/2
    expect(b1.responseRate).toBe(50); // 1/2

    const b2 = result.branchStats.find(b => b.branchId === 'b2')!;
    expect(b2.branchName).toBe('Branch B');
    expect(b2.responseRate).toBe(100); // 1/1
  });

  it('getAnalytics uses branch id as name when branch not found in lookup', async () => {
    reviewsResult = {
      data: [
        { id: '1', rating: 3, status: 'new', sentiment: null, branch_id: 'unknown-branch', published_at: '2025-01-01T00:00:00Z' },
      ],
      error: null,
    };
    branchesResult = { data: [], error: null };

    const result = await analyticsService.getAnalytics('org-1');
    expect(result.branchStats).toHaveLength(1);
    expect(result.branchStats[0].branchName).toBe('unknown-branch');
  });
});
