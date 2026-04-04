import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockInsert = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
    }),
  },
}));

import { auditLog } from '@/services/audit';

describe('auditLog', () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it('track method queues event without throwing', () => {
    // track is fire-and-forget, should never throw
    expect(() => {
      auditLog.track({
        event: 'sync_completed',
        organization_id: 'org-1',
        entity_id: 'review-1',
        entity_type: 'review',
        actor_type: 'system',
      });
    }).not.toThrow();
  });

  it('trackNow calls supabase insert', async () => {
    mockInsert.mockResolvedValue({ error: null });

    await auditLog.trackNow({
      event: 'draft_created',
      organization_id: 'org-1',
      entity_id: 'draft-1',
      entity_type: 'draft',
      user_id: 'user-1',
      actor_type: 'user',
    });

    expect(mockInsert).toHaveBeenCalled();
  });

  it('trackNow does not throw on insert failure', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    // Should not throw even on error — audit is non-critical
    await expect(
      auditLog.trackNow({
        event: 'reply_send_failed',
        organization_id: 'org-1',
        entity_id: 'draft-1',
        entity_type: 'draft',
        actor_type: 'system',
      })
    ).resolves.not.toThrow();
  });
});
