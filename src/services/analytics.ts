import { supabase } from '@/lib/supabase';

interface ReviewRow {
  id: string;
  rating: number;
  status: string;
  sentiment: string | null;
  branch_id: string;
  published_at: string;
}

interface BranchRow {
  id: string;
  internal_name: string;
}

export interface AnalyticsData {
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  ratingDistribution: Record<number, number>;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  trendData: { date: string; count: number; avgRating: number }[];
  branchStats: { branchId: string; branchName: string; count: number; avgRating: number; responseRate: number }[];
}

export const analyticsService = {
  async getAnalytics(organizationId: string): Promise<AnalyticsData> {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id, rating, status, sentiment, branch_id, published_at')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const all = (reviews || []) as ReviewRow[];
    const total = all.length;

    const avgRating = total > 0 ? Math.round((all.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;

    const replied = all.filter((r: ReviewRow) => r.status === 'replied' || r.status === 'auto_replied').length;
    const responseRate = total > 0 ? Math.round((replied / total) * 100) : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach((r: ReviewRow) => { ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1; });

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    all.forEach((r: ReviewRow) => {
      if (r.sentiment === 'positive') sentimentBreakdown.positive++;
      else if (r.sentiment === 'negative') sentimentBreakdown.negative++;
      else sentimentBreakdown.neutral++;
    });

    const trendMap: Record<string, { count: number; ratingSum: number }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { count: 0, ratingSum: 0 };
    }
    all.forEach((r: ReviewRow) => {
      const day = r.published_at.split('T')[0];
      if (trendMap[day]) {
        trendMap[day].count++;
        trendMap[day].ratingSum += r.rating;
      }
    });
    const trendData = Object.entries(trendMap).map(([date, v]) => ({
      date,
      count: v.count,
      avgRating: v.count > 0 ? Math.round((v.ratingSum / v.count) * 10) / 10 : 0,
    }));

    const { data: branches } = await supabase
      .from('branches')
      .select('id, internal_name')
      .eq('organization_id', organizationId);

    const branchMap: Record<string, string> = {};
    ((branches || []) as BranchRow[]).forEach((b: BranchRow) => { branchMap[b.id] = b.internal_name; });

    const branchAgg: Record<string, { count: number; ratingSum: number; replied: number }> = {};
    all.forEach((r: ReviewRow) => {
      if (!branchAgg[r.branch_id]) branchAgg[r.branch_id] = { count: 0, ratingSum: 0, replied: 0 };
      branchAgg[r.branch_id].count++;
      branchAgg[r.branch_id].ratingSum += r.rating;
      if (r.status === 'replied' || r.status === 'auto_replied') branchAgg[r.branch_id].replied++;
    });

    const branchStats = Object.entries(branchAgg).map(([branchId, v]) => ({
      branchId,
      branchName: branchMap[branchId] || branchId,
      count: v.count,
      avgRating: Math.round((v.ratingSum / v.count) * 10) / 10,
      responseRate: Math.round((v.replied / v.count) * 100),
    }));

    return { avgRating, totalReviews: total, responseRate, ratingDistribution, sentimentBreakdown, trendData, branchStats };
  },
};
