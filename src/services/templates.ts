import { supabase } from '@/lib/supabase';
import type { DbReplyTemplate } from '@/types/database';

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
  }): Promise<DbReplyTemplate> {
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
