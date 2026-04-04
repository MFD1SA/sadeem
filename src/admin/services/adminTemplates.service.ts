// ============================================================================
// SADEEM Admin — Templates Service (Phase 9)
// All ops via SECURITY DEFINER RPCs with permission checks.
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface AdminTemplateItem {
  id: string;
  organization_id: string;
  org_name: string;
  name: string;
  body: string;
  category: string;
  rating_min: number;
  rating_max: number;
  is_active: boolean;
  usage_count: number;
  language: string;
  created_at: string;
}

class AdminTemplatesService {
  private static instance: AdminTemplatesService;
  static getInstance(): AdminTemplatesService {
    if (!AdminTemplatesService.instance) {
      AdminTemplatesService.instance = new AdminTemplatesService();
    }
    return AdminTemplatesService.instance;
  }

  async list(params: {
    search?: string;
    org_id?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AdminTemplateItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_all_templates', {
      p_search: params.search || null,
      p_org_id: params.org_id || null,
      p_category: params.category || null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب القوالب: ' + error.message);
    const result = data as { data: AdminTemplateItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }

  async update(templateId: string, updates: {
    name?: string;
    body?: string;
    category?: string;
    rating_min?: number;
    rating_max?: number;
    is_active?: boolean;
    language?: string;
  }): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_update_template', {
      p_template_id: templateId,
      p_name: updates.name ?? null,
      p_body: updates.body ?? null,
      p_category: updates.category ?? null,
      p_rating_min: updates.rating_min ?? null,
      p_rating_max: updates.rating_max ?? null,
      p_is_active: updates.is_active ?? null,
      p_language: updates.language ?? null,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل القوالب');
      throw new Error('فشل في تحديث القالب: ' + error.message);
    }
  }

  async remove(templateId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_delete_template', {
      p_template_id: templateId,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية حذف القوالب');
      throw new Error('فشل في حذف القالب: ' + error.message);
    }
  }
}

export const adminTemplatesService = AdminTemplatesService.getInstance();
