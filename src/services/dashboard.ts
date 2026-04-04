import { supabase } from '@/lib/supabase';
import type { DbReview } from '@/types/database';

export interface DashboardStats {
  totalReviews: number;
  unrepliedCount: number;
  avgRating: number;
  totalBranches: number;
  newReviewsToday: number;
  responseRate: number;
}

export const dashboardService = {
  async getStats(organizationId: string): Promise<DashboardStats> {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, rating, status, published_at')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const allReviews = (reviews || []) as Pick<DbReview, 'id' | 'rating' | 'status' | 'published_at'>[];
    const totalReviews = allReviews.length;
    const unrepliedCount = allReviews.filter(r => r.status === 'new' || r.status === 'pending_reply' || r.status === 'manual_review_required').length;
    const repliedCount = allReviews.filter(r => r.status === 'replied' || r.status === 'auto_replied').length;
    const avgRating = totalReviews > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
    const responseRate = totalReviews > 0 ? Math.round((repliedCount / totalReviews) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const newReviewsToday = allReviews.filter(r => r.published_at?.startsWith(today)).length;

    const { count: totalBranches } = await supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return {
      totalReviews,
      unrepliedCount,
      avgRating: Math.round(avgRating * 10) / 10,
      totalBranches: totalBranches || 0,
      newReviewsToday,
      responseRate,
    };
  },

  async getCriticalReviews(organizationId: string, limit = 5) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['new', 'flagged', 'manual_review_required'])
      .lte('rating', 2)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as DbReview[];
  },
};
