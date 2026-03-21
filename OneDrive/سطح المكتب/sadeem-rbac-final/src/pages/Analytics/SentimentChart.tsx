import { useLanguage } from '@/i18n';

interface Props {
  breakdown: { positive: number; neutral: number; negative: number };
}

export function SentimentChart({ breakdown }: Props) {
  const { t } = useLanguage();
  const total = breakdown.positive + breakdown.neutral + breakdown.negative;

  const segments = [
    { key: 'positive', label: t.sentiment.positive, value: breakdown.positive, color: '#12b886' },
    { key: 'neutral', label: t.sentiment.neutral, value: breakdown.neutral, color: '#f59f00' },
    { key: 'negative', label: t.sentiment.negative, value: breakdown.negative, color: '#e03131' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.analyticsPage.sentimentAnalysis}</h3>
      </div>
      <div className="card-body">
        {/* Horizontal bar */}
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          {segments.map(seg => (
            <div
              key={seg.key}
              style={{ width: `${total > 0 ? (seg.value / total) * 100 : 0}%`, backgroundColor: seg.color }}
              className="transition-all duration-500"
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-content-secondary">{seg.label}</span>
              <span className="text-xs font-semibold text-content-primary">{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
