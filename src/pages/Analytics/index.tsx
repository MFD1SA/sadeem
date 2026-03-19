import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService, type AnalyticsData } from '@/services/analytics';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RatingDistribution } from './RatingDistribution';
import { SentimentChart } from './SentimentChart';
import { BranchComparison } from './BranchComparison';
import { Star, MessageSquare, Percent } from 'lucide-react';

export default function Analytics() {
  const { t } = useLanguage();
  const { organization } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const d = await analyticsService.getAnalytics(organization.id);
      setData(d);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!data) return null;

  if (data.totalReviews === 0) {
    return (
      <div className="card">
        <EmptyState message={t.common.noData} />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard label={t.analyticsPage.avgRating} value={data.avgRating.toFixed(1)} icon={<Star size={18} strokeWidth={1.5} />} iconColor="text-amber-500" />
        <StatCard label={t.analyticsPage.totalReviews} value={data.totalReviews} icon={<MessageSquare size={18} strokeWidth={1.5} />} iconColor="text-brand-400" />
        <StatCard label={t.analyticsPage.responseRate} value={`${data.responseRate}%`} valueColor="text-emerald-600" icon={<Percent size={18} strokeWidth={1.5} />} iconColor="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <RatingDistribution distribution={data.ratingDistribution} total={data.totalReviews} />
        <SentimentChart breakdown={data.sentimentBreakdown} />
      </div>

      {/* Review Trend */}
      <div className="card mb-6">
        <div className="card-header"><h3>{t.analyticsPage.reviewTrend}</h3></div>
        <div className="card-body">
          <div className="flex items-end gap-1 h-32">
            {data.trendData.map((point: { date: string; count: number; avgRating: number }, i: number) => {
              const maxCount = Math.max(...data.trendData.map((p: { count: number }) => p.count), 1);
              const height = (point.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {point.count > 0 && <span className="text-2xs font-medium text-content-primary">{point.count}</span>}
                  <div className="w-full flex justify-center">
                    <div
                      className="w-6 rounded-t-md bg-brand-500 transition-all duration-300 min-h-[2px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                  </div>
                  <span className="text-2xs text-content-tertiary">{point.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BranchComparison branches={data.branchStats} />
    </div>
  );
}
