import { adminSupabase } from './adminSupabase';

export interface TicketItem {
  id: string; subject: string; status: string; priority: string;
  submitted_by_name: string | null; submitted_by_email: string | null;
  org_name: string | null; organization_id: string | null;
  created_at: string; updated_at: string;
}

class AdminTicketsService {
  private static instance: AdminTicketsService;
  static getInstance() { if (!this.instance) this.instance = new AdminTicketsService(); return this.instance; }

  async list(params: { status?: string; priority?: string; limit?: number; offset?: number }) {
    const { data, error } = await adminSupabase.rpc('admin_list_tickets', {
      p_status: params.status ?? null, p_priority: params.priority ?? null,
      p_limit: params.limit ?? 50, p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب التذاكر: ' + error.message);
    const r = data as { data: TicketItem[]; total: number };
    return { data: r.data ?? [], total: r.total ?? 0 };
  }

  async updateStatus(ticketId: string, status: string) {
    const { error } = await adminSupabase.rpc('admin_update_ticket_status', { p_ticket_id: ticketId, p_status: status });
    if (error) throw new Error('فشل في تحديث التذكرة: ' + error.message);
  }
}

export const adminTicketsService = AdminTicketsService.getInstance();
