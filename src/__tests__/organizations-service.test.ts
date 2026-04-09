import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let rpcResult: { data: unknown; error: unknown };
let updateResult: { data: unknown; error: unknown };

const mockUpdate = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (_name: string, _params?: unknown) => Promise.resolve(rpcResult),
    from: () => ({
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
    }),
  },
}));

import { organizationService } from '@/services/organizations';

describe('organizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpcResult = { data: null, error: null };
    updateResult = { data: null, error: null };
  });

  // ─── getUserOrganization (now uses RPC get_my_organization) ───

  it('getUserOrganization returns null when RPC returns null', async () => {
    rpcResult = { data: null, error: null };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns null on RPC error', async () => {
    rpcResult = { data: null, error: { message: 'fail' } };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns null when RPC data has no org', async () => {
    rpcResult = { data: { org: null, membership: null }, error: null };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).toBeNull();
  });

  it('getUserOrganization returns org and membership on success', async () => {
    const org = { id: 'org-1', name: 'Acme' };
    const membership = { user_id: 'user-1', organization_id: 'org-1', role: 'owner', status: 'active' };
    rpcResult = { data: { org, membership }, error: null };

    const result = await organizationService.getUserOrganization('user-1');
    expect(result).not.toBeNull();
    expect(result!.org).toEqual(org);
    expect(result!.membership).toEqual(membership);
  });

  // ─── createOrganization (now uses RPC create_org_with_membership) ───

  it('createOrganization returns org data from RPC on success', async () => {
    const org = { id: 'org-new', name: 'Test Org', slug: 'test-org-abc' };
    rpcResult = { data: org, error: null };

    const result = await organizationService.createOrganization('user-1', {
      name: 'Test Org',
      industry: 'tech',
      country: 'SA',
      city: 'Riyadh',
    });

    expect(result).toEqual(org);
  });

  it('createOrganization throws when RPC fails', async () => {
    const err = { message: 'insert failed' };
    rpcResult = { data: null, error: err };

    await expect(
      organizationService.createOrganization('user-1', {
        name: 'Fail',
        industry: 'x',
        country: 'x',
        city: 'x',
      })
    ).rejects.toEqual(err);
  });

  it('createOrganization throws when RPC returns no data', async () => {
    rpcResult = { data: null, error: null };

    await expect(
      organizationService.createOrganization('user-1', {
        name: 'OK',
        industry: 'x',
        country: 'x',
        city: 'x',
      })
    ).rejects.toThrow('Organization creation returned no data');
  });

  // ─── updateOrganization ───

  it('updateOrganization returns updated org on success', async () => {
    const updated = { id: 'org-1', name: 'New Name' };
    updateResult = { data: updated, error: null };

    const result = await organizationService.updateOrganization('org-1', { name: 'New Name' } as any);
    expect(result).toEqual(updated);
  });
});
