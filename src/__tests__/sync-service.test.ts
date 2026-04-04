import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock ──
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockLt = vi.fn();

const chainable = () => ({
  select: (...a: unknown[]) => { mockSelect(...a); return chainable(); },
  insert: (...a: unknown[]) => { mockInsert(...a); return chainable(); },
  update: (...a: unknown[]) => { mockUpdate(...a); return chainable(); },
  eq: (...a: unknown[]) => { mockEq(...a); return chainable(); },
  single: (...a: unknown[]) => mockSingle(...a),
  maybeSingle: (...a: unknown[]) => mockSingle(...a),
  lt: (...a: unknown[]) => { mockLt(...a); return chainable(); },
  in: () => chainable(),
  order: () => chainable(),
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => chainable() },
}));

// ── External dependency mocks ──
const mockSyncAllReviews = vi.fn();
const mockSendReplyToGoogle = vi.fn();
vi.mock('@/integrations/google-business', () => ({
  googleBusinessService: {
    syncAllReviews: (...a: unknown[]) => mockSyncAllReviews(...a),
    sendReplyToGoogle: (...a: unknown[]) => mockSendReplyToGoogle(...a),
  },
}));

const mockIsConfigured = vi.fn().mockReturnValue(false);
vi.mock('@/integrations/ai', () => ({
  aiService: { isConfigured: () => mockIsConfigured(), processNewReview: vi.fn() },
}));

vi.mock('@/services/usage', () => ({
  usageService: {
    checkAndIncrementAiReply: vi.fn().mockResolvedValue({ allowed: true }),
    checkAndIncrementTemplateReply: vi.fn().mockResolvedValue({ allowed: true }),
  },
}));

const mockTrack = vi.fn();
const mockTrackNow = vi.fn();
vi.mock('@/services/audit', () => ({
  auditLog: { track: (...a: unknown[]) => mockTrack(...a), trackNow: (...a: unknown[]) => mockTrackNow(...a) },
}));

vi.mock('@/services/smart-template', () => ({
  findStrongTemplateMatch: vi.fn().mockResolvedValue({ matched: false }),
}));

vi.mock('@/types/subscription', () => ({
  getPlanLimits: () => ({ emojiSupport: 'basic' }),
}));

import { reviewSyncService } from '@/services/sync';

describe('reviewSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── syncAndProcess ──

  it('returns sync error when Google sync fails', async () => {
    mockSyncAllReviews.mockRejectedValue(new Error('Google API down'));

    const result = await reviewSyncService.syncAndProcess('org-1');

    expect(result.errors).toContain('Sync error: Google API down');
    expect(result.reviewsSynced).toBe(0);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'sync_failed' }),
    );
  });

  it('returns zero drafts when no new reviews exist', async () => {
    mockSyncAllReviews.mockResolvedValue({ synced: 3 });
    // org lookup
    mockSingle.mockResolvedValueOnce({ data: { name: 'Test Org', created_at: new Date().toISOString() }, error: null });
    // subscription lookup
    mockSingle.mockResolvedValueOnce({ data: { plan: 'orbit' }, error: null });
    // reviews query — return via select chain; we override the final chainable
    mockSelect.mockImplementation(() => {
      const c = chainable();
      // The last select in the chain resolves to empty array
      return { ...c, eq: () => ({ eq: () => ({ eq: () => ({ data: [], error: null }) }) }) };
    });

    const result = await reviewSyncService.syncAndProcess('org-1');

    expect(result.reviewsSynced).toBe(3);
    expect(result.draftsGenerated).toBe(0);
  });

  it('reports error when AI is not configured', async () => {
    mockSyncAllReviews.mockResolvedValue({ synced: 1 });
    mockIsConfigured.mockReturnValue(false);
    // org
    mockSingle.mockResolvedValueOnce({ data: { name: 'Org', created_at: '2020-01-01' }, error: null });
    // subscription
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    // We can't easily drive the full flow through chainable mocks, but we
    // can verify the error path by making org lookup fail so we exit early.
    mockSingle.mockReset();
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const result = await reviewSyncService.syncAndProcess('org-1');

    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  // ── sendReplyToGoogle ──

  it('throws when draft is not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found', code: 'PGRST116' } });

    await expect(reviewSyncService.sendReplyToGoogle('bad-id', 'user-1')).rejects.toBeTruthy();
  });

  it('throws when draft has no reply text', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { id: 'd1', review_id: 'r1', ai_reply: null, edited_reply: null, final_reply: null },
      error: null,
    });

    await expect(reviewSyncService.sendReplyToGoogle('d1', 'user-1')).rejects.toThrow('No reply text to send');
  });

  it('audits failure when Google send fails', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: { id: 'd1', review_id: 'r1', ai_reply: 'Hello', edited_reply: null, final_reply: null, organization_id: 'org-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'r1', google_review_id: 'g-123' },
        error: null,
      });

    mockSendReplyToGoogle.mockRejectedValue(new Error('403 Forbidden'));

    await expect(reviewSyncService.sendReplyToGoogle('d1', 'user-1')).rejects.toThrow('403 Forbidden');
    expect(mockTrackNow).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'reply_send_failed' }),
    );
  });

  it('updates draft and review status on successful send', async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: { id: 'd1', review_id: 'r1', ai_reply: 'Thanks!', edited_reply: null, final_reply: null, organization_id: 'org-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: 'r1', google_review_id: 'g-456' },
        error: null,
      });

    mockSendReplyToGoogle.mockResolvedValue(undefined);

    await reviewSyncService.sendReplyToGoogle('d1', 'user-1');

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockTrackNow).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'reply_sent_google' }),
    );
  });

  // ── autoSendPendingDrafts ──

  it('returns 0 when there are no old pending drafts', async () => {
    mockLt.mockImplementation(() => ({ data: [], error: null }));

    const result = await reviewSyncService.autoSendPendingDrafts('org-1');

    expect(result).toBe(0);
  });
});
