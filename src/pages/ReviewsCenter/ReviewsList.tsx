import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/i18n';
import { formatTimeAgo, renderStars, getStatusColor, getSentimentColor } from '@/utils/helpers';
import { MessageSquare } from 'lucide-react';
import type { DbReview } from '@/types/database';

interface ReviewsListProps {
  reviews: DbReview[];
  branchMap: Record<string, string>;
  selectedId: string | null;
  onSelect: (review: DbReview) => void;
}

export function ReviewsList({ reviews, branchMap, selectedId, onSelect }: ReviewsListProps) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  if (reviews.length === 0) {
    return (
      <div className="empty-state py-12">
        <div className="empty-state-icon">
          <MessageSquare size={20} className="text-content-tertiary" />
        </div>
        <div className="empty-state-title">{isAr ? 'لا توجد تقييمات' : 'No reviews found'}</div>
        <div className="empty-state-text">{isAr ? 'جرب تغيير الفلاتر' : 'Try changing your filters'}</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {reviews.map(review => {
        const isSelected = selectedId === review.id;
        return (
          <div
            key={review.id}
            onClick={() => onSelect(review)}
            className={`px-4 py-3.5 cursor-pointer transition-all duration-150 ${
              isSelected
                ? 'bg-brand-50/80 border-s-[3px] border-brand-500'
                : 'border-s-[3px] border-transparent hover:bg-surface-secondary/60'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${
                  isSelected ? 'bg-brand-100 text-brand-700' : 'bg-surface-tertiary text-content-secondary'
                }`}>
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-semibold text-content-primary leading-tight truncate">
                  {review.reviewer_name}
                </span>
              </div>
              <span className="text-[10px] text-content-tertiary whitespace-nowrap">
                {formatTimeAgo(review.published_at)}
              </span>
            </div>

            {/* Stars + badges */}
            <div className="flex items-center gap-1.5 mb-1.5 ms-9">
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

            {/* Preview text */}
            <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed ms-9">
              {review.review_text || (isAr ? 'بدون نص' : 'No text')}
            </p>

            {/* Branch tag */}
            {branchMap[review.branch_id] && (
              <div className="mt-1.5 ms-9">
                <span className="text-[10px] text-content-tertiary bg-surface-tertiary rounded-md px-1.5 py-0.5 font-medium">
                  {branchMap[review.branch_id]}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
