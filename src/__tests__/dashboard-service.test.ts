import { describe, it, expect, vi } from 'vitest';

// Mock supabase
const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { dashboardService } from '@/services/dashboard';

describe('dashboardService.getStats', () => {
  it('throws on query error', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ data: null, error: { message: 'DB error' } }),
      }),
    });

    await expect(dashboardService.getStats('org1')).rejects.toEqual({ message: 'DB error' });
  });

  it('returns correct stats for reviews', async () => {
    const today = new Date().toISOString().split('T')[0];
    const mockReviews = [
      { id: '1', rating: 5, status: 'replied', published_at: `${today}T10:00:00Z` },
      { id: '2', rating: 3, status: 'new', published_at: `${today}T12:00:00Z` },
      { id: '3', rating: 1, status: 'pending_reply', published_at: '2024-01-01T00:00:00Z' },
      { id: '4', rating: 4, status: 'auto_replied', published_at: '2024-01-01T00:00:00Z' },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: () => ({
            eq: () => ({ data: mockReviews, error: null }),
          }),
        };
      }
      if (table === 'branches') {
        return {
          select: () => ({
            eq: () => ({ count: 3, data: null, error: null }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ data: null, error: null }) }) };
    });

    const stats = await dashboardService.getStats('org1');

    expect(stats.totalReviews).toBe(4);
    expect(stats.unrepliedCount).toBe(2); // 'new' + 'pending_reply'
    expect(stats.avgRating).toBe(3.3); // (5+3+1+4)/4 = 3.25 → rounded to 3.3
    expect(stats.newReviewsToday).toBe(2);
    expect(stats.totalBranches).toBe(3);
    expect(stats.responseRate).toBe(50); // 2 replied / 4 total
  });

  it('handles empty reviews', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
      }
      if (table === 'branches') {
        return { select: () => ({ eq: () => ({ count: 0, data: null, error: null }) }) };
      }
      return { select: () => ({ eq: () => ({ data: null, error: null }) }) };
    });

    const stats = await dashboardService.getStats('org1');
    expect(stats.totalReviews).toBe(0);
    expect(stats.avgRating).toBe(0);
    expect(stats.responseRate).toBe(0);
    expect(stats.newReviewsToday).toBe(0);
  });

  it('handles null published_at safely', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'reviews') {
        return {
          select: () => ({
            eq: () => ({
              data: [{ id: '1', rating: 4, status: 'new', published_at: null }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'branches') {
        return { select: () => ({ eq: () => ({ count: 1, data: null, error: null }) }) };
      }
      return { select: () => ({ eq: () => ({ data: null, error: null }) }) };
    });

    const stats = await dashboardService.getStats('org1');
    expect(stats.totalReviews).toBe(1);
    expect(stats.newReviewsToday).toBe(0); // null published_at won't match today
  });
});

describe('dashboardService.getCriticalReviews', () => {
  it('returns critical reviews', async () => {
    const mockCritical = [
      { id: '1', rating: 1, status: 'new', reviewer_name: 'Test' },
    ];

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          in: () => ({
            lte: () => ({
              order: () => ({
                limit: () => ({ data: mockCritical, error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const reviews = await dashboardService.getCriticalReviews('org1');
    expect(reviews).toHaveLength(1);
    expect(reviews[0].id).toBe('1');
  });

  it('returns empty array on no results', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          in: () => ({
            lte: () => ({
              order: () => ({
                limit: () => ({ data: [], error: null }),
              }),
            }),
          }),
        }),
      }),
    });

    const reviews = await dashboardService.getCriticalReviews('org1');
    expect(reviews).toHaveLength(0);
  });
});
