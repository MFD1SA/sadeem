// ============================================================================
// SENDA Admin — Gateway Monitoring Service (Phase 7)
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface GatewayOverview {
  total_events: number;
  events_today: number;
  processed: number;
  failed: number;
  ignored: number;
  gateway_revenue: Record<string, number>;
  active_gateway_subs: number;
  by_event_type: Record<string, number>;
}

export interface PaymentEventItem {
  id: string;
  gateway_provider: string;
  event_type: string;
  event_id: string | null;
  org_name: string | null;
  organization_id: string | null;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

class AdminGatewayService {
  private static instance: AdminGatewayService;
  static getInstance(): AdminGatewayService {
    if (!AdminGatewayService.instance) {
      AdminGatewayService.instance = new AdminGatewayService();
    }
    return AdminGatewayService.instance;
  }

  async getOverview(): Promise<GatewayOverview> {
    const { data, error } = await adminSupabase.rpc('admin_get_gateway_overview');
    if (error) throw new Error('فشل في جلب بيانات البوابة: ' + error.message);
    return data as GatewayOverview;
  }

  async listEvents(params: {
    status?: string;
    provider?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PaymentEventItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_payment_events', {
      p_status: params.status ?? null,
      p_provider: params.provider ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب أحداث الدفع: ' + error.message);
    const result = data as { data: PaymentEventItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }
}

export const adminGatewayService = AdminGatewayService.getInstance();
