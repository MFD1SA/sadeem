import { supabase } from '@/lib/supabase';

export interface DbTask {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'done';
  source: 'manual' | 'smart';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const tasksService = {
  async list(organizationId: string): Promise<DbTask[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Senda] Tasks load failed:', error.message);
      return [];
    }
    return (data || []) as DbTask[];
  },

  async create(input: {
    organization_id: string;
    title: string;
    description?: string;
    priority?: DbTask['priority'];
    due_date?: string;
    source?: DbTask['source'];
  }): Promise<DbTask> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        organization_id: input.organization_id,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'medium',
        status: 'pending',
        source: input.source || 'manual',
        due_date: input.due_date || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbTask;
  },

  async toggleStatus(taskId: string, currentStatus: DbTask['status']): Promise<void> {
    const next = currentStatus === 'pending' ? 'done' : 'pending';
    const { error } = await supabase
      .from('tasks')
      .update({ status: next } as Record<string, unknown>)
      .eq('id', taskId);
    if (error) throw error;
  },

  async remove(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
  },

  async update(taskId: string, patch: Partial<Pick<DbTask, 'title' | 'description' | 'priority' | 'due_date'>>): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update(patch as Record<string, unknown>)
      .eq('id', taskId);
    if (error) throw error;
  },
};
