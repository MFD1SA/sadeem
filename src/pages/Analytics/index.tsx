import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService, type AnalyticsData } from '@/services/analytics';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RatingDistribution } from './RatingDistribution';
import { SentimentChart } from './SentimentChart';
import { BranchComparison } from './BranchComparison';
import { Star, MessageSquare, Percent, TrendingUp } from 'lucide-react';

let _cache: AnalyticsData | null = null;

export default function Analytics() {
  const { t } = useLanguage();
  const { organization, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<AnalyticsData | null>(_cache);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    if (_cache === null) setLoading(true);
    setError('');

    try {
      const d = await analyticsService.getAnalytics(organization.id);
      _cache = d;
      setData(d);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!organization?.id) { setLoading(false); return; }
    void loadData();
  }, [authLoading, organization?.id, loadData]);

  if (authLoading || loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!data) {
    return null;
  }

  if (data.totalReviews === 0) {
    return (
      <div className="card">
        <EmptyState message={t.common.noData} />
      </div>
    );
  }

  const maxCount = Math.max(...data.trendData.map((p: { count: number }) => p.count), 1);

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card card-body flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-bold text-content-primary leading-none">{data.avgRating.toFixed(1)}</div>
            <div className="text-xs text-content-tertiary mt-0.5">{t.analyticsPage.avgRating}</div>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={18} className="text-brand-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-bold text-content-primary leading-none">{data.totalReviews}</div>
            <div className="text-xs text-content-tertiary mt-0.5">{t.analyticsPage.totalReviews}</div>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Percent size={18} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 leading-none">{data.responseRate}%</div>
            <div className="text-xs text-content-tertiary mt-0.5">{t.analyticsPage.responseRate}</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RatingDistribution distribution={data.ratingDistribution} total={data.totalReviews} />
        <SentimentChart breakdown={data.sentimentBreakdown} />
      </div>

      {/* Trend chart */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-content-tertiary" />
            <h3 className="text-sm font-semibold text-content-primary">{t.analyticsPage.reviewTrend}</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-end gap-1 h-36 pt-6">
            {data.trendData.map(
              (point: { date: string; count: number; avgRating: number }, i: number) => {
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {point.count > 0 && (
                      <span className="text-[10px] font-semibold text-content-primary absolute -top-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.count}
                      </span>
                    )}
                    <div className="w-full flex justify-center items-end flex-1">
                      <div
                        className="w-full max-w-[28px] rounded-t-md bg-brand-500 hover:bg-brand-600 transition-all duration-300"
                        style={{ height: `${Math.max(height, 3)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-content-tertiary whitespace-nowrap">
                      {point.date.slice(5)}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      <BranchComparison branches={data.branchStats} />
    </div>
  );
}
