import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Pre-populate search from topbar navigation state
  const navSearch: string = (location.state as { search?: string } | null)?.search || '';
  const [filters, setFilters] = useState<ReviewFilters>({ ...defaultFilters, search: navSearch });
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
    if (!organization?.id) { setLoading(false); return; }
    void loadData();
  }, [authLoading, organization?.id, loadData]);

  const filtered = useMemo(() => {
    return reviews.filter((r: DbReview) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inText = (r.review_text || '').toLowerCase().includes(q);
        const inName = r.reviewer_name.toLowerCase().includes(q);
        if (!inText && !inName) return false;
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
    <div className="card h-[calc(100vh-120px)] flex overflow-hidden rounded-2xl shadow-sm border border-border">
      {/* Filters sidebar */}
      <div className="w-52 min-w-[208px] border-e border-border overflow-y-auto hidden lg:flex lg:flex-col bg-surface-secondary/40">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">{t.analyticsPage.filters || 'Filters'}</span>
        </div>
        <FiltersPanel filters={filters} onChange={setFilters} branches={branches} />
      </div>

      {/* Reviews list */}
      <div className="w-72 min-w-[260px] border-e border-border overflow-y-auto flex-shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-surface-primary sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-primary">{t.reviewsCenter?.title || 'Reviews'}</span>
            <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ReviewsList
            reviews={filtered}
            branchMap={branchMap}
            selectedId={selectedReview?.id ?? null}
            onSelect={setSelectedReview}
          />
        </div>
      </div>

      {/* Review detail */}
      <div className="flex-1 overflow-y-auto bg-surface-primary">
        <ReviewDetail
          review={selectedReview}
          branchName={selectedReview ? branchMap[selectedReview.branch_id] || '' : ''}
          onUpdate={loadData}
        />
      </div>
    </div>
  );
}
