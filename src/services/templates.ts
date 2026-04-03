import { supabase } from '@/lib/supabase';
import type { DbReplyTemplate } from '@/types/database';
import { getPlanLimits } from '@/types/subscription';
import type { PlanId } from '@/types/subscription';

export const templatesService = {
  async list(organizationId: string): Promise<DbReplyTemplate[]> {
    const { data, error } = await supabase
      .from('reply_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DbReplyTemplate[];
  },

  async create(template: {
    organization_id: string;
    name: string;
    body: string;
    category: string;
    rating_min: number;
    rating_max: number;
    is_active?: boolean;
    language?: 'ar' | 'en' | 'any';
  }): Promise<DbReplyTemplate> {
    // Enforce template creation limit based on plan
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', template.organization_id)
      .eq('status', 'active')
      .single();

    const planId = (subData as { plan: string } | null)?.plan as PlanId | undefined;
    const planInfo = await import('@/types/subscription').then(m => m.PLANS[planId || 'orbit']);
    const maxTemplates = planInfo?.templateCount ?? 10;

    // Count existing templates for this org
    const { count, error: countErr } = await supabase
      .from('reply_templates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', template.organization_id);

    if (countErr) throw countErr;

    if ((count ?? 0) >= maxTemplates) {
      throw new Error(
        `Template limit reached (${maxTemplates}). Upgrade your plan to create more templates.`
      );
    }

    const { data, error } = await supabase
      .from('reply_templates')
      .insert({
        organization_id: template.organization_id,
        name: template.name,
        body: template.body,
        category: template.category,
        rating_min: template.rating_min,
        rating_max: template.rating_max,
        is_active: template.is_active ?? true,
        language: template.language ?? 'ar',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbReplyTemplate;
  },

  async update(templateId: string, updates: Partial<DbReplyTemplate>): Promise<DbReplyTemplate> {
    const { data, error } = await supabase
      .from('reply_templates')
      .update(updates as Record<string, unknown>)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data as DbReplyTemplate;
  },

  async remove(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('reply_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  async toggleActive(templateId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('reply_templates')
      .update({ is_active: isActive } as Record<string, unknown>)
      .eq('id', templateId);

    if (error) throw error;
  },
};
