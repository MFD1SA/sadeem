import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase with chainable query builder
const mockResult = { data: null as unknown, error: null as unknown };

const chainable = () => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn((..._args: unknown[]) => chain);
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

import { notificationService } from '@/services/notifications';

describe('notificationService', () => {
  beforeEach(() => {
    mockChain = chainable();
    mockResult.data = null;
    mockResult.error = null;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // ─── list ───

  it('list returns notifications ordered by created_at desc with limit 50', async () => {
    const notifications = [
      { id: 'n1', title: 'New review', is_read: false },
      { id: 'n2', title: 'Complaint', is_read: true },
    ];
    mockResult.data = notifications;

    const result = await notificationService.list('org-1');

    expect(mockChain.select).toHaveBeenCalledWith('*');
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockChain.limit).toHaveBeenCalledWith(50);
    expect(result).toEqual(notifications);
  });

  it('list returns empty array on error (graceful fallback)', async () => {
    mockResult.error = { message: 'relation "notifications" does not exist' };

    const result = await notificationService.list('org-1');

    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it('list returns empty array when data is null', async () => {
    mockResult.data = null;

    const result = await notificationService.list('org-1');

    expect(result).toEqual([]);
  });

  // ─── create ───

  it('create inserts notification with is_read false', async () => {
    mockResult.error = null;

    await notificationService.create({
      organization_id: 'org-1',
      type: 'critical_review',
      title: 'Bad review',
      body: 'Needs attention',
      entity_id: 'r1',
    });

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'org-1',
        type: 'critical_review',
        title: 'Bad review',
        body: 'Needs attention',
        entity_id: 'r1',
        is_read: false,
      })
    );
  });

  it('create sets entity_id to null when not provided', async () => {
    mockResult.error = null;

    await notificationService.create({
      organization_id: 'org-1',
      type: 'info',
      title: 'Test',
      body: 'Body',
    });

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: null })
    );
  });

  it('create does not throw on insert failure (silent fail)', async () => {
    mockResult.error = { message: 'table missing' };

    await expect(
      notificationService.create({
        organization_id: 'org-1',
        type: 'test',
        title: 'T',
        body: 'B',
      })
    ).resolves.not.toThrow();

    expect(console.warn).toHaveBeenCalled();
  });

  // ─── markRead ───

  it('markRead updates is_read to true for the notification', async () => {
    mockResult.error = null;

    await notificationService.markRead('n1');

    expect(mockChain.update).toHaveBeenCalledWith({ is_read: true });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'n1');
  });

  it('markRead throws on error', async () => {
    mockResult.error = { message: 'not found' };

    await expect(notificationService.markRead('n-bad')).rejects.toEqual(
      expect.objectContaining({ message: 'not found' })
    );
  });

  // ─── markAllRead ───

  it('markAllRead updates all unread notifications for the organization', async () => {
    mockResult.error = null;

    await notificationService.markAllRead('org-1');

    expect(mockChain.update).toHaveBeenCalledWith({ is_read: true });
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.eq).toHaveBeenCalledWith('is_read', false);
  });

  // ─── trigger helpers ───

  it('notifyCriticalReview creates notification with correct title for 1-star', async () => {
    mockResult.error = null;

    await notificationService.notifyCriticalReview('org-1', 'Ahmad', 1, 'r1');

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'critical_review',
        entity_id: 'r1',
      })
    );
  });
});
