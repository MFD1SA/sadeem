// ============================================================================
// SADEEM Admin — Subscribers Service (Phase 4)
// All reads via SECURITY DEFINER RPCs (bypass subscriber RLS).
// All writes via RPCs with permission checks in DB.
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface SubscriberListItem {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    ai_replies_used: number;
    template_replies_used: number;
    updated_at: string;
  } | null;
  branch_count: number;
  review_count: number;
  member_count: number;
}

export interface SubscriberDetail {
  organization: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    country: string | null;
    city: string | null;
    created_at: string;
  };
  owner: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    starts_at: string;
    ends_at: string | null;
    ai_replies_used: number;
    template_replies_used: number;
    updated_at: string;
  } | null;
  branches: Array<{
    id: string;
    internal_name: string;
    city: string | null;
    status: string;
    created_at: string;
  }>;
  members: Array<{
    user_id: string;
    role: string;
    status: string;
    email: string;
    full_name: string;
  }>;
  stats: {
    total_reviews: number;
    reviews_this_month: number;
    active_branches: number;
  };
}

export interface DashboardStats {
  total_organizations: number;
  total_subscribers_active: number;
  total_subscribers_trial: number;
  total_subscribers_expired: number;
  total_branches: number;
  total_reviews: number;
  reviews_this_month: number;
  total_ai_replies_used: number;
  total_template_replies_used: number;
  plan_distribution: Record<string, number>;
  recent_organizations: Array<{ id: string; name: string; created_at: string }>;
  admin_count: number;
}

class AdminSubscribersService {
  private static instance: AdminSubscribersService;
  static getInstance(): AdminSubscribersService {
    if (!AdminSubscribersService.instance) {
      AdminSubscribersService.instance = new AdminSubscribersService();
    }
    return AdminSubscribersService.instance;
  }

  async list(params: {
    search?: string;
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: SubscriberListItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_subscribers', {
      p_search: params.search || null,
      p_status: params.status || null,
      p_plan: params.plan || null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });

    if (error) throw new Error('فشل في جلب المشتركين: ' + error.message);
    const result = data as { data: SubscriberListItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }

  async getDetail(orgId: string): Promise<SubscriberDetail | null> {
    const { data, error } = await adminSupabase.rpc('admin_get_subscriber_detail', {
      p_org_id: orgId,
    });

    if (error) throw new Error('فشل في جلب بيانات المشترك: ' + error.message);
    return data as SubscriberDetail | null;
  }

  async updateSubscription(orgId: string, updates: {
    plan?: string;
    status?: string;
    ends_at?: string;
  }): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_update_subscription', {
      p_org_id: orgId,
      p_plan: updates.plan ?? null,
      p_status: updates.status ?? null,
      p_ends_at: updates.ends_at ?? null,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل الاشتراكات');
      throw new Error('فشل في تحديث الاشتراك: ' + msg);
    }
  }

  async suspend(orgId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_suspend_subscriber', {
      p_org_id: orgId,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية إيقاف المشتركين');
      throw new Error('فشل في إيقاف المشترك: ' + msg);
    }
  }

  async reactivate(orgId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_reactivate_subscriber', {
      p_org_id: orgId,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية إعادة تفعيل المشتركين');
      throw new Error('فشل في إعادة تفعيل المشترك: ' + msg);
    }
  }

  async updateOrgInfo(orgId: string, updates: {
    name?: string;
    industry?: string;
    city?: string;
    country?: string;
  }): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_update_org_info', {
      p_org_id: orgId,
      p_name: updates.name ?? null,
      p_industry: updates.industry ?? null,
      p_city: updates.city ?? null,
      p_country: updates.country ?? null,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل بيانات المشترك');
      throw new Error('فشل في تحديث بيانات المشترك: ' + error.message);
    }
  }

  async deleteSubscriber(orgId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_delete_subscriber', {
      p_org_id: orgId,
    });
    if (error) {
      if (error.message.includes('Permission denied')) throw new Error('ليس لديك صلاحية حذف المشتركين');
      throw new Error('فشل في حذف المشترك: ' + error.message);
    }
  }

  async resetAIUsage(orgId: string): Promise<void> {
    const { error } = await adminSupabase
      .from('subscriptions')
      .update({ ai_replies_used: 0 })
      .eq('organization_id', orgId);
    if (error) throw new Error(error.message);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await adminSupabase.rpc('admin_get_dashboard_stats');

    if (error) throw new Error('فشل في جلب الإحصائيات: ' + error.message);
    return data as DashboardStats;
  }
}

export const adminSubscribersService = AdminSubscribersService.getInstance();
