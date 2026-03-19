import { useLanguage } from '@/i18n';
import { StatCard } from '@/components/ui/StatCard';
import { Star, MessageSquare, MessageSquareX, Percent, Building2 } from 'lucide-react';
import type { DashboardStats } from '@/services/dashboard';

export function StatsGrid({ data }: { data: DashboardStats }) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <StatCard
        label={t.dashboard.avgRating}
        value={data.avgRating > 0 ? data.avgRating.toFixed(1) : '—'}
        sub={`${data.totalReviews} ${t.analyticsPage.reviews}`}
        icon={<Star size={18} strokeWidth={1.5} />}
        iconColor="text-amber-500"
      />
      <StatCard
        label={t.dashboard.newReviews}
        value={data.newReviewsToday}
        sub={t.dashboard.today}
        valueColor="text-brand-600"
        icon={<MessageSquare size={18} strokeWidth={1.5} />}
        iconColor="text-brand-400"
      />
      <StatCard
        label={t.dashboard.unreplied}
        value={data.unrepliedCount}
        valueColor={data.unrepliedCount > 5 ? 'text-red-600' : 'text-amber-600'}
        icon={<MessageSquareX size={18} strokeWidth={1.5} />}
        iconColor={data.unrepliedCount > 5 ? 'text-red-400' : 'text-amber-400'}
      />
      <StatCard
        label={t.dashboard.responseRate}
        value={`${data.responseRate}%`}
        valueColor="text-emerald-600"
        icon={<Percent size={18} strokeWidth={1.5} />}
        iconColor="text-emerald-400"
      />
      <StatCard
        label={t.branchesPage.title}
        value={data.totalBranches}
        icon={<Building2 size={18} strokeWidth={1.5} />}
        iconColor="text-content-tertiary"
      />
    </div>
  );
}
