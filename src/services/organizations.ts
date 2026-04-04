import { supabase } from '@/lib/supabase';
import type { DbOrganization, DbMembership } from '@/types/database';

export const organizationService = {
  async getUserOrganization(
    userId: string
  ): Promise<{ org: DbOrganization; membership: DbMembership } | null> {
    // Single query with join instead of 2 sequential queries
    const { data: membership, error: memErr } = await supabase
      .from('memberships')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (memErr) {
      console.warn('[Sadeem] Membership lookup failed:', memErr.message);
      return null;
    }

    if (!membership) return null;

    const mem = membership as DbMembership & { organizations: DbOrganization | null };
    const org = mem.organizations;

    if (!org) {
      console.warn('[Sadeem] Organization not found for membership');
      return null;
    }

    // Strip the joined org from the membership object
    const { organizations: _, ...cleanMem } = mem;

    return { org: org as DbOrganization, membership: cleanMem as DbMembership };
  },

  async createOrganization(
    userId: string,
    input: {
      name: string;
      industry: string;
      country: string;
      city: string;
      logoUrl?: string;
    }
  ): Promise<DbOrganization> {
    const slug =
      input.name
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 40) +
      '-' +
      Date.now().toString(36);

    console.log('[Sadeem][createOrg] Step 1: inserting organization…', { userId, slug });

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

    console.log('[Sadeem][createOrg] Step 1 result:', { org: !!org, orgErr });

    if (orgErr || !org) {
      throw orgErr || new Error('Failed to create organization');
    }

    const created = org as DbOrganization;

    console.log('[Sadeem][createOrg] Step 2: inserting membership…', { orgId: created.id });

    const { data: mem, error: memErr } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        organization_id: created.id,
        role: 'owner',
        status: 'active',
      })
      .select()
      .single();

    console.log('[Sadeem][createOrg] Step 2 result:', { mem: !!mem, memErr });

    if (memErr) throw memErr;
    if (!mem) throw new Error('Membership was not created — possible RLS policy issue');

    return created;
  },

  async updateOrganization(
    orgId: string,
    updates: Partial<DbOrganization>
  ): Promise<DbOrganization> {
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
