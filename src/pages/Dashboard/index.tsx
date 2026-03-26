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
    if (authLoading) return;
    if (!organization?.id) { setLoading(false); return; }
    void loadData();
  }, [authLoading, organization?.id, loadData]);

  if (authLoading || loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!stats) return null;

  const isAr = lang === 'ar';
  const greeting = isAr ? 'مرحباً' : 'Welcome back';
  const name = profile?.full_name?.split(' ')[0] || '';
  const branchMap: Record<string, string> = {};
  branches.forEach(b => { branchMap[b.id] = b.internal_name; });

  const quickLinks = [
    { to: '/dashboard/reviews',      icon: MessageSquareText, label: isAr ? 'مركز التقييمات' : 'Reviews Center',   color: 'bg-brand-50 text-brand-600',   count: stats.totalReviews },
    { to: '/dashboard/replies',       icon: Inbox,            label: isAr ? 'صندوق الردود'  : 'Responses Inbox',    color: 'bg-violet-50 text-violet-600',  count: stats.unrepliedCount },
    { to: '/dashboard/branches',      icon: GitBranch,        label: isAr ? 'الفروع'         : 'Branches',           color: 'bg-amber-50 text-amber-600',    count: stats.totalBranches },
    { to: '/dashboard/templates',     icon: FileText,         label: isAr ? 'القوالب'        : 'Templates',          color: 'bg-emerald-50 text-emerald-600', count: null },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting + plan badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-content-primary">{greeting}{name ? `, ${name}` : ''} 👋</h1>
          <p className="text-xs text-content-tertiary mt-0.5">
            {isAr ? 'إليك ملخص نشاط منصتك اليوم' : "Here's your platform overview for today"}
          </p>
        </div>
        {subscription && (
          <div className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200">
            <Zap size={12} />
            {subscription.plan_id?.toUpperCase()}
            {trial.isTrial && <span className="font-normal opacity-70">· {isAr ? `${trial.hoursRemaining}س` : `${trial.hoursRemaining}h`}</span>}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card card-body flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Star size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-content-primary leading-none">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            </div>
            <div className="text-[10px] text-content-tertiary mt-0.5">{isAr ? 'متوسط التقييم' : 'Avg Rating'}</div>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <MessageSquareText size={16} className="text-brand-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-content-primary leading-none">{stats.newReviewsToday}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5">{isAr ? 'تقييمات اليوم' : 'New Today'}</div>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stats.unrepliedCount > 5 ? 'bg-red-50' : 'bg-amber-50'}`}>
            <AlertCircle size={16} className={stats.unrepliedCount > 5 ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div>
            <div className={`text-xl font-bold leading-none ${stats.unrepliedCount > 5 ? 'text-red-600' : 'text-amber-600'}`}>{stats.unrepliedCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5">{isAr ? 'غير مردود عليها' : 'Unreplied'}</div>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600 leading-none">{stats.responseRate}%</div>
            <div className="text-[10px] text-content-tertiary mt-0.5">{isAr ? 'معدل الاستجابة' : 'Response Rate'}</div>
          </div>
        </div>
      </div>

      {/* Quick navigation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, color, count }) => (
          <Link key={to} to={to} className="card card-body flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-content-primary truncate">{label}</div>
              {count !== null && (
                <div className="text-[10px] text-content-tertiary">{count} {isAr ? 'عناصر' : 'items'}</div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent reviews + AI usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent critical reviews */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-content-tertiary" />
              <h3 className="text-sm font-semibold text-content-primary">{isAr ? 'التقييمات الحديثة' : 'Recent Reviews'}</h3>
            </div>
            {criticalReviews.length > 0 && (
              <span className="text-xs bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full">{criticalReviews.length}</span>
            )}
          </div>
          {criticalReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <Star size={20} className="text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-content-primary">{isAr ? 'ممتاز! لا توجد تقييمات تحتاج انتباهاً' : 'All clear! No critical reviews'}</p>
              <p className="text-xs text-content-tertiary mt-1">{isAr ? 'جميع التقييمات في حالة جيدة' : 'All reviews are in good shape'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {criticalReviews.slice(0, 5).map(r => (
                <Link key={r.id} to="/dashboard/reviews" className="flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0 text-sm font-bold text-content-secondary mt-0.5">
                    {r.reviewer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-content-primary truncate">{r.reviewer_name}</span>
                      <span className="text-[10px] text-content-tertiary whitespace-nowrap">{formatTimeAgo(r.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 mb-1">
                      {'★★★★★'.split('').map((_, i) => (
                        <span key={i} className={`text-[10px] ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="text-[10px] text-content-tertiary ms-1">{branchMap[r.branch_id] || '—'}</span>
                    </div>
                    <p className="text-xs text-content-secondary line-clamp-1">{r.review_text}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {criticalReviews.length > 5 && (
            <div className="px-4 py-3 border-t border-border">
              <Link to="/dashboard/reviews" className="text-xs text-brand-600 hover:underline font-medium">
                {isAr ? `عرض جميع التقييمات (${criticalReviews.length})` : `View all reviews (${criticalReviews.length})`}
              </Link>
            </div>
          )}
        </div>

        {/* Branch summary + AI usage */}
        <div className="space-y-3">
          {/* AI usage */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-content-primary">{isAr ? 'استخدام الذكاء الاصطناعي' : 'AI Usage'}</div>
              <Zap size={13} className="text-brand-400" />
            </div>
            <div className="text-2xl font-bold text-content-primary">{trial.aiUsed}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5">{isAr ? 'ردود مولّدة' : 'Replies generated'}</div>
          </div>

          {/* Branches list */}
          <div className="card card-body">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-content-primary">{isAr ? 'الفروع' : 'Branches'}</div>
              <span className="text-xs font-bold text-content-primary">{branches.length}</span>
            </div>
            <div className="space-y-2">
              {branches.slice(0, 4).map(b => (
                <div key={b.id} className="flex items-center justify-between">
                  <span className="text-xs text-content-secondary truncate">{b.internal_name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${b.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                </div>
              ))}
              {branches.length === 0 && (
                <p className="text-xs text-content-tertiary">{isAr ? 'لا توجد فروع بعد' : 'No branches yet'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
