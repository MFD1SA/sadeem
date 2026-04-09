import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase with chainable query builder
const mockResult = { data: null as unknown, error: null as unknown };
let rpcResult = { data: null as unknown, error: null as unknown };

const chainable = () => {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn((..._args: unknown[]) => {
      // Terminal methods resolve the mock result
      if (m === 'single') return Promise.resolve(mockResult);
      return chain;
    });
  }
  // Non-single terminal calls — make the chain itself thenable
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
    rpc: () => Promise.resolve(rpcResult),
  },
}));

import { branchesService } from '@/services/branches';

describe('branchesService', () => {
  beforeEach(() => {
    mockChain = chainable();
    mockResult.data = null;
    mockResult.error = null;
    rpcResult = { data: null, error: null };
  });

  // ─── list ───

  it('list returns branches array for an organization', async () => {
    const branches = [
      { id: 'b1', internal_name: 'Main', organization_id: 'org-1' },
      { id: 'b2', internal_name: 'North', organization_id: 'org-1' },
    ];
    mockResult.data = branches;

    const result = await branchesService.list('org-1');

    expect(mockChain.select).toHaveBeenCalledWith('*');
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual(branches);
  });

  it('list returns empty array when data is null', async () => {
    mockResult.data = null;

    const result = await branchesService.list('org-1');

    expect(result).toEqual([]);
  });

  it('list throws on database error', async () => {
    mockResult.error = { message: 'relation "branches" does not exist' };

    await expect(branchesService.list('org-1')).rejects.toEqual(
      expect.objectContaining({ message: 'relation "branches" does not exist' })
    );
  });

  // ─── create (now uses RPC create_branch_with_limit_check) ───

  it('create returns branch after RPC + fetch', async () => {
    const newBranch = { id: 'b3', internal_name: 'South', organization_id: 'org-1', status: 'active' };
    rpcResult = { data: 'b3', error: null };
    mockResult.data = newBranch;

    const result = await branchesService.create({
      organization_id: 'org-1',
      internal_name: 'South',
    });

    expect(result).toEqual(newBranch);
  });

  it('create passes optional fields to RPC', async () => {
    rpcResult = { data: 'b4', error: null };
    mockResult.data = { id: 'b4' };

    const result = await branchesService.create({
      organization_id: 'org-1',
      internal_name: 'East',
      city: 'Riyadh',
    });

    expect(result).toEqual({ id: 'b4' });
  });

  it('create throws on RPC error', async () => {
    rpcResult = { data: null, error: { message: 'duplicate key' } };

    await expect(
      branchesService.create({ organization_id: 'org-1', internal_name: 'Dup' })
    ).rejects.toEqual(expect.objectContaining({ message: 'duplicate key' }));
  });

  // ─── update ───

  it('update sends partial updates and matches by branchId', async () => {
    mockResult.data = { id: 'b1', internal_name: 'Updated' };

    const result = await branchesService.update('b1', { internal_name: 'Updated' } as Record<string, unknown>);

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ internal_name: 'Updated' })
    );
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'b1');
    expect(result).toEqual(expect.objectContaining({ internal_name: 'Updated' }));
  });

  // ─── remove ───

  it('remove calls delete with correct branch id', async () => {
    mockResult.error = null;

    await branchesService.remove('b1');

    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'b1');
  });

  it('remove throws on delete error', async () => {
    mockResult.error = { message: 'foreign key violation' };

    await expect(branchesService.remove('b1')).rejects.toEqual(
      expect.objectContaining({ message: 'foreign key violation' })
    );
  });
});
