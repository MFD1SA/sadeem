import { useLanguage } from '@/i18n';

interface Props {
  distribution: { [key: number]: number };
  total: number;
}

const STAR_COLORS: Record<number, string> = {
  5: '#059669', 4: '#10b981', 3: '#f59e0b', 2: '#f97316', 1: '#ef4444',
};

export function RatingDistribution({ distribution, total }: Props) {
  const { t } = useLanguage();

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.analyticsPage.ratingDistribution}</h3>
      </div>
      <div className="card-body space-y-3.5">
        {[5, 4, 3, 2, 1].map(star => {
          const count = distribution[star] || 0;
          const percent = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-10 flex-shrink-0">
                <span className="text-amber-400 text-xs">★</span>
                <span className="text-[13px] font-semibold text-content-primary">{star}</span>
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percent}%`, backgroundColor: STAR_COLORS[star] }}
                />
              </div>
              <div className="w-20 text-end flex-shrink-0">
                <span className="text-[13px] font-semibold text-content-primary">{count}</span>
                <span className="text-[11px] text-content-tertiary ms-1">({percent.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
