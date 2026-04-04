// ============================================================================
// SENDA Admin — AI Usage Service (Phase 6)
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface AIUsageOverview {
  total_calls: number;
  calls_this_month: number;
  successful_calls: number;
  failed_calls: number;
  limit_exceeded_calls: number;
  total_tokens: number;
  tokens_this_month: number;
  total_cost_usd: number;
  cost_this_month: number;
  top_consumers: Array<{
    org_id: string;
    org_name: string;
    total_calls: number;
    total_tokens: number;
    total_cost: number;
  }>;
  daily_calls: Array<{ date: string; calls: number }>;
}

export interface AIUsageLogItem {
  id: string;
  org_name: string;
  model: string;
  total_tokens: number;
  estimated_cost_usd: number;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

class AdminAIUsageService {
  private static instance: AdminAIUsageService;
  static getInstance(): AdminAIUsageService {
    if (!AdminAIUsageService.instance) {
      AdminAIUsageService.instance = new AdminAIUsageService();
    }
    return AdminAIUsageService.instance;
  }

  async getOverview(): Promise<AIUsageOverview> {
    const { data, error } = await adminSupabase.rpc('admin_get_ai_usage_overview');
    if (error) throw new Error('فشل في جلب إحصائيات AI: ' + error.message);
    return data as AIUsageOverview;
  }

  async listByOrg(params: {
    orgId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AIUsageLogItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_ai_usage_by_org', {
      p_org_id: params.orgId ?? null,
      p_status: params.status ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب سجلات AI: ' + error.message);
    const result = data as { data: AIUsageLogItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }
}

export const adminAIUsageService = AdminAIUsageService.getInstance();
