import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let listResult: { data: unknown; error: unknown };
let subscriptionResult: { data: unknown; error?: unknown };
let countResult: { count: number | null; error: unknown };
let insertResult: { data: unknown; error: unknown };
let updateResult: { data: unknown; error: unknown };
let deleteResult: { error: unknown };

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve(subscriptionResult),
              }),
            }),
          }),
        };
      }
      // reply_templates
      return {
        select: (...a: unknown[]) => {
          // Detect the count query: select('id', { count: 'exact', head: true })
          if (a.length >= 2 && typeof a[1] === 'object' && (a[1] as any)?.count === 'exact') {
            return {
              eq: () => Promise.resolve(countResult),
            };
          }
          return {
            eq: () => ({
              order: () => Promise.resolve(listResult),
            }),
          };
        },
        insert: (...a: unknown[]) => {
          mockInsert(...a);
          return {
            select: () => ({
              single: () => Promise.resolve(insertResult),
            }),
          };
        },
        update: (...a: unknown[]) => {
          mockUpdate(...a);
          return {
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve(updateResult),
              }),
            }),
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: () => Promise.resolve(deleteResult),
          };
        },
      };
    },
  },
}));

// Mock the subscription module
vi.mock('@/types/subscription', () => ({
  getPlanLimits: () => ({ templateCount: 10 }),
  PLANS: { orbit: { templateCount: 10 }, nova: { templateCount: 50 } },
}));

import { templatesService } from '@/services/templates';

describe('templatesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listResult = { data: [], error: null };
    subscriptionResult = { data: { plan: 'orbit' } };
    countResult = { count: 0, error: null };
    insertResult = { data: null, error: null };
    updateResult = { data: null, error: null };
    deleteResult = { error: null };
  });

  // ─── list ───

  it('list returns templates for an organization', async () => {
    const templates = [{ id: 'tpl-1', name: 'Welcome' }];
    listResult = { data: templates, error: null };

    const result = await templatesService.list('org-1');
    expect(result).toEqual(templates);
  });

  it('list throws on query error', async () => {
    const err = { message: 'access denied' };
    listResult = { data: null, error: err };

    await expect(templatesService.list('org-1')).rejects.toEqual(err);
  });

  it('list returns empty array when data is null but no error', async () => {
    listResult = { data: null, error: null };
    const result = await templatesService.list('org-1');
    expect(result).toEqual([]);
  });

  // ─── create ───

  it('create inserts a template with default is_active and language', async () => {
    countResult = { count: 0, error: null };
    const created = { id: 'tpl-new', name: 'Test', is_active: true, language: 'ar' };
    insertResult = { data: created, error: null };

    const result = await templatesService.create({
      organization_id: 'org-1',
      name: 'Test',
      body: 'Body',
      category: 'general',
      rating_min: 1,
      rating_max: 5,
    });

    expect(result).toEqual(created);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true, language: 'ar' })
    );
  });

  it('create throws when template limit is reached', async () => {
    countResult = { count: 10, error: null };

    await expect(
      templatesService.create({
        organization_id: 'org-1',
        name: 'Over',
        body: 'X',
        category: 'gen',
        rating_min: 1,
        rating_max: 5,
      })
    ).rejects.toThrow('Template limit reached');
  });

  it('create throws on count query error', async () => {
    countResult = { count: null, error: { message: 'count failed' } };

    await expect(
      templatesService.create({
        organization_id: 'org-1',
        name: 'X',
        body: 'X',
        category: 'x',
        rating_min: 1,
        rating_max: 5,
      })
    ).rejects.toEqual({ message: 'count failed' });
  });

  // ─── update ───

  it('update strips organization_id and id from updates before sending', async () => {
    const updated = { id: 'tpl-1', name: 'Renamed' };
    updateResult = { data: updated, error: null };

    await templatesService.update('tpl-1', {
      id: 'tpl-1',
      organization_id: 'org-1',
      name: 'Renamed',
    } as any);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.not.objectContaining({ id: 'tpl-1', organization_id: 'org-1' })
    );
  });

  // ─── remove ───

  it('remove deletes a template by id', async () => {
    deleteResult = { error: null };

    await templatesService.remove('tpl-1');
    expect(mockDelete).toHaveBeenCalled();
  });

  // ─── toggleActive ───

  it('toggleActive updates is_active flag', async () => {
    // toggleActive uses update().eq() which resolves to mutateResult via update mock
    // reuse updateResult path is fine since toggleActive doesn't call .select().single()
    // Actually toggleActive chain is: update().eq() -> no .select(), so we need a different shape.
    // The mock's update().eq() returns { select: ... } but the service doesn't call select.
    // The service just awaits the { error } from update().eq(). Our mock returns
    // { select: () => ... } which has no error property. Let's verify...
    // Actually the service does: const { error } = await supabase.from(...).update(...).eq(...)
    // Our mock for update().eq() returns { select: () => ({ single: () => ... }) }
    // Destructuring { error } from that gives undefined, so error is undefined, which is falsy, so it works.

    await templatesService.toggleActive('tpl-1', false);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
  });
});
