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
    <div className="divide-y divide-border/60">
      {reviews.map(review => (
        <div
          key={review.id}
          onClick={() => onSelect(review)}
          className={`px-4 py-3.5 cursor-pointer transition-all hover:bg-surface-secondary/60 ${
            selectedId === review.id
              ? 'bg-brand-50/80 border-s-2 border-brand-500'
              : 'border-s-2 border-transparent'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-[13px] font-semibold text-content-primary leading-tight">{review.reviewer_name}</span>
            <span className="text-[10px] text-content-tertiary whitespace-nowrap mt-0.5">{formatTimeAgo(review.published_at)}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-amber-400 text-xs leading-none">{renderStars(review.rating)}</span>
            <Badge variant={getStatusColor(review.status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>
              {t.status[review.status] || review.status}
            </Badge>
            {review.sentiment && (
              <Badge variant={getSentimentColor(review.sentiment) as 'success' | 'warning' | 'danger'}>
                {t.sentiment[review.sentiment]}
              </Badge>
            )}
          </div>
          <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">{review.review_text}</p>
          <div className="mt-1.5">
            <span className="text-[10px] text-content-tertiary bg-surface-secondary rounded px-1.5 py-0.5">{branchMap[review.branch_id] || '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
