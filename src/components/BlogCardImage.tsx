// ============================================================================
// Professional SVG illustrations for blog article cards
// Each illustration is unique and represents the article's topic
// ============================================================================

const illustrations: Record<string, JSX.Element> = {
  'turn-negative-reviews-into-growth': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* Rising arrow from negative to positive */}
      <rect x="40" y="100" width="24" height="30" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="75" y="85" width="24" height="45" rx="4" fill="rgba(255,255,255,0.10)" />
      <rect x="110" y="70" width="24" height="60" rx="4" fill="rgba(255,255,255,0.12)" />
      <rect x="145" y="50" width="24" height="80" rx="4" fill="rgba(255,255,255,0.15)" />
      <rect x="180" y="35" width="24" height="95" rx="4" fill="rgba(255,255,255,0.18)" />
      <rect x="215" y="20" width="24" height="110" rx="4" fill="rgba(255,255,255,0.22)" />
      {/* Trend line */}
      <path d="M52 95 L87 80 L122 65 L157 45 L192 30 L227 15" stroke="rgba(147,197,253,0.5)" strokeWidth="2" strokeDasharray="4 3" />
      {/* Star at top */}
      <circle cx="227" cy="15" r="6" fill="rgba(147,197,253,0.3)" />
      <circle cx="227" cy="15" r="3" fill="rgba(147,197,253,0.6)" />
    </svg>
  ),
  'ai-review-responses-guide': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* Brain/AI network */}
      <circle cx="140" cy="70" r="30" stroke="rgba(147,197,253,0.25)" strokeWidth="1.5" />
      <circle cx="140" cy="70" r="18" stroke="rgba(147,197,253,0.15)" strokeWidth="1" />
      <circle cx="140" cy="70" r="6" fill="rgba(147,197,253,0.3)" />
      {/* Network nodes */}
      <circle cx="80" cy="40" r="4" fill="rgba(255,255,255,0.15)" />
      <circle cx="200" cy="40" r="4" fill="rgba(255,255,255,0.15)" />
      <circle cx="80" cy="100" r="4" fill="rgba(255,255,255,0.15)" />
      <circle cx="200" cy="100" r="4" fill="rgba(255,255,255,0.15)" />
      <circle cx="60" cy="70" r="3" fill="rgba(255,255,255,0.10)" />
      <circle cx="220" cy="70" r="3" fill="rgba(255,255,255,0.10)" />
      {/* Connection lines */}
      <line x1="110" y1="58" x2="84" y2="44" stroke="rgba(147,197,253,0.15)" strokeWidth="1" />
      <line x1="170" y1="58" x2="196" y2="44" stroke="rgba(147,197,253,0.15)" strokeWidth="1" />
      <line x1="110" y1="82" x2="84" y2="96" stroke="rgba(147,197,253,0.15)" strokeWidth="1" />
      <line x1="170" y1="82" x2="196" y2="96" stroke="rgba(147,197,253,0.15)" strokeWidth="1" />
      {/* Chat bubbles */}
      <rect x="50" y="115" width="60" height="24" rx="12" fill="rgba(255,255,255,0.08)" />
      <rect x="170" y="115" width="60" height="24" rx="12" fill="rgba(147,197,253,0.12)" />
      <rect x="58" y="122" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
      <rect x="58" y="128" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.10)" />
      <rect x="178" y="122" width="30" height="3" rx="1.5" fill="rgba(147,197,253,0.2)" />
      <rect x="178" y="128" width="20" height="3" rx="1.5" fill="rgba(147,197,253,0.15)" />
    </svg>
  ),
  'improve-google-business-ratings': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* 5 Stars */}
      {[60, 100, 140, 180, 220].map((x, i) => (
        <g key={i} transform={`translate(${x}, 55)`}>
          <polygon
            points="0,-16 5,-5 17,-5 8,3 11,15 0,8 -11,15 -8,3 -17,-5 -5,-5"
            fill={i < 4 ? `rgba(147,197,253,${0.15 + i * 0.05})` : 'rgba(255,255,255,0.06)'}
            stroke={`rgba(147,197,253,${0.2 + i * 0.05})`}
            strokeWidth="0.8"
          />
        </g>
      ))}
      {/* Rating bar */}
      <rect x="60" y="90" width="160" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="60" y="90" width="128" height="6" rx="3" fill="rgba(147,197,253,0.2)" />
      {/* Score */}
      <rect x="100" y="110" width="80" height="28" rx="14" fill="rgba(255,255,255,0.06)" />
      <text x="140" y="129" textAnchor="middle" fill="rgba(147,197,253,0.5)" fontSize="14" fontWeight="600">4.8</text>
    </svg>
  ),
  'centralized-branch-management': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* Central hub */}
      <circle cx="140" cy="70" r="20" fill="rgba(147,197,253,0.12)" stroke="rgba(147,197,253,0.25)" strokeWidth="1.5" />
      <rect x="132" y="62" width="16" height="16" rx="3" fill="rgba(147,197,253,0.2)" />
      {/* Branch nodes */}
      {[
        { x: 60, y: 35 }, { x: 220, y: 35 },
        { x: 50, y: 105 }, { x: 140, y: 130 }, { x: 230, y: 105 },
      ].map((pos, i) => (
        <g key={i}>
          <line x1="140" y1="70" x2={pos.x} y2={pos.y} stroke="rgba(147,197,253,0.12)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={pos.x} cy={pos.y} r="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <rect x={pos.x - 5} y={pos.y - 5} width="10" height="10" rx="2" fill="rgba(255,255,255,0.1)" />
        </g>
      ))}
    </svg>
  ),
  'review-analytics-data-driven-decisions': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* Chart area */}
      <path d="M40 120 L40 30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <path d="M40 120 L250 120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Area chart */}
      <path d="M40 110 L80 90 L120 95 L160 60 L200 50 L240 30 L240 120 L40 120 Z" fill="rgba(147,197,253,0.08)" />
      <path d="M40 110 L80 90 L120 95 L160 60 L200 50 L240 30" stroke="rgba(147,197,253,0.3)" strokeWidth="2" />
      {/* Data points */}
      {[
        { x: 80, y: 90 }, { x: 120, y: 95 }, { x: 160, y: 60 }, { x: 200, y: 50 }, { x: 240, y: 30 },
      ].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgba(147,197,253,0.4)" />
      ))}
      {/* Grid lines */}
      {[50, 70, 90, 110].map((y, i) => (
        <line key={i} x1="40" y1={y} x2="250" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      ))}
    </svg>
  ),
  'qr-code-solutions-positive-reviews': (
    <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
      {/* QR Code pattern */}
      <rect x="100" y="30" width="80" height="80" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* QR dots */}
      {[
        [0,0],[0,1],[0,2],[0,5],[0,6],
        [1,0],[1,2],[1,4],[1,6],
        [2,0],[2,1],[2,2],[2,4],[2,5],
        [3,3],[3,4],[3,6],
        [4,0],[4,2],[4,3],[4,5],[4,6],
        [5,0],[5,2],[5,5],
        [6,0],[6,1],[6,2],[6,4],[6,5],[6,6],
      ].map(([r, c], i) => (
        <rect key={i} x={110 + c * 9} y={38 + r * 9} width="7" height="7" rx="1" fill={`rgba(147,197,253,${0.12 + (i % 3) * 0.05})`} />
      ))}
      {/* Phone outline */}
      <rect x="200" y="50" width="45" height="75" rx="8" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect x="215" y="55" width="15" height="3" rx="1.5" fill="rgba(255,255,255,0.08)" />
      {/* Scan line */}
      <line x1="95" y1="70" x2="200" y2="85" stroke="rgba(147,197,253,0.15)" strokeWidth="1" strokeDasharray="4 3" />
      {/* Check */}
      <circle cx="222" cy="90" r="10" fill="rgba(147,197,253,0.12)" />
      <path d="M217 90 L220 93 L228 85" stroke="rgba(147,197,253,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function BlogCardImage({ slug }: { slug: string }) {
  return illustrations[slug] || null;
}
