import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let membershipResult: { data: unknown; error: unknown };
let orgInsertResults: Array<{ data: unknown; error: unknown }>;
let orgInsertCallIndex: number;
let updateResult: { data: unknown; error: unknown };

const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'memberships' && orgInsertCallIndex === 0) {
        // This could be getUserOrganization or createOrganization membership insert
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: () => Promise.resolve(membershipResult),
                }),
              }),
            }),
          }),
          insert: (...a: unknown[]) => {
            mockInsert(...a);
            const idx = orgInsertCallIndex++;
            return {
              select: () => ({
                single: () => Promise.resolve(orgInsertResults[idx] || { data: null, error: null }),
              }),
            };
          },
        };
      }
      // organizations or memberships (for createOrg flow)
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve(membershipResult),
              }),
            }),
          }),
        }),
        insert: (...a: unknown[]) => {
          mockInsert(...a);
          const idx = orgInsertCallIndex++;
          return {
            select: () => ({
              single: () => Promise.resolve(orgInsertResults[idx] || { data: null, error: null }),
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
      };
    },
  },
}));

import { organizationService } from '@/services/organizations';

describe('organizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membershipResult = { data: null, error: null };
    orgInsertResults = [];
    orgInsertCallIndex = 0;
    updateResult = { data: null, error: null };
  });

  // ─── getUserOrganization ───

  it('getUserOrganization returns null when no membership exists', async () => {
    membershipResult = { data: null, error: null };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns null on query error', async () => {
    membershipResult = { data: null, error: { message: 'fail' } };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns null when membership has no joined org', async () => {
    membershipResult = {
      data: { user_id: 'user-1', organization_id: 'org-1', organizations: null },
      error: null,
    };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns org and cleaned membership on success', async () => {
    const org = { id: 'org-1', name: 'Acme' };
    membershipResult = {
      data: {
        user_id: 'user-1',
        organization_id: 'org-1',
        role: 'owner',
        status: 'active',
        organizations: org,
      },
      error: null,
    };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).not.toBeNull();
    expect(result!.org).toEqual(org);
    // The returned membership should NOT contain the nested organizations key
    expect((result!.membership as any).organizations).toBeUndefined();
  });

  // ─── createOrganization ───

  it('createOrganization generates a slug and creates org + membership', async () => {
    const org = { id: 'org-new', name: 'Test Org', slug: 'test-org-abc' };
    orgInsertResults = [
      { data: org, error: null },          // org insert
      { data: { id: 'mem-1' }, error: null }, // membership insert
    ];

    const result = await organizationService.createOrganization('user-1', {
      name: 'Test Org',
      industry: 'tech',
      country: 'SA',
      city: 'Riyadh',
    });

    expect(result).toEqual(org);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Org', owner_user_id: 'user-1' })
    );
  });

  it('createOrganization throws when org insert fails', async () => {
    const err = { message: 'insert failed' };
    orgInsertResults = [{ data: null, error: err }];

    await expect(
      organizationService.createOrganization('user-1', {
        name: 'Fail',
        industry: 'x',
        country: 'x',
        city: 'x',
      })
    ).rejects.toEqual(err);
  });

  it('createOrganization throws when membership insert returns null data', async () => {
    const org = { id: 'org-2', name: 'OK' };
    orgInsertResults = [
      { data: org, error: null },
      { data: null, error: null }, // no error, but no data either
    ];

    await expect(
      organizationService.createOrganization('user-1', {
        name: 'OK',
        industry: 'x',
        country: 'x',
        city: 'x',
      })
    ).rejects.toThrow('Membership was not created');
  });

  // ─── updateOrganization ───

  it('updateOrganization returns updated org on success', async () => {
    const updated = { id: 'org-1', name: 'New Name' };
    updateResult = { data: updated, error: null };

    const result = await organizationService.updateOrganization('org-1', { name: 'New Name' } as any);
    expect(result).toEqual(updated);
  });
});
