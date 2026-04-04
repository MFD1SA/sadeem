import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase mock ───
const mockRpc = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...a: unknown[]) => mockRpc(...a),
    from: () => ({
      select: (...a: unknown[]) => {
        mockSelect(...a);
        return {
          eq: (...e: unknown[]) => {
            mockEq(...e);
            return {
              order: (...o: unknown[]) => {
                mockOrder(...o);
                return {
                  limit: (...l: unknown[]) => {
                    mockLimit(...l);
                    return { single: () => mockSingle() };
                  },
                };
              },
            };
          },
        };
      },
    }),
  },
}));

vi.mock('@/types/subscription', () => ({
  TRIAL_LIMITS: { maxBranches: 1, maxAiReplies: 2, maxTemplateReplies: 10 },
}));

import { usageService } from '@/services/usage';

describe('usageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── checkAndIncrementAiReply ───

  it('checkAndIncrementAiReply returns allowed:true when RPC returns true', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const result = await usageService.checkAndIncrementAiReply('org-1');
    expect(result).toEqual({ allowed: true });
    expect(mockRpc).toHaveBeenCalledWith('increment_ai_reply', { org_id: 'org-1' });
  });

  it('checkAndIncrementAiReply returns allowed:false with reason on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'timeout' } });

    const result = await usageService.checkAndIncrementAiReply('org-1');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Service temporarily unavailable');
  });

  it('checkAndIncrementAiReply returns limit-reached when RPC returns false', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const result = await usageService.checkAndIncrementAiReply('org-1');
    expect(result).toEqual({ allowed: false, reason: 'AI reply limit reached' });
  });

  // ─── checkAndIncrementTemplateReply ───

  it('checkAndIncrementTemplateReply returns allowed:true on success', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });

    const result = await usageService.checkAndIncrementTemplateReply('org-1');
    expect(result).toEqual({ allowed: true });
    expect(mockRpc).toHaveBeenCalledWith('increment_template_reply', { org_id: 'org-1' });
  });

  it('checkAndIncrementTemplateReply returns limit-reached message', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });

    const result = await usageService.checkAndIncrementTemplateReply('org-1');
    expect(result.reason).toBe('Template reply limit reached');
  });

  // ─── getTrialStatus ───

  it('getTrialStatus returns defaults when subscription not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } });

    const result = await usageService.getTrialStatus('org-1');
    expect(result.isTrial).toBe(false);
    expect(result.aiUsed).toBe(0);
    expect(result.aiMax).toBe(0);
  });

  it('getTrialStatus correctly identifies an expired trial', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
    mockSingle.mockResolvedValue({
      data: {
        status: 'trial',
        ends_at: pastDate,
        ai_replies_used: 1,
        template_replies_used: 5,
      },
      error: null,
    });

    const result = await usageService.getTrialStatus('org-1');
    expect(result.isTrial).toBe(true);
    expect(result.isExpired).toBe(true);
    expect(result.hoursRemaining).toBe(0);
    expect(result.aiMax).toBe(2); // TRIAL_LIMITS.maxAiReplies
    expect(result.templateMax).toBe(10); // TRIAL_LIMITS.maxTemplateReplies
  });

  it('getTrialStatus computes hoursRemaining for active trial', async () => {
    const futureDate = new Date(Date.now() + 48 * 3600000).toISOString(); // 48h from now
    mockSingle.mockResolvedValue({
      data: {
        status: 'trial',
        ends_at: futureDate,
        ai_replies_used: 0,
        template_replies_used: 0,
      },
      error: null,
    });

    const result = await usageService.getTrialStatus('org-1');
    expect(result.isTrial).toBe(true);
    expect(result.isExpired).toBe(false);
    // Should be around 47-48 hours
    expect(result.hoursRemaining).toBeGreaterThanOrEqual(47);
    expect(result.hoursRemaining).toBeLessThanOrEqual(48);
  });
});
