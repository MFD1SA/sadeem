import { supabase } from '@/lib/supabase';

export interface DbNotification {
  id: string;
  organization_id: string;
  type: string;
  title: string;
  body: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async list(organizationId: string): Promise<DbNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table may not exist yet — graceful fallback
      console.warn('[Senda] Notifications table not available:', error.message);
      return [];
    }
    return (data || []) as DbNotification[];
  },

  async create(input: {
    organization_id: string;
    type: string;
    title: string;
    body: string;
    entity_id?: string;
  }): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      organization_id: input.organization_id,
      type: input.type,
      title: input.title,
      body: input.body,
      entity_id: input.entity_id || null,
      is_read: false,
    });
    if (error) {
      // Silently fail if table doesn't exist
      console.warn('[Senda] Notification insert failed:', error.message);
    }
  },

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true } as Record<string, unknown>)
      .eq('id', notificationId);
    if (error) {
      console.warn('[Senda] markRead failed:', error.message);
      throw error;
    }
  },

  async markAllRead(organizationId: string): Promise<void> {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true } as Record<string, unknown>)
      .eq('organization_id', organizationId)
      .eq('is_read', false);
    if (error) {
      console.warn('[Senda] markAllRead failed:', error.message);
      throw error;
    }
  },

  // ─── Trigger helpers ───

  async notifyCriticalReview(organizationId: string, reviewerName: string, rating: number, reviewId: string): Promise<void> {
    await this.create({
      organization_id: organizationId,
      type: 'critical_review',
      title: rating === 1
        ? `تقييم ⭐ واحدة من ${reviewerName}`
        : `تقييم ${rating} نجوم من ${reviewerName}`,
      body: 'يتطلب مراجعة يدوية فورية',
      entity_id: reviewId,
    });
  },

  async notifyComplaint(organizationId: string, reviewerName: string, reviewId: string): Promise<void> {
    await this.create({
      organization_id: organizationId,
      type: 'complaint',
      title: `شكوى من ${reviewerName}`,
      body: 'تم اكتشاف شكوى في تقييم — يتطلب مراجعة',
      entity_id: reviewId,
    });
  },

  async notifyTicketReply(organizationId: string, ticketSubject: string, ticketId?: string): Promise<void> {
    await this.create({
      organization_id: organizationId,
      type: 'ticket_reply',
      title: `رد جديد على التذكرة: ${ticketSubject}`,
      body: 'قام فريق الدعم الفني بالرد على تذكرتك',
      entity_id: ticketId,
    });
  },
};
