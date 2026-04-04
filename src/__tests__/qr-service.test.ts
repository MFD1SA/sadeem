import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock ──
// terminalValue controls what the chain resolves to at every terminal point.
let terminalValue: Record<string, unknown> = { data: null, error: null };
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteFn = vi.fn();

function makeChain(): Record<string, any> {
  // Every method returns the same chain, and the chain also exposes
  // data/error so destructuring works at any point in the chain.
  const c: Record<string, any> = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'data') return terminalValue.data;
      if (prop === 'error') return terminalValue.error;
      if (prop === 'then') return undefined; // not a thenable
      if (prop === 'insert') return (...a: unknown[]) => { mockInsert(...a); return c; };
      if (prop === 'update') return (...a: unknown[]) => { mockUpdate(...a); return c; };
      if (prop === 'delete') return () => { mockDeleteFn(); return c; };
      // Everything else (select, eq, order, single, maybeSingle, in, lt) returns the chain
      return () => c;
    },
  });
  return c;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => makeChain(),
    rpc: vi.fn(),
  },
}));

import { qrService } from '@/services/qr';

describe('qrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalValue = { data: null, error: null };
  });

  // ── listByOrganization ──

  it('returns QR configs for an organization', async () => {
    const configs = [{ id: 'qr-1', slug: 'branch-abc123' }];
    terminalValue = { data: configs, error: null };

    const result = await qrService.listByOrganization('org-1');

    expect(result).toEqual(configs);
  });

  it('throws on list error', async () => {
    terminalValue = { data: null, error: { message: 'DB error' } };

    await expect(qrService.listByOrganization('org-1')).rejects.toBeTruthy();
  });

  // ── getByBranchId ──

  it('returns null when no QR config exists for branch', async () => {
    terminalValue = { data: null, error: { code: 'PGRST116', message: 'not found' } };

    const result = await qrService.getByBranchId('branch-missing');

    expect(result).toBeNull();
  });

  it('throws on non-PGRST116 error', async () => {
    terminalValue = { data: null, error: { code: '42P01', message: 'relation does not exist' } };

    await expect(qrService.getByBranchId('branch-1')).rejects.toBeTruthy();
  });

  // ── create ──

  it('creates a QR config with generated slug', async () => {
    const created = { id: 'qr-new', slug: 'my-branch-x1y2z3', mode: 'landing' };
    terminalValue = { data: created, error: null };

    const result = await qrService.create({
      branch_id: 'b1',
      organization_id: 'org-1',
      mode: 'landing',
      branchName: 'My Branch',
    });

    expect(result).toEqual(created);
    expect(mockInsert).toHaveBeenCalled();
  });

  // ── update ──

  it('updates a QR config', async () => {
    const updated = { id: 'qr-1', mode: 'direct', google_review_url: 'https://g.co/review' };
    terminalValue = { data: updated, error: null };

    const result = await qrService.update('qr-1', { mode: 'direct', google_review_url: 'https://g.co/review' });

    expect(result).toEqual(updated);
    expect(mockUpdate).toHaveBeenCalled();
  });

  // ── remove ──

  it('deletes a QR config without error', async () => {
    terminalValue = { error: null };

    await expect(qrService.remove('qr-1')).resolves.toBeUndefined();
    expect(mockDeleteFn).toHaveBeenCalled();
  });

  it('throws on delete error', async () => {
    terminalValue = { error: { message: 'FK constraint' } };

    await expect(qrService.remove('qr-1')).rejects.toBeTruthy();
  });

  // ── getQrUrl ──

  it('returns google URL for direct mode configs', () => {
    const config = { mode: 'direct', google_review_url: 'https://g.co/review', slug: 'test' } as any;

    const url = qrService.getQrUrl(config);

    expect(url).toBe('https://g.co/review');
  });
});
