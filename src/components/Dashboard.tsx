import { TrendingUp, Youtube, Users, Eye, ThumbsUp, Zap, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface StatCardData {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
}

const STATS: StatCardData[] = [
  { label: 'Niches Analyzed', value: '1,284', delta: '+12% this week', positive: true, icon: Zap, color: 'var(--yt-red)' },
  { label: 'Avg. Search Volume', value: '48.2K', delta: '+5.3% MoM', positive: true, icon: Eye, color: '#3B82F6' },
  { label: 'Competitor Channels', value: '392', delta: '+28 new', positive: true, icon: Youtube, color: 'var(--yt-red)' },
  { label: 'Keyword Clusters', value: '76', delta: '+3 generated', positive: true, icon: Users, color: '#10B981' },
];

const TRENDING_NICHES = [
  { name: 'AI Productivity Tools', score: 94, growth: '+38%', subs: '2.1M', tag: 'Exploding' },
  { name: 'Budget Travel 2025', score: 87, growth: '+22%', subs: '1.4M', tag: 'Rising' },
  { name: 'Solopreneur Finance', score: 82, growth: '+19%', subs: '870K', tag: 'Rising' },
  { name: 'Home Lab Tech', score: 78, growth: '+14%', subs: '620K', tag: 'Steady' },
  { name: 'Slow Living Vlog', score: 73, growth: '+11%', subs: '410K', tag: 'Steady' },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div
      style={{
        width: '80px',
        height: '6px',
        borderRadius: '999px',
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-inset)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${score}%`,
          borderRadius: '999px',
          background:
            score > 90
              ? 'linear-gradient(90deg, #FF3333, #FF0000)'
              : score > 80
              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
              : 'linear-gradient(90deg, #22C787, #10B981)',
          boxShadow:
            score > 90
              ? '0 0 6px rgba(255,0,0,0.4)'
              : score > 80
              ? '0 0 6px rgba(245,158,11,0.4)'
              : '0 0 6px rgba(34,199,138,0.4)',
          transition: 'width 0.6s ease-out',
        }}
      />
    </div>
  );
}

export default function Dashboard(): React.ReactElement {
  const { isDark } = useTheme();
  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Dashboard
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time YouTube niche intelligence overview
          </p>
        </div>
        <span className="clay-tag-red flex items-center gap-1.5">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--yt-red)', display: 'inline-block', animation: 'pulseRed 2s infinite' }} />
          Live
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: `${stat.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-clay-sm)',
                  }}
                >
                  <Icon size={15} strokeWidth={2.5} color={stat.color} />
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: stat.positive ? '#22C55E' : '#EF4444',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <ArrowUpRight size={11} strokeWidth={3} />
                  {stat.delta}
                </span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trending Niches */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '24px',
          boxShadow: isDark
            ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 12px 30px rgba(0,0,0,0.6)'
            : 'inset 0 1px 0 rgba(255,255,255,1), 0 12px 24px rgba(0,0,0,0.05)',
          border: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={15} color="var(--yt-red)" strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Trending Niches
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Top 5 this week</span>
        </div>
        <div>
          {TRENDING_NICHES.map((niche, i) => (
            <div
              key={niche.name}
              style={{
                padding: '13px 20px',
                borderBottom: i < TRENDING_NICHES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '7px',
                  background: i === 0 ? 'linear-gradient(135deg, #FF3333, #FF0000)' : 'var(--bg-elevated)',
                  color: i === 0 ? '#FFFFFF' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  boxShadow: i === 0 ? 'var(--shadow-red)' : 'var(--shadow-clay-sm)',
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {niche.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '1px' }}>
                  {niche.subs} total subscribers
                </div>
              </div>
              <ScoreBar score={niche.score} />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#22C55E',
                  minWidth: '42px',
                  textAlign: 'right',
                }}
              >
                {niche.growth}
              </span>
              <span
                className={niche.tag === 'Exploding' ? 'clay-tag-red' : niche.tag === 'Rising' ? 'clay-tag-mint' : 'clay-tag'}
              >
                {niche.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Analyze Niche', icon: Zap, color: 'var(--yt-red)' },
          { label: 'View Trends', icon: TrendingUp, color: '#3B82F6' },
          { label: 'Export Report', icon: ArrowUpRight, color: '#10B981' },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              className="clay-btn-secondary py-3 px-3 flex flex-col items-center gap-2"
            >
              <Icon size={16} strokeWidth={2.5} color={action.color} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
