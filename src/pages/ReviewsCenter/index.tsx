import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { reviewsService } from '@/services/reviews';
import { branchesService } from '@/services/branches';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { FiltersPanel } from './FiltersPanel';
import { ReviewsList } from './ReviewsList';
import { ReviewDetail } from './ReviewDetail';
import type { DbReview, DbBranch } from '@/types/database';

interface ReviewFilters {
  search: string;
  branchId: string;
  rating: number | null;
  sentiment: string | null;
  status: string | null;
}

const defaultFilters: ReviewFilters = {
  search: '',
  branchId: '',
  rating: null,
  sentiment: null,
  status: null,
};

export default function ReviewsCenter() {
  const { t } = useLanguage();
  const { organization, isLoading: authLoading } = useAuth();

  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ReviewFilters>(defaultFilters);
  const [selectedReview, setSelectedReview] = useState<DbReview | null>(null);

  const branchMap = useMemo(() => {
    const map: Record<string, string> = {};
    branches.forEach((b: DbBranch) => {
      map[b.id] = b.internal_name;
    });
    return map;
  }, [branches]);

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    setError('');

    try {
      const [revs, brnchs] = await Promise.all([
        reviewsService.list(organization.id),
        branchesService.list(organization.id),
      ]);

      setReviews(revs);
      setBranches(brnchs);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!organization?.id) return;
    void loadData();
  }, [authLoading, organization?.id, loadData]);

  const filtered = useMemo(() => {
    return reviews.filter((r: DbReview) => {
      if (
        filters.search &&
        !(r.review_text || '').includes(filters.search) &&
        !r.reviewer_name.includes(filters.search)
      ) {
        return false;
      }

      if (filters.branchId && r.branch_id !== filters.branchId) {
        return false;
      }

      if (filters.rating !== null && r.rating !== filters.rating) {
        return false;
      }

      if (filters.sentiment && r.sentiment !== filters.sentiment) {
        return false;
      }

      if (filters.status && r.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [reviews, filters]);

  if (authLoading || loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="card h-[calc(100vh-120px)] flex overflow-hidden">
      <div className="w-56 min-w-[224px] border-l rtl:border-l ltr:border-l-0 ltr:border-r border-border overflow-y-auto hidden lg:block">
        <FiltersPanel filters={filters} onChange={setFilters} branches={branches} />
      </div>

      <div className="w-80 min-w-[280px] border-l rtl:border-l ltr:border-l-0 ltr:border-r border-border overflow-y-auto flex-shrink-0">
        <div className="px-4 py-3 border-b border-border bg-surface-secondary">
          <div className="text-xs font-semibold text-content-secondary">
            {filtered.length} {t.analyticsPage.reviews}
          </div>
        </div>

        <ReviewsList
          reviews={filtered}
          branchMap={branchMap}
          selectedId={selectedReview?.id ?? null}
          onSelect={setSelectedReview}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <ReviewDetail
          review={selectedReview}
          branchName={selectedReview ? branchMap[selectedReview.branch_id] || '' : ''}
          onUpdate={loadData}
        />
      </div>
    </div>
  );
}
