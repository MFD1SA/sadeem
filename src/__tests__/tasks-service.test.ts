import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Result holders ───
let listResult: { data: unknown; error: unknown };
let createResult: { data: unknown; error: unknown };
let mutateResult: { error: unknown };

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(listResult),
        }),
      }),
      insert: (...a: unknown[]) => {
        mockInsert(...a);
        return {
          select: () => ({
            single: () => Promise.resolve(createResult),
          }),
        };
      },
      update: (...a: unknown[]) => {
        mockUpdate(...a);
        return {
          eq: () => Promise.resolve(mutateResult),
        };
      },
      delete: () => {
        mockDelete();
        return {
          eq: () => Promise.resolve(mutateResult),
        };
      },
    }),
  },
}));

import { tasksService } from '@/services/tasks';

describe('tasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listResult = { data: [], error: null };
    createResult = { data: null, error: null };
    mutateResult = { error: null };
  });

  // ─── list ───

  it('list returns tasks from supabase', async () => {
    const tasks = [{ id: 't-1', title: 'A' }];
    listResult = { data: tasks, error: null };

    const result = await tasksService.list('org-1');
    expect(result).toEqual(tasks);
  });

  it('list returns empty array on error instead of throwing', async () => {
    listResult = { data: null, error: { message: 'fail' } };

    const result = await tasksService.list('org-1');
    expect(result).toEqual([]);
  });

  it('list returns empty array when data is null and no error', async () => {
    listResult = { data: null, error: null };
    const result = await tasksService.list('org-1');
    expect(result).toEqual([]);
  });

  // ─── create ───

  it('create inserts a task with defaults and returns it', async () => {
    const task = { id: 't-new', title: 'New', status: 'pending', priority: 'medium' };
    createResult = { data: task, error: null };

    const result = await tasksService.create({ organization_id: 'org-1', title: 'New' });
    expect(result).toEqual(task);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'medium', status: 'pending', source: 'manual' })
    );
  });

  it('create throws on insert error', async () => {
    const err = { message: 'constraint violation' };
    createResult = { data: null, error: err };

    await expect(
      tasksService.create({ organization_id: 'org-1', title: 'Bad' })
    ).rejects.toEqual(err);
  });

  // ─── toggleStatus ───

  it('toggleStatus flips pending to done', async () => {
    mutateResult = { error: null };

    await tasksService.toggleStatus('t-1', 'pending');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'done' }));
  });

  it('toggleStatus flips done to pending', async () => {
    mutateResult = { error: null };

    await tasksService.toggleStatus('t-1', 'done');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });

  // ─── remove ───

  it('remove calls delete and succeeds', async () => {
    mutateResult = { error: null };

    await tasksService.remove('t-1');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('remove throws on delete error', async () => {
    mutateResult = { error: { message: 'not found' } };

    await expect(tasksService.remove('t-bad')).rejects.toEqual({ message: 'not found' });
  });
});
