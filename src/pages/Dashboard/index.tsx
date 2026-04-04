import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { dashboardService, type DashboardStats } from '@/services/dashboard';
import { branchesService } from '@/services/branches';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { Link } from 'react-router-dom';
import {
  MessageSquareText, Inbox, GitBranch, FileText,
  Star, TrendingUp, Clock, AlertCircle, Zap,
  ArrowUpRight, Sparkles,
} from 'lucide-react';
import { formatTimeAgo } from '@/utils/helpers';
import type { DbReview, DbBranch } from '@/types/database';

let _cache: { stats: DashboardStats; criticalReviews: DbReview[]; branches: DbBranch[] } | null = null;

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const { organization, profile, isLoading: authLoading } = useAuth();
  const { subscription, trial } = usePlan();

  const [stats, setStats] = useState<DashboardStats | null>(_cache?.stats ?? null);
  const [criticalReviews, setCriticalReviews] = useState<DbReview[]>(_cache?.criticalReviews ?? []);
  const [branches, setBranches] = useState<DbBranch[]>(_cache?.branches ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!organization?.id) return;
    if (_cache === null) setLoading(true);
    setError('');
    try {
      const [s, cr, br] = await Promise.all([
        dashboardService.getStats(organization.id),
        dashboardService.getCriticalReviews(organization.id),
        branchesService.list(organization.id),
      ]);
      _cache = { stats: s, criticalReviews: cr, branches: br };
      setStats(s);
      setCriticalReviews(cr);
      setBranches(br);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id) { if (!authLoading) setLoading(false); return; }
    void loadData();
  }, [organization?.id, loadData, authLoading]);

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const isAr = lang === 'ar';
  const greeting = t.dashboardExt?.greeting || (isAr ? 'مرحباً' : 'Welcome back');
  const name = profile?.full_name?.split(' ')[0] || '';
  const branchMap: Record<string, string> = {};
  branches.forEach(b => { branchMap[b.id] = b.internal_name; });

  const statCards = [
    {
      icon: Star, label: t.dashboard.avgRating,
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
      iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
      valueColor: 'text-content-primary',
    },
    {
      icon: MessageSquareText, label: t.dashboardExt?.reviewsToday || t.dashboard.newReviews,
      value: String(stats.newReviewsToday),
      iconBg: 'bg-brand-50', iconColor: 'text-brand-500',
      valueColor: 'text-content-primary',
    },
    {
      icon: AlertCircle, label: t.dashboard.unreplied,
      value: String(stats.unrepliedCount),
      iconBg: stats.unrepliedCount > 5 ? 'bg-red-50' : 'bg-amber-50',
      iconColor: stats.unrepliedCount > 5 ? 'text-red-500' : 'text-amber-500',
      valueColor: stats.unrepliedCount > 5 ? 'text-red-600' : 'text-amber-600',
    },
    {
      icon: TrendingUp, label: t.dashboard.responseRate,
      value: `${stats.responseRate}%`,
      iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-600',
    },
  ];

  const quickLinks = [
    { to: '/dashboard/reviews', icon: MessageSquareText, label: t.nav.reviews, color: 'bg-brand-50 text-brand-600', count: stats.totalReviews },
    { to: '/dashboard/replies', icon: Inbox, label: t.nav.replies, color: 'bg-violet-50 text-violet-600', count: stats.unrepliedCount },
    { to: '/dashboard/branches', icon: GitBranch, label: t.nav.branches, color: 'bg-amber-50 text-amber-600', count: stats.totalBranches },
    { to: '/dashboard/templates', icon: FileText, label: t.nav.templates, color: 'bg-emerald-50 text-emerald-600', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + plan badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{greeting}{name ? `, ${name}` : ''}</h1>
          <p className="page-subtitle">
            {isAr ? 'إليك ملخص نشاط منصتك اليوم' : "Here's your platform overview for today"}
          </p>
        </div>
        {subscription && (
          <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border" style={{
            background: 'rgba(76,110,245,0.06)',
            borderColor: 'rgba(76,110,245,0.15)',
            color: '#3b5bdb',
          }}>
            <Sparkles size={13} />
            {subscription.plan?.toUpperCase()}
            {trial.isTrial && (
              <span className="font-normal opacity-70">
                · {isAr ? `${trial.hoursRemaining}س` : `${trial.hoursRemaining}h`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ icon: Icon, label, value, iconBg, iconColor, valueColor }) => (
          <div key={label} className="stat-card flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <div className={`text-xl font-bold leading-none ${valueColor}`}>{value}</div>
              <div className="text-[11px] text-content-tertiary mt-1 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, color, count }) => (
          <Link
            key={to}
            to={to}
            className="stat-card flex items-center gap-3 group cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color} transition-transform group-hover:scale-105`}>
              <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-content-primary truncate">{label}</div>
              {count !== null && (
                <div className="text-[11px] text-content-tertiary font-medium">{count} {isAr ? 'عناصر' : 'items'}</div>
              )}
            </div>
            <ArrowUpRight size={14} className="text-content-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Recent reviews + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent critical reviews */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-content-tertiary" />
              <h3>{isAr ? 'التقييمات الحديثة' : 'Recent Reviews'}</h3>
            </div>
            {criticalReviews.length > 0 && (
              <span className="badge badge-danger">{criticalReviews.length}</span>
            )}
          </div>
          {criticalReviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon bg-emerald-50">
                <Star size={22} className="text-emerald-500" />
              </div>
              <div className="empty-state-title">{isAr ? 'ممتاز! لا توجد تقييمات تحتاج انتباهاً' : 'All clear! No critical reviews'}</div>
              <div className="empty-state-text">{isAr ? 'جميع التقييمات في حالة جيدة' : 'All reviews are in good shape'}</div>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {criticalReviews.slice(0, 5).map(r => (
                <Link key={r.id} to="/dashboard/reviews" className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0 text-xs font-bold text-content-secondary mt-0.5">
                    {r.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-content-primary truncate">{r.reviewer_name}</span>
                      <span className="text-[10px] text-content-tertiary whitespace-nowrap">{formatTimeAgo(r.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 mb-1">
                      {'★★★★★'.split('').map((_, i) => (
                        <span key={i} className={`text-[11px] ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="text-[10px] text-content-tertiary ms-1.5">{branchMap[r.branch_id] || '—'}</span>
                    </div>
                    <p className="text-xs text-content-secondary line-clamp-1">{r.review_text}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {criticalReviews.length > 5 && (
            <div className="px-5 py-3 border-t border-border">
              <Link to="/dashboard/reviews" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors">
                {isAr ? `عرض جميع التقييمات (${criticalReviews.length})` : `View all reviews (${criticalReviews.length})`}
                <ArrowUpRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar cards */}
        <div className="space-y-4">
          {/* AI usage card */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-content-primary">{isAr ? 'استخدام الذكاء الاصطناعي' : 'AI Usage'}</div>
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                <Zap size={14} className="text-brand-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-content-primary">{trial.aiUsed.toLocaleString('en-US')}</div>
            <div className="text-[11px] text-content-tertiary mt-1 font-medium">
              {trial.aiMax >= 999999
                ? (isAr ? 'ردود غير محدودة' : 'Unlimited replies')
                : (isAr ? `من ${trial.aiMax.toLocaleString('en-US')} رد متاح` : `of ${trial.aiMax.toLocaleString('en-US')} replies available`)}
            </div>
            {trial.aiMax > 0 && trial.aiMax < 999999 && (
              <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (trial.aiUsed / trial.aiMax) * 100)}%`,
                    background: trial.aiUsed / trial.aiMax > 0.8 ? '#ef4444' : '#4c6ef5',
                  }}
                />
              </div>
            )}
          </div>

          {/* Branches list card */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[13px] font-semibold text-content-primary">{isAr ? 'الفروع' : 'Branches'}</div>
              <span className="badge badge-neutral">{branches.length}</span>
            </div>
            <div className="space-y-2.5">
              {branches.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                      <GitBranch size={12} className="text-content-tertiary" />
                    </div>
                    <span className="text-[13px] text-content-secondary truncate">{b.internal_name}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`} role="img" aria-label={b.status === 'active' ? 'Active' : 'Inactive'} />
                </div>
              ))}
              {branches.length === 0 && (
                <p className="text-xs text-content-tertiary">{isAr ? 'لا توجد فروع بعد' : 'No branches yet'}</p>
              )}
            </div>
            {branches.length > 4 && (
              <Link to="/dashboard/branches" className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 mt-3 transition-colors">
                {isAr ? 'عرض الكل' : 'View all'}
                <ArrowUpRight size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
