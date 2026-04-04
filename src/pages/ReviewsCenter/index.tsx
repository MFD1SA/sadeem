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
import { MessageSquareText, Search, SlidersHorizontal } from 'lucide-react';
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
  const navSearch: string = (location.state as { search?: string } | null)?.search || '';
  const [filters, setFilters] = useState<ReviewFilters>({ ...defaultFilters, search: navSearch });
  const [selectedReview, setSelectedReview] = useState<DbReview | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const branchMap = useMemo(() => {
    const map: Record<string, string> = {};
    branches.forEach((b: DbBranch) => { map[b.id] = b.internal_name; });
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
    if (!organization?.id) { if (!authLoading) setLoading(false); return; }
    void loadData();
  }, [organization?.id, loadData, authLoading]);

  const filtered = useMemo(() => {
    return reviews.filter((r: DbReview) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(r.review_text || '').toLowerCase().includes(q) && !r.reviewer_name.toLowerCase().includes(q)) return false;
      }
      if (filters.branchId && r.branch_id !== filters.branchId) return false;
      if (filters.rating !== null && r.rating !== filters.rating) return false;
      if (filters.sentiment && r.sentiment !== filters.sentiment) return false;
      if (filters.status && r.status !== filters.status) return false;
      return true;
    });
  }, [reviews, filters]);

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : '—';
  const unreplied = reviews.filter(r => r.status === 'new' || r.status === 'pending_reply' || r.status === 'manual_review_required').length;
  const positive = reviews.filter(r => r.sentiment === 'positive').length;

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-4">
      {/* Page header with stats */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquareText size={20} className="text-brand-500" />
            {t.reviewsCenter.title}
          </h1>
          <p className="page-subtitle">{t.reviewsCenter.subtitle}</p>
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="btn btn-secondary btn-sm lg:hidden"
        >
          <SlidersHorizontal size={14} />
          {t.reviewsCenter.filters}
        </button>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <MessageSquareText size={16} className="text-brand-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{totalReviews}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.reviewsCenter.totalReviews}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <span className="text-amber-500 text-sm">★</span>
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{avgRating}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.reviewsCenter.average}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${unreplied > 5 ? 'bg-red-50' : 'bg-amber-50'}`}>
            <span className={`text-xs font-bold ${unreplied > 5 ? 'text-red-500' : 'text-amber-500'}`}>{unreplied}</span>
          </div>
          <div>
            <div className={`text-lg font-bold leading-none ${unreplied > 5 ? 'text-red-600' : 'text-amber-600'}`}>{unreplied}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.reviewsCenter.awaitingReply}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold">{totalReviews > 0 ? Math.round((positive / totalReviews) * 100) : 0}%</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{positive}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.sentiment.positive}</div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition-all" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <Search size={16} className="text-content-tertiary flex-shrink-0" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder={t.reviewsCenter.searchPlaceholder}
          aria-label={t.reviewsCenter.searchPlaceholder}
          className="w-full border-none bg-transparent text-sm text-content-primary outline-none placeholder:text-content-tertiary"
        />
        {filters.search && (
          <button onClick={() => setFilters(f => ({ ...f, search: '' }))} className="text-content-tertiary hover:text-content-primary" aria-label={t.reviewsCenter.clearFilters}>
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="card overflow-hidden rounded-2xl" style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}>
        <div className="flex h-full">
          {/* Filters sidebar */}
          <div className={`w-52 min-w-[208px] border-e border-border overflow-y-auto flex-col bg-surface-secondary/30 ${showMobileFilters ? 'flex' : 'hidden lg:flex'}`}>
            <div className="px-4 py-3 border-b border-border">
              <span className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                {t.reviewsCenter.filters}
              </span>
            </div>
            <FiltersPanel filters={filters} onChange={setFilters} branches={branches} />
          </div>

          {/* Reviews list */}
          <div className="w-80 min-w-[280px] border-e border-border overflow-y-auto flex-shrink-0 flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-content-primary">
                  {t.reviewsCenter.reviews}
                </span>
                <span className="badge badge-info">{filtered.length}</span>
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
          <div className="flex-1 overflow-y-auto bg-white">
            <ReviewDetail
              review={selectedReview}
              branchName={selectedReview ? branchMap[selectedReview.branch_id] || '' : ''}
              onUpdate={loadData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
