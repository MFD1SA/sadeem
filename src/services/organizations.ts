import { supabase } from '@/lib/supabase';
import type { DbOrganization, DbMembership } from '@/types/database';

export const organizationService = {
  async getUserOrganization(
    _userId: string
  ): Promise<{ org: DbOrganization; membership: DbMembership } | null> {
    // Use server-side RPC (SECURITY DEFINER) to fetch org + membership.
    // This bypasses RLS timing issues where the PostgREST auth header
    // might still be the anon key right after OAuth login.  The function
    // uses auth.uid() internally so it's still secure.
    const { data, error } = await supabase.rpc('get_my_organization');

    if (error) {
      console.warn('[Senda] Org lookup RPC failed:', error.message);
      return null;
    }

    if (!data || !data.org || !data.membership) return null;

    return {
      org: data.org as DbOrganization,
      membership: data.membership as DbMembership,
    };
  },

  async createOrganization(
    _userId: string,
    input: {
      name: string;
      industry: string;
      country: string;
      city: string;
      logoUrl?: string;
      language?: string;
      tone?: string;
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

    // Use server-side RPC (SECURITY DEFINER) to create org + membership
    // atomically.  This bypasses RLS timing issues where the PostgREST
    // auth header might not have the correct JWT yet after OAuth login.
    const { data, error } = await supabase.rpc('create_org_with_membership', {
      p_name: input.name,
      p_slug: slug,
      p_industry: input.industry,
      p_country: input.country,
      p_city: input.city,
      p_logo_url: input.logoUrl || null,
      p_language: input.language || 'ar',
      p_tone: input.tone || 'professional',
    });

    if (error) {
      console.error('[Senda][createOrg] RPC failed:', error.message);
      throw error;
    }

    if (!data) {
      throw new Error('Organization creation returned no data');
    }

    return data as DbOrganization;
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
