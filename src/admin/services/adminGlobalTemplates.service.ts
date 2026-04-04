// ============================================================================
// SENDA Admin — Global Plan Templates Service
// CRUD via SECURITY DEFINER RPCs with permission checks.
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface GlobalTemplateItem {
  id: string;
  plan_id: string;
  name: string;
  body: string;
  category: string;
  rating_min: number;
  rating_max: number;
  is_active: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

class AdminGlobalTemplatesService {
  private static instance: AdminGlobalTemplatesService;
  static getInstance(): AdminGlobalTemplatesService {
    if (!AdminGlobalTemplatesService.instance) {
      AdminGlobalTemplatesService.instance = new AdminGlobalTemplatesService();
    }
    return AdminGlobalTemplatesService.instance;
  }

  async list(params: {
    plan?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: GlobalTemplateItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_global_templates', {
      p_plan: params.plan || null,
      p_category: params.category || null,
      p_search: params.search || null,
      p_limit: params.limit ?? 100,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب القوالب العامة: ' + error.message);
    const result = data as { data: GlobalTemplateItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }

  async create(params: {
    plan_id: string;
    name: string;
    body: string;
    category?: string;
    rating_min?: number;
    rating_max?: number;
    language?: string;
  }): Promise<string> {
    const { data, error } = await adminSupabase.rpc('admin_create_global_template', {
      p_plan_id: params.plan_id,
      p_name: params.name,
      p_body: params.body,
      p_category: params.category ?? 'general',
      p_rating_min: params.rating_min ?? 1,
      p_rating_max: params.rating_max ?? 5,
      p_language: params.language ?? 'ar',
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية إنشاء القوالب');
      throw new Error('فشل في إنشاء القالب: ' + error.message);
    }
    return data as string;
  }

  async update(templateId: string, updates: {
    name?: string;
    body?: string;
    category?: string;
    rating_min?: number;
    rating_max?: number;
    is_active?: boolean;
    language?: string;
    plan_id?: string;
  }): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_update_global_template', {
      p_template_id: templateId,
      p_name: updates.name ?? null,
      p_body: updates.body ?? null,
      p_category: updates.category ?? null,
      p_rating_min: updates.rating_min ?? null,
      p_rating_max: updates.rating_max ?? null,
      p_is_active: updates.is_active ?? null,
      p_language: updates.language ?? null,
      p_plan_id: updates.plan_id ?? null,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل القوالب');
      throw new Error('فشل في تحديث القالب: ' + error.message);
    }
  }

  async remove(templateId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_delete_global_template', {
      p_template_id: templateId,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية حذف القوالب');
      throw new Error('فشل في حذف القالب: ' + error.message);
    }
  }
}

export const adminGlobalTemplatesService = AdminGlobalTemplatesService.getInstance();
