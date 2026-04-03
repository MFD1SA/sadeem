import { adminSupabase } from './adminSupabase';

export interface TicketItem {
  id: string; subject: string; description: string | null; status: string; priority: string;
  submitted_by_name: string | null; submitted_by_email: string | null;
  org_name: string | null; organization_id: string | null;
  created_at: string; updated_at: string;
}

export interface TicketReply {
  id: string;
  sender_type: 'customer' | 'support';
  sender_name: string;
  body: string;
  created_at: string;
}

export interface TicketDetail extends TicketItem {
  assigned_to: string | null;
  resolved_at: string | null;
  replies: TicketReply[];
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

  async getDetail(ticketId: string): Promise<TicketDetail> {
    const { data, error } = await adminSupabase.rpc('admin_get_ticket_detail', { p_ticket_id: ticketId });
    if (error) throw new Error('فشل في جلب تفاصيل التذكرة: ' + error.message);
    return data as TicketDetail;
  }

  async updateStatus(ticketId: string, status: string) {
    const { error } = await adminSupabase.rpc('admin_update_ticket_status', { p_ticket_id: ticketId, p_status: status });
    if (error) throw new Error('فشل في تحديث التذكرة: ' + error.message);
  }

  async addReply(ticketId: string, body: string): Promise<string> {
    const { data, error } = await adminSupabase.rpc('admin_add_ticket_reply', { p_ticket_id: ticketId, p_body: body });
    if (error) throw new Error('فشل في إرسال الرد: ' + error.message);
    return data as string;
  }
}

export const adminTicketsService = AdminTicketsService.getInstance();
