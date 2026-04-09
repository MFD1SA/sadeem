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
    // Use RPC with server-side branch limit enforcement
    const { data: branchId, error: rpcError } = await supabase.rpc('create_branch_with_limit_check', {
      p_org_id: branch.organization_id,
      p_internal_name: branch.internal_name,
      p_google_name: branch.google_name ?? null,
      p_google_location_id: branch.google_location_id ?? null,
      p_city: branch.city ?? null,
      p_address: branch.address ?? null,
    });

    if (rpcError) {
      if (rpcError.message.includes('Branch limit reached')) {
        throw new Error('لقد وصلت للحد الأقصى من الفروع المسموح بها في خطتك');
      }
      throw rpcError;
    }

    // Fetch the created branch
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
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
