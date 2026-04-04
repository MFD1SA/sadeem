import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { analyticsService, type AnalyticsData } from '@/services/analytics';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RatingDistribution } from './RatingDistribution';
import { SentimentChart } from './SentimentChart';
import { BranchComparison } from './BranchComparison';
import { Star, MessageSquare, Percent, TrendingUp, BarChart3 } from 'lucide-react';

let _cache: AnalyticsData | null = null;

export default function Analytics() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
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
    if (!organization?.id) { if (!authLoading) setLoading(false); return; }
    void loadData();
  }, [organization?.id, loadData, authLoading]);

  if (loading) {
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
      {/* Page header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-500" />
          {t.analyticsPage.title}
        </h1>
        <p className="page-subtitle">{t.analyticsPage.subtitle}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-xl font-bold text-content-primary leading-none">{data.avgRating.toFixed(1)}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.analyticsPage.avgRating}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={18} className="text-brand-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-xl font-bold text-content-primary leading-none">{data.totalReviews}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.analyticsPage.totalReviews}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Percent size={18} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600 leading-none">{data.responseRate}%</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.analyticsPage.responseRate}</div>
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
            <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-brand-500" />
            </div>
            <h3 className="text-sm font-semibold text-content-primary">{t.analyticsPage.reviewTrend}</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="flex items-end gap-1.5 h-44 pt-6">
            {data.trendData.map(
              (point: { date: string; count: number; avgRating: number }, i: number) => {
                const height = (point.count / maxCount) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {point.count > 0 && (
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-800 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                        {point.count} {t.analyticsPage.reviewCount}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                      </div>
                    )}
                    <div className="w-full flex justify-center items-end flex-1">
                      <div
                        className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 hover:from-brand-700 hover:to-brand-500 transition-all duration-500 ease-out shadow-sm"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-content-tertiary whitespace-nowrap font-medium">
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
