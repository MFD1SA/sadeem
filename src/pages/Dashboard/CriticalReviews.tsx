import { useLanguage } from '@/i18n';
import { Badge } from '@/components/ui/Badge';
import { formatTimeAgo, getStatusColor } from '@/utils/helpers';
import type { DbReview, DbBranch } from '@/types/database';
import { useMemo } from 'react';
import { Star } from 'lucide-react';

export function CriticalReviews({ reviews, branches }: { reviews: DbReview[]; branches: DbBranch[] }) {
  const { t } = useLanguage();

  const branchMap = useMemo(() => {
    const m: Record<string, string> = {};
    branches.forEach(b => { m[b.id] = b.internal_name; });
    return m;
  }, [branches]);

  return (
    <div className="card h-full">
      <div className="card-header">
        <h3>{t.dashboard.criticalReviews}</h3>
        <Badge variant={reviews.length > 0 ? 'danger' : 'success'}>{reviews.length}</Badge>
      </div>
      {reviews.length === 0 ? (
        <div className="flex items-center justify-center py-14">
          <p className="text-sm text-content-tertiary">{t.common.noResults}</p>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {reviews.map(review => (
            <div key={review.id} className="px-5 py-3 hover:bg-surface-secondary/40 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-semibold text-content-primary">{review.rating}</span>
                  </span>
                  <span className="text-[13px] font-medium text-content-primary">{review.reviewer_name}</span>
                </div>
                <span className="text-2xs text-content-tertiary">{formatTimeAgo(review.published_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5 ps-5">
                <Badge variant="neutral">{branchMap[review.branch_id] || '—'}</Badge>
                <Badge variant={getStatusColor(review.status) as 'danger' | 'info' | 'warning'}>
                  {t.status[review.status] || review.status}
                </Badge>
              </div>
              <p className="text-xs text-content-tertiary line-clamp-2 ps-5">{review.review_text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
