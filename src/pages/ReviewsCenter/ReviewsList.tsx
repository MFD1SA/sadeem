import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/i18n';
import { formatTimeAgo, renderStars, getStatusColor, getSentimentColor } from '@/utils/helpers';
import type { DbReview } from '@/types/database';

interface ReviewsListProps {
  reviews: DbReview[];
  branchMap: Record<string, string>;
  selectedId: string | null;
  onSelect: (review: DbReview) => void;
}

export function ReviewsList({ reviews, branchMap, selectedId, onSelect }: ReviewsListProps) {
  const { t } = useLanguage();

  if (reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-content-secondary p-4">
        {t.common.noResults}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto">
      {reviews.map(review => (
        <div
          key={review.id}
          onClick={() => onSelect(review)}
          className={`px-4 py-3 cursor-pointer transition-colors hover:bg-surface-secondary ${
            selectedId === review.id ? 'bg-brand-50 border-r-2 rtl:border-r-2 rtl:border-l-0 ltr:border-l-2 ltr:border-r-0 border-brand-600' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-content-primary">{review.reviewer_name}</span>
            <span className="text-2xs text-content-tertiary">{formatTimeAgo(review.published_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-amber-500 text-xs">{renderStars(review.rating)}</span>
            {review.sentiment && (
              <Badge variant={getSentimentColor(review.sentiment) as 'success' | 'warning' | 'danger'}>
                {t.sentiment[review.sentiment]}
              </Badge>
            )}
            {review.is_followup && (
              <Badge variant="warning">{t.status.manual_review_required || 'متابعة'}</Badge>
            )}
          </div>
          <p className="text-xs text-content-secondary line-clamp-2 mb-1.5">{review.review_text}</p>
          <div className="flex items-center gap-1.5">
            <Badge variant="neutral">{branchMap[review.branch_id] || '—'}</Badge>
            <Badge variant={getStatusColor(review.status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>
              {t.status[review.status] || review.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
