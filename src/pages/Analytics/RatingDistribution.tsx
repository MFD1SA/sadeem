import { useLanguage } from '@/i18n';

interface Props {
  distribution: { [key: number]: number };
  total: number;
}

export function RatingDistribution({ distribution, total }: Props) {
  const { t } = useLanguage();

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.analyticsPage.ratingDistribution}</h3>
      </div>
      <div className="card-body space-y-3">
        {[5, 4, 3, 2, 1].map(star => {
          const count = distribution[star] || 0;
          const percent = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs font-medium text-content-secondary w-12 text-left ltr:text-left rtl:text-right flex items-center gap-1">
                <span className="text-amber-500">★</span> {star}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: star >= 4 ? '#12b886' : star === 3 ? '#f59f00' : '#e03131',
                  }}
                />
              </div>
              <span className="text-xs text-content-secondary w-14 text-left ltr:text-left rtl:text-right">{count} ({percent.toFixed(0)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
