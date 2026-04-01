import { supabase } from '@/lib/supabase';
import type { DbBranch } from '@/types/database';

export const branchesService = {
  async list(organizationId: string): Promise<DbBranch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DbBranch[];
  },

  async create(branch: {
    organization_id: string;
    internal_name: string;
    google_name?: string;
    google_location_id?: string;
    city?: string;
    address?: string;
    status?: string;
  }): Promise<DbBranch> {
    const { data, error } = await supabase
      .from('branches')
      .insert({
        organization_id: branch.organization_id,
        internal_name: branch.internal_name,
        google_name: branch.google_name ?? null,
        google_location_id: branch.google_location_id ?? null,
        city: branch.city ?? null,
        address: branch.address ?? null,
        status: branch.status ?? 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbBranch;
  },

  async update(branchId: string, updates: Partial<DbBranch>): Promise<DbBranch> {
    const { data, error } = await supabase
      .from('branches')
      .update(updates as Record<string, unknown>)
      .eq('id', branchId)
      .select()
      .single();

    if (error) throw error;
    return data as DbBranch;
  },

  async remove(branchId: string): Promise<void> {
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId);

    if (error) throw error;
  },
};
