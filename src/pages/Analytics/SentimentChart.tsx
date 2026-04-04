import { useLanguage } from '@/i18n';

interface Props {
  breakdown: { positive: number; neutral: number; negative: number };
}

export function SentimentChart({ breakdown }: Props) {
  const { t } = useLanguage();
  const total = breakdown.positive + breakdown.neutral + breakdown.negative;

  const segments = [
    { key: 'positive', label: t.sentiment.positive, value: breakdown.positive, color: '#059669', bg: 'bg-emerald-50' },
    { key: 'neutral', label: t.sentiment.neutral, value: breakdown.neutral, color: '#f59e0b', bg: 'bg-amber-50' },
    { key: 'negative', label: t.sentiment.negative, value: breakdown.negative, color: '#ef4444', bg: 'bg-red-50' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.analyticsPage.sentimentAnalysis}</h3>
      </div>
      <div className="card-body">
        {/* Horizontal bar */}
        <div className="flex h-3 rounded-full overflow-hidden mb-5">
          {segments.map(seg => (
            <div
              key={seg.key}
              style={{ width: `${total > 0 ? (seg.value / total) * 100 : 33.3}%`, backgroundColor: seg.color }}
              className="transition-all duration-700 ease-out first:rounded-s-full last:rounded-e-full"
            />
          ))}
        </div>

        {/* Legend cards */}
        <div className="grid grid-cols-3 gap-3">
          {segments.map(seg => {
            const percent = total > 0 ? ((seg.value / total) * 100).toFixed(0) : '0';
            return (
              <div key={seg.key} className="text-center p-3 rounded-xl" style={{ background: `${seg.color}08`, border: `1px solid ${seg.color}15` }}>
                <div className="text-xl font-bold" style={{ color: seg.color }}>{percent}%</div>
                <div className="text-[11px] text-content-tertiary font-medium mt-0.5">{seg.label}</div>
                <div className="text-[10px] text-content-tertiary">{seg.value} {(t.common as Record<string, string>).reviews || t.nav.reviews}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
