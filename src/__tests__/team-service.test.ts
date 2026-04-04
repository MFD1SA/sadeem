import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let usersSelectResult: { data: unknown; error: unknown };
let membershipsSelectResult: { data: unknown; error: unknown };
let usersInResult: { data: unknown; error: unknown };
let membershipsInsertResult: { error: unknown };

const mockIlike = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            ilike: (...a: unknown[]) => {
              mockIlike(...a);
              return {
                maybeSingle: () => Promise.resolve(usersSelectResult),
              };
            },
            in: () => Promise.resolve(usersInResult),
          }),
        };
      }
      // memberships
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve(membershipsSelectResult),
          }),
        }),
        insert: (...a: unknown[]) => {
          mockInsert(...a);
          return Promise.resolve(membershipsInsertResult);
        },
      };
    },
  },
}));

import { teamService } from '@/services/team';

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersSelectResult = { data: null, error: null };
    membershipsSelectResult = { data: [], error: null };
    usersInResult = { data: [], error: null };
    membershipsInsertResult = { error: null };
  });

  // ─── inviteMember ───

  it('inviteMember normalizes email to lowercase and trims whitespace', async () => {
    usersSelectResult = { data: { id: 'u-1' }, error: null };
    membershipsInsertResult = { error: null };

    await teamService.inviteMember('org-1', '  Alice@Example.COM  ', 'member');

    expect(mockIlike).toHaveBeenCalledWith('email', 'alice@example.com');
  });

  it('inviteMember throws when user is not found', async () => {
    usersSelectResult = { data: null, error: null };

    await expect(
      teamService.inviteMember('org-1', 'nobody@test.com', 'member')
    ).rejects.toThrow('لا يوجد حساب بهذا البريد الإلكتروني');
  });

  it('inviteMember throws on user lookup error', async () => {
    usersSelectResult = { data: null, error: { message: 'DB down', code: '500' } };

    await expect(
      teamService.inviteMember('org-1', 'test@test.com', 'admin')
    ).rejects.toBeTruthy();
  });

  it('inviteMember throws a duplicate-member message on code 23505', async () => {
    usersSelectResult = { data: { id: 'u-1' }, error: null };
    membershipsInsertResult = { error: { code: '23505', message: 'duplicate key' } };

    await expect(
      teamService.inviteMember('org-1', 'dup@test.com', 'member')
    ).rejects.toThrow('هذا المستخدم عضو بالفعل في الفريق');
  });

  it('inviteMember re-throws non-duplicate insert errors', async () => {
    usersSelectResult = { data: { id: 'u-1' }, error: null };
    const dbError = { code: '42000', message: 'some other error' };
    membershipsInsertResult = { error: dbError };

    await expect(
      teamService.inviteMember('org-1', 'x@test.com', 'admin')
    ).rejects.toEqual(dbError);
  });

  // ─── listMembers ───

  it('listMembers returns empty array when no memberships exist', async () => {
    membershipsSelectResult = { data: [], error: null };

    const result = await teamService.listMembers('org-empty');
    expect(result).toEqual([]);
  });

  it('listMembers throws on membership query error', async () => {
    membershipsSelectResult = { data: null, error: { message: 'permission denied' } };

    await expect(teamService.listMembers('org-1')).rejects.toEqual({ message: 'permission denied' });
  });

  it('listMembers joins users to memberships and skips orphan memberships', async () => {
    membershipsSelectResult = {
      data: [
        { user_id: 'u-1', organization_id: 'org-1' },
        { user_id: 'u-missing', organization_id: 'org-1' },
      ],
      error: null,
    };
    usersInResult = { data: [{ id: 'u-1', email: 'a@b.com' }], error: null };

    const result = await teamService.listMembers('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].user.id).toBe('u-1');
  });
});
