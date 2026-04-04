import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase with chainable query builder
const mockResult = { data: null as unknown, error: null as unknown };

const chainable = () => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'single', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn((..._args: unknown[]) => {
      if (m === 'single') return Promise.resolve(mockResult);
      return chain;
    });
  }
  (chain as Record<string, unknown>).then = (
    resolve: (v: unknown) => unknown,
    reject?: (e: unknown) => unknown
  ) => Promise.resolve(mockResult).then(resolve, reject);
  return chain;
};

let mockChain: ReturnType<typeof chainable>;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => mockChain,
  },
}));

// Mock audit service (used by replyDraftsService)
vi.mock('@/services/audit', () => ({
  auditLog: {
    track: vi.fn(),
    trackNow: vi.fn(),
  },
}));

import { reviewsService, replyDraftsService } from '@/services/reviews';

describe('reviewsService', () => {
  beforeEach(() => {
    mockChain = chainable();
    mockResult.data = null;
    mockResult.error = null;
  });

  // ─── list ───

  it('list returns reviews for an organization with no filters', async () => {
    const reviews = [{ id: 'r1', rating: 5 }, { id: 'r2', rating: 3 }];
    mockResult.data = reviews;

    const result = await reviewsService.list('org-1');

    expect(mockChain.select).toHaveBeenCalledWith('*');
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(result).toEqual(reviews);
  });

  it('list applies branchId and rating filters when provided', async () => {
    mockResult.data = [];

    await reviewsService.list('org-1', { branchId: 'b1', rating: 1 });

    // organization_id, branch_id, rating
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.eq).toHaveBeenCalledWith('branch_id', 'b1');
    expect(mockChain.eq).toHaveBeenCalledWith('rating', 1);
  });

  it('list returns empty array when data is null', async () => {
    mockResult.data = null;

    const result = await reviewsService.list('org-1');

    expect(result).toEqual([]);
  });

  it('list throws on database error', async () => {
    mockResult.error = { message: 'permission denied' };

    await expect(reviewsService.list('org-1')).rejects.toEqual(
      expect.objectContaining({ message: 'permission denied' })
    );
  });

  // ─── isFollowUp ───

  it('isFollowUp returns false when reviewerGoogleId is null', async () => {
    const result = await reviewsService.isFollowUp('b1', null);

    expect(result).toBe(false);
    // Should not have called supabase at all
    expect(mockChain.select).not.toHaveBeenCalled();
  });

  it('isFollowUp returns true when previous replied review exists', async () => {
    mockResult.data = [{ id: 'r-old' }];

    const result = await reviewsService.isFollowUp('b1', 'google-123');

    expect(result).toBe(true);
    expect(mockChain.in).toHaveBeenCalledWith('status', ['replied', 'auto_replied']);
    expect(mockChain.limit).toHaveBeenCalledWith(1);
  });

  it('isFollowUp returns false when no previous review found', async () => {
    mockResult.data = [];

    const result = await reviewsService.isFollowUp('b1', 'google-456');

    expect(result).toBe(false);
  });

  // ─── updateStatus ───

  it('updateStatus sets status on the review', async () => {
    mockResult.error = null;

    await reviewsService.updateStatus('r1', 'replied');

    expect(mockChain.update).toHaveBeenCalledWith({ status: 'replied' });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'r1');
  });
});

describe('replyDraftsService', () => {
  beforeEach(() => {
    mockChain = chainable();
    mockResult.data = null;
    mockResult.error = null;
  });

  // ─── list ───

  it('list returns drafts for organization, optionally filtered by status', async () => {
    mockResult.data = [{ id: 'd1', status: 'pending' }];

    const result = await replyDraftsService.list('org-1', 'pending');

    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
    expect(result).toEqual([{ id: 'd1', status: 'pending' }]);
  });

  // ─── create ───

  it('create inserts a draft with status pending and returns it', async () => {
    const draft = { id: 'd2', status: 'pending', review_id: 'r1' };
    mockResult.data = draft;

    const result = await replyDraftsService.create({
      review_id: 'r1',
      organization_id: 'org-1',
      ai_reply: 'Thank you!',
      source: 'ai',
    });

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        review_id: 'r1',
        organization_id: 'org-1',
        ai_reply: 'Thank you!',
        edited_reply: null,
        source: 'ai',
        status: 'pending',
      })
    );
    expect(result).toEqual(draft);
  });

  it('create prevents duplicate in-flight requests for the same review', async () => {
    // Make the first call hang indefinitely
    const neverResolve = new Promise<{ data: unknown; error: unknown }>(() => {});
    const originalInsert = mockChain.insert as ReturnType<typeof vi.fn>;

    // First call: insert returns a chain whose .then never resolves
    let callCount = 0;
    originalInsert.mockImplementation(() => {
      callCount++;
      const fakeChain = { ...mockChain };
      (fakeChain as Record<string, unknown>).then = (
        resolve: (v: unknown) => unknown,
        reject?: (e: unknown) => unknown
      ) => neverResolve.then(resolve, reject);
      fakeChain.select = vi.fn(() => {
        const inner = { ...fakeChain };
        inner.single = vi.fn(() => neverResolve);
        return inner;
      });
      return fakeChain;
    });

    // Start first request (will hang)
    const first = replyDraftsService.create({
      review_id: 'r-dup',
      organization_id: 'org-1',
      source: 'ai',
    });

    // Second request for same review_id should throw immediately
    await expect(
      replyDraftsService.create({
        review_id: 'r-dup',
        organization_id: 'org-1',
        source: 'ai',
      })
    ).rejects.toThrow('Draft creation already in progress for this review');

    // Clean up: we don't await `first` since it never resolves
  });
});
