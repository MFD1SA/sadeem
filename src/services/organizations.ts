import { supabase } from '@/lib/supabase';
import type { DbOrganization, DbMembership } from '@/types/database';

export const organizationService = {
  async getUserOrganization(userId: string): Promise<{ org: DbOrganization; membership: DbMembership } | null> {
    const { data: membership, error: memErr } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memErr || !membership) return null;

    const mem = membership as DbMembership;

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', mem.organization_id)
      .single();

    if (orgErr || !org) return null;

    return { org: org as DbOrganization, membership: mem };
  },

  async createOrganization(
    userId: string,
    input: { name: string; industry: string; country: string; city: string; logoUrl?: string }
  ): Promise<DbOrganization> {
    const slug = input.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now().toString(36);

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        owner_user_id: userId,
        name: input.name,
        slug,
        industry: input.industry,
        country: input.country,
        city: input.city,
        logo_url: input.logoUrl || null,
      })
      .select()
      .single();

    if (orgErr || !org) throw orgErr || new Error('Failed to create organization');

    const created = org as DbOrganization;

    const { error: memErr } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        organization_id: created.id,
        role: 'owner',
        status: 'active',
      });

    if (memErr) throw memErr;

    return created;
  },

  async updateOrganization(orgId: string, updates: Partial<DbOrganization>): Promise<DbOrganization> {
    const { data: org, error } = await supabase
      .from('organizations')
      .update(updates as Record<string, unknown>)
      .eq('id', orgId)
      .select()
      .single();

    if (error) throw error;
    return org as DbOrganization;
  },
};
