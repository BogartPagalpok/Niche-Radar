import { TrendingUp, ArrowUpRight, BarChart3, Calendar, AlertCircle } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import { useMemo } from 'react';

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
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

function parseViewCount(viewStr: string): number {
  const normalized = viewStr?.toUpperCase()?.trim() || '0';
  if (normalized.includes('M')) return parseFloat(normalized.replace('M', '')) * 1000000;
  if (normalized.includes('K')) return parseFloat(normalized.replace('K', '')) * 1000;
  return parseFloat(normalized.replace(/[^0-9.]/g, '')) || 0;
}

function parseDaysAgo(dateStr: string): number {
  const lower = dateStr?.toLowerCase() || '';
  const num = parseFloat(lower.match(/\d+/)?.[0] || '1');
  if (lower.includes('hour') || lower.includes('min') || lower.includes('now')) return 0.1;
  if (lower.includes('day')) return num;
  if (lower.includes('week')) return num * 7;
  if (lower.includes('month')) return num * 30;
  if (lower.includes('year')) return num * 365;
  return 1;
}

function formatViewLabel(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
  return views.toString();
}

export default function TrendAnalysis() {
  const { searchedVideos, selectVideo } = useVideoContext();
  const colors = ['#FF0000', '#3B82F6', '#10B981', '#F59E0B'];

  const trends = useMemo(() => {
    if (!searchedVideos || searchedVideos.length === 0) return [];

    // Group by recency buckets to create real trend lines
    const now = Date.now();
    const buckets: Record<string, { views: number; count: number; videos: ExtractedVideo[] }> = {
      'Now': { views: 0, count: 0, videos: [] },
      '1d': { views: 0, count: 0, videos: [] },
      '2d': { views: 0, count: 0, videos: [] },
      '3d': { views: 0, count: 0, videos: [] },
      '5d': { views: 0, count: 0, videos: [] },
      '1w': { views: 0, count: 0, videos: [] },
      '2w+': { views: 0, count: 0, videos: [] },
    };

    searchedVideos.forEach(video => {
      const daysAgo = parseDaysAgo(video.upload_date);
      const views = parseViewCount(video.view_count);
      
      let bucket: string;
      if (daysAgo < 0.5) bucket = 'Now';
      else if (daysAgo <= 1) bucket = '1d';
      else if (daysAgo <= 2) bucket = '2d';
      else if (daysAgo <= 3) bucket = '3d';
      else if (daysAgo <= 5) bucket = '5d';
      else if (daysAgo <= 7) bucket = '1w';
      else bucket = '2w+';

      buckets[bucket].views += views;
      buckets[bucket].count++;
      buckets[bucket].videos.push(video);
    });

    // Create trend data: channel with most videos as "niche"
    const channelGroups: Record<string, { views: number; count: number; bestVideo: ExtractedVideo }> = {};
    searchedVideos.forEach(video => {
      const key = video.channel_name;
      if (!channelGroups[key]) {
        channelGroups[key] = { views: 0, count: 0, bestVideo: video };
      }
      channelGroups[key].views += parseViewCount(video.view_count);
      channelGroups[key].count++;
      if (parseViewCount(video.view_count) > parseViewCount(channelGroups[key].bestVideo.view_count)) {
        channelGroups[key].bestVideo = video;
      }
    });

    // Map recency buckets to 7 data points for sparkline
    const bucketOrder = ['2w+', '1w', '5d', '3d', '2d', '1d', 'Now'];
    
    return Object.entries(channelGroups)
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 4)
      .map(([channel, data], index) => {
        // Create trend data: distribute views across recency buckets proportionally
        const dataPoints = bucketOrder.map(bucket => {
          const b = buckets[bucket];
          const channelVideos = b.videos.filter(v => v.channel_name === channel);
          if (channelVideos.length === 0) return 0;
          return channelVideos.reduce((sum, v) => sum + parseViewCount(v.view_count), 0);
        });

        // Fill zeros with interpolated values for smoother sparklines
        const filledData = dataPoints.map((val, i) => {
          if (val > 0) return val;
          // Find nearest non-zero values
          let prev = 0, next = 0;
          for (let j = i - 1; j >= 0; j--) {
            if (dataPoints[j] > 0) { prev = dataPoints[j]; break; }
          }
          for (let j = i + 1; j < dataPoints.length; j++) {
            if (dataPoints[j] > 0) { next = dataPoints[j]; break; }
          }
          return prev > 0 && next > 0 ? Math.round((prev + next) / 2) : prev || next || 1;
        });

        // Normalize to 0-100 scale for sparkline
        const max = Math.max(...filledData, 1);
        const normalized = filledData.map(v => Math.round((v / max) * 100));

        return {
          niche: channel,
          data: normalized,
          peak: formatViewLabel(data.views),
          subText: `${data.count} video${data.count > 1 ? 's' : ''}`,
          rawVideo: data.bestVideo,
          totalViews: data.views,
        };
      });
  }, [searchedVideos]);

  const hasLiveResults = trends.length > 0;

  const summaryMetrics = hasLiveResults
    ? {
        fastest: {
          value: trends[0]?.niche || '—',
          sub: `${formatViewLabel(trends[0]?.totalViews || 0)} views`,
        },
        consistent: {
          value: trends[1]?.niche || '—',
          sub: `${trends[1]?.count || 0} videos in results`,
        },
        bestEntry: {
          value: trends[2]?.niche || '—',
          sub: `Top: ${trends[2]?.rawVideo?.title?.slice(0, 25) || '—'}...`,
        },
      }
    : {
        fastest: { value: 'Search first', sub: 'No data yet' },
        consistent: { value: 'Search first', sub: 'No data yet' },
        bestEntry: { value: 'Search first', sub: 'No data yet' },
      };

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Trend Analysis
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {hasLiveResults ? `Real view distribution across ${trends.length} channels` : 'Search to discover trending channels'}
          </p>
        </div>
        <div className="flex items-center gap-1 clay-tag">
          <Calendar size={11} strokeWidth={2.5} />
          <span>{hasLiveResults ? 'Real search data' : 'No data'}</span>
        </div>
      </div>

      {!hasLiveResults ? (
        <div
          style={{
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '48px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertCircle size={32} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>No trend data available</p>
          <p style={{ fontSize: '0.72rem', marginTop: '6px', opacity: 0.7 }}>
            Search YouTube to see real channel trends
          </p>
        </div>
      ) : (
        <>
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
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Channel
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
                Recency Distribution
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'right' }}>
                Total
              </span>
            </div>

            {trends.map((item, i) => (
              <div
                key={i}
                onClick={() => item.rawVideo && selectVideo(item.rawVideo)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 60px',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: i < trends.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: item.rawVideo ? 'pointer' : 'default',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => item.rawVideo && ((e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)')}
                onMouseLeave={e => item.rawVideo && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                <div style={{ minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.niche}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpRight size={11} strokeWidth={3} color={colors[i % colors.length]} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subText}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <MiniSparkline data={item.data} color={colors[i % colors.length]} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: colors[i % colors.length], letterSpacing: '-0.02em' }}>
                    {item.peak}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Week labels */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 16px' }}>
            {WEEKS.map(w => (
              <span key={w} style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{w}</span>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: 'Top Channel', value: summaryMetrics.fastest.value, sub: summaryMetrics.fastest.sub, color: 'var(--yt-red)' },
              { icon: BarChart3, label: 'Most Videos', value: summaryMetrics.consistent.value, sub: summaryMetrics.consistent.sub, color: '#3B82F6' },
              { icon: ArrowUpRight, label: 'Rising', value: summaryMetrics.bestEntry.value, sub: summaryMetrics.bestEntry.sub, color: '#10B981' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="stat-card">
                  <Icon size={14} strokeWidth={2.5} color={item.color} style={{ marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: item.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
