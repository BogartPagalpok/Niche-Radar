import { TrendingUp, Youtube, Users, Eye, Zap, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useVideoContext } from '../context/VideoContext';

interface StatCardData {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
}

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
          width: `${Math.min(100, Math.max(0, score))}%`,
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

function parseViewCount(viewStr: string): number {
  const normalized = viewStr?.toUpperCase()?.trim() || '0';
  if (normalized.includes('M')) return parseFloat(normalized.replace('M', '')) * 1000000;
  if (normalized.includes('K')) return parseFloat(normalized.replace('K', '')) * 1000;
  return parseFloat(normalized.replace(/[^0-9.]/g, '')) || 0;
}

function formatViewLabel(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
  return views.toString();
}

export default function Dashboard(): React.ReactElement {
  const { isDark } = useTheme();
  const { searchedVideos, savedNiches, selectVideo } = useVideoContext();

  const hasLiveResults = Array.isArray(searchedVideos) && searchedVideos.length > 0;

  // REAL stats from search results
  const totalAnalyzed = hasLiveResults ? searchedVideos.length : 0;
  const uniqueChannels = hasLiveResults ? new Set(searchedVideos.map(v => v.channel_id).filter(Boolean)).size : 0;
  const savedCount = Array.isArray(savedNiches) ? savedNiches.length : 0;

  // Total views across all search results
  const totalViews = hasLiveResults
    ? searchedVideos.reduce((sum, v) => sum + parseViewCount(v.view_count), 0)
    : 0;

  const STATS: StatCardData[] = [
    {
      label: 'Videos Found',
      value: totalAnalyzed.toLocaleString(),
      delta: hasLiveResults ? 'Current search' : 'Search first',
      positive: true,
      icon: Zap,
      color: 'var(--yt-red)',
    },
    {
      label: 'Total Views',
      value: hasLiveResults ? formatViewLabel(totalViews) : '—',
      delta: hasLiveResults ? 'Across results' : 'No data',
      positive: true,
      icon: Eye,
      color: '#3B82F6',
    },
    {
      label: 'Unique Channels',
      value: uniqueChannels.toLocaleString(),
      delta: hasLiveResults ? 'In results' : 'No data',
      positive: true,
      icon: Youtube,
      color: 'var(--yt-red)',
    },
    {
      label: 'Saved Niches',
      value: savedCount.toString(),
      delta: 'Local storage',
      positive: true,
      icon: Users,
      color: '#10B981',
    },
  ];

  // REAL trending: top 5 videos by view count, with real scores based on views
  const trendingDataSource = hasLiveResults
    ? [...searchedVideos]
        .sort((a, b) => parseViewCount(b.view_count) - parseViewCount(a.view_count))
        .slice(0, 5)
        .map((video) => {
          const views = parseViewCount(video.view_count);
          const maxViews = parseViewCount(searchedVideos[0]?.view_count || '1');
          // Score relative to top video (70-99 range)
          const score = Math.round(70 + (views / Math.max(maxViews, 1)) * 29);
          
          // Growth based on recency
          const daysMatch = video.upload_date?.match(/(\d+)/);
          const daysAgo = daysMatch ? parseInt(daysMatch[0]) : 7;
          const growth = daysAgo <= 1 ? '+High' : daysAgo <= 3 ? '+Medium' : '+Steady';

          return {
            name: video.title,
            score,
            growth,
            subs: video.channel_name,
            tag: score > 90 ? 'Exploding' : score > 80 ? 'Rising' : 'Steady',
            rawVideo: video,
          };
        })
    : [];

  return (
    <div className="animate-slide-up space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Dashboard
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {hasLiveResults ? 'Real-time search analytics' : 'Search YouTube to populate dashboard'}
          </p>
        </div>
        <span className={`clay-tag-red flex items-center gap-1.5 ${hasLiveResults ? '' : 'opacity-50'}`}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: hasLiveResults ? 'var(--yt-red)' : 'var(--text-tertiary)',
              display: 'inline-block',
              animation: hasLiveResults ? 'pulseRed 2s infinite' : 'none',
            }}
          />
          {hasLiveResults ? 'Live' : 'Idle'}
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
              Trending Videos
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            {hasLiveResults ? 'Top 5 by views' : 'Search to see trends'}
          </span>
        </div>

        {!hasLiveResults ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <AlertCircle size={24} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem', margin: 0 }}>No data yet</p>
            <p style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.7 }}>Search YouTube to see trending videos</p>
          </div>
        ) : (
          <div>
            {trendingDataSource.map((niche, i) => (
              <div
                key={niche.name}
                onClick={() => niche.rawVideo && selectVideo(niche.rawVideo)}
                style={{
                  padding: '13px 20px',
                  borderBottom: i < trendingDataSource.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {niche.subs}
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'New Search', icon: Zap, color: 'var(--yt-red)' },
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
