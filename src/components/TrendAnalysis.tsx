import { TrendingUp, ArrowUpRight, BarChart3, Calendar } from 'lucide-react';

const TREND_DATA = [
  { niche: 'AI Productivity', data: [42, 48, 55, 61, 70, 82, 94], peak: '94' },
  { niche: 'Budget Travel', data: [38, 44, 50, 57, 63, 72, 87], peak: '87' },
  { niche: 'Solopreneur Finance', data: [30, 36, 42, 50, 58, 68, 82], peak: '82' },
  { niche: 'Home Lab Tech', data: [50, 52, 55, 58, 62, 68, 78], peak: '78' },
];

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline
        points={pts + ` ${w},${h} 0,${h}`}
        fill={`url(#grad-${color.replace('#', '')})`}
        stroke="none"
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 4) - 2;
        if (i === data.length - 1) {
          return <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />;
        }
        return null;
      })}
    </svg>
  );
}

export default function TrendAnalysis() {
  const colors = ['#FF0000', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Trend Analysis
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            7-week momentum tracking across niches
          </p>
        </div>
        <div className="flex items-center gap-1 clay-tag">
          <Calendar size={11} strokeWidth={2.5} />
          <span>Last 7 weeks</span>
        </div>
      </div>

      {/* Week Labels */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 60px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Niche</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>7W Trend</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>Score</span>
        </div>

        {TREND_DATA.map((item, i) => (
          <div
            key={item.niche}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 60px',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: i < TREND_DATA.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {item.niche}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={11} strokeWidth={3} color="#22C55E" />
                <span style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 700 }}>
                  +{((item.data[item.data.length - 1] - item.data[0]) / item.data[0] * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MiniSparkline data={item.data} color={colors[i % colors.length]} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: colors[i % colors.length], letterSpacing: '-0.02em' }}>
                {item.peak}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Week labels bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '6px 16px',
        }}
      >
        {WEEKS.map(w => (
          <span key={w} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{w}</span>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: 'Fastest Growing', value: 'AI Productivity', sub: '+124% 7W', color: 'var(--yt-red)' },
          { icon: BarChart3, label: 'Most Consistent', value: 'Home Lab Tech', sub: 'Low volatility', color: '#3B82F6' },
          { icon: ArrowUpRight, label: 'Best Entry Now', value: 'Solopreneur', sub: 'Low competition', color: '#10B981' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat-card">
              <Icon size={14} strokeWidth={2.5} color={item.color} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: item.color, fontWeight: 600 }}>{item.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
