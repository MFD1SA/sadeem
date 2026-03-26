import { adminSupabase } from './adminSupabase';

export interface TicketItem {
  id: string; subject: string; body: string | null; status: string; priority: string;
  submitted_by_name: string | null; submitted_by_email: string | null;
  org_name: string | null; organization_id: string | null;
  created_at: string; updated_at: string;
  admin_reply: string | null; replied_at: string | null; admin_replied_by_name: string | null;
}

class AdminTicketsService {
  private static instance: AdminTicketsService;
  static getInstance() { if (!this.instance) this.instance = new AdminTicketsService(); return this.instance; }

  async list(params: { status?: string; priority?: string; limit?: number; offset?: number }) {
    let query = adminSupabase
      .from('support_tickets')
      .select(`
        id, subject, body, status, priority,
        submitted_by_name, submitted_by_email, organization_id,
        created_at, updated_at,
        admin_reply, replied_at, admin_replied_by_name,
        organizations ( name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 50);

    if (params.status) query = query.eq('status', params.status);
    if (params.priority) query = query.eq('priority', params.priority);
    if (params.offset) query = query.range(params.offset, (params.offset) + (params.limit ?? 50) - 1);

    const { data, error, count } = await query;
    if (error) throw new Error('فشل في جلب التذاكر: ' + error.message);

    const rows = (data ?? []).map((t: any) => ({
      ...t,
      org_name: t.organizations?.name ?? null,
    }));

    return { data: rows as TicketItem[], total: count ?? rows.length };
  }

  async getTicket(ticketId: string): Promise<TicketItem | null> {
    const { data, error } = await adminSupabase
      .from('support_tickets')
      .select('id, subject, body, status, priority, submitted_by_name, submitted_by_email, organization_id, created_at, updated_at, admin_reply, replied_at, admin_replied_by_name')
      .eq('id', ticketId)
      .single();
    if (error) return null;
    return data as TicketItem;
  }

  async updateStatus(ticketId: string, status: string) {
    const { error } = await adminSupabase.rpc('admin_update_ticket_status', { p_ticket_id: ticketId, p_status: status });
    if (error) throw new Error('فشل في تحديث التذكرة: ' + error.message);
  }

  async replyToTicket(ticketId: string, reply: string, adminName: string) {
    const { error } = await adminSupabase
      .from('support_tickets')
      .update({
        admin_reply: reply,
        replied_at: new Date().toISOString(),
        admin_replied_by_name: adminName,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);
    if (error) throw new Error('فشل في إرسال الرد: ' + error.message);
  }
}

export const adminTicketsService = AdminTicketsService.getInstance();
