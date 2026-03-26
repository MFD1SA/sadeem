import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { dashboardService, type DashboardStats } from '@/services/dashboard';
import { branchesService } from '@/services/branches';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { StatsGrid } from './StatsGrid';
import { CriticalReviews } from './CriticalReviews';
import { BranchPerformance } from './BranchPerformance';
import type { DbReview, DbBranch } from '@/types/database';

let _cache: { stats: DashboardStats; criticalReviews: DbReview[]; branches: DbBranch[] } | null = null;

export default function Dashboard() {
  const { t } = useLanguage();
  const { organization, isLoading: authLoading } = useAuth();

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

  if (authLoading || loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <StatsGrid data={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <CriticalReviews reviews={criticalReviews} branches={branches} />
        <div className="card h-full">
          <div className="card-header">
            <h3>{t.dashboard.branchPerformance}</h3>
          </div>
          <BranchPerformance branches={branches} />
        </div>
      </div>
    </div>
  );
}
