import { Zap, Youtube, Eye, ExternalLink, Loader2, Users, BarChart3 } from 'lucide-react';
import { type ExtractedVideo } from '../services/youtubeScraper';

interface CompetitorScoutProps {
  videos: ExtractedVideo[];
  isLoading?: boolean;
  onSelectVideo?: (video: ExtractedVideo) => void;
}

function PerformanceBadge({ views }: { views: string }) {
  const num = parseInt(views?.replace(/[^0-9]/g, '') || '0');
  let level: string;
  let styles: { bg: string; color: string };

  if (num > 1000000) {
    level = 'Viral';
    styles = { bg: 'rgba(255,0,0,0.1)', color: 'var(--yt-red)' };
  } else if (num > 500000) {
    level = 'Trending';
    styles = { bg: 'rgba(245,158,11,0.1)', color: '#B45309' };
  } else {
    level = 'Growing';
    styles = { bg: 'rgba(34,197,94,0.1)', color: '#15803D' };
  }

  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: styles.bg, color: styles.color, borderRadius: '999px', padding: '2px 8px', border: `1px solid ${styles.color}30` }}>
      {level}
    </span>
  );
}

function formatViewCount(views: string): string {
  const num = parseInt(views?.replace(/[^0-9]/g, '') || '0');
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return views || '0';
}

export default function CompetitorScout({ videos, isLoading, onSelectVideo }: CompetitorScoutProps) {
  // THIS IS THE FIX - guard against undefined/null videos
  const safeVideos = Array.isArray(videos) ? videos : [];

  // Group videos by channel to show real competitor analysis
  const channelGroups = safeVideos.reduce((acc: Record<string, { videos: ExtractedVideo[]; totalViews: number }>, video) => {
    const key = video.channel_name || video.channel_id;
    if (!acc[key]) {
      acc[key] = { videos: [], totalViews: 0 };
    }
    acc[key].videos.push(video);
    acc[key].totalViews += parseInt(video.view_count?.replace(/[^0-9]/g, '') || '0');
    return acc;
  }, {});

  const channelEntries = Object.entries(channelGroups)
    .sort((a, b) => b[1].totalViews - a[1].totalViews)
    .slice(0, 8);

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Competitor Scout
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isLoading ? 'Analyzing channels...' : safeVideos.length > 0 ? `${channelEntries.length} channels found across ${safeVideos.length} videos` : 'Search to discover competing channels'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px', color: 'var(--text-secondary)' }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: '0.85rem' }}>Scouting competitors...</span>
        </div>
      ) : safeVideos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,51,51,0.1), rgba(204,0,0,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>No channels found</p>
          <p style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.6 }}>Search YouTube to find competing channels in your niche</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channelEntries.map(([channelName, data]) => {
            const topVideo = data.videos.sort((a, b) => 
              parseInt(b.view_count?.replace(/[^0-9]/g, '') || '0') - 
              parseInt(a.view_count?.replace(/[^0-9]/g, '') || '0')
            )[0];

            return (
              <div
                key={channelName}
                style={{
                  background: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 16px',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-clay-lg)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-clay)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
                onClick={() => onSelectVideo?.(topVideo)}
              >
                <div className="flex items-start gap-3">
                  {topVideo.thumbnail_url ? (
                    <img
                      src={topVideo.thumbnail_url}
                      alt={topVideo.title}
                      style={{
                        width: '100px',
                        height: '56px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        background: 'var(--bg-subtle)',
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100px',
                        height: '56px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Youtube size={18} color="#FFFFFF" strokeWidth={2} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                        {channelName}
                      </span>
                      <PerformanceBadge views={data.videos[0]?.view_count || '0'} />
                      <button
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, marginLeft: 'auto' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://www.youtube.com/@${encodeURIComponent(channelName.replace(/\s+/g, ''))}`, '_blank');
                        }}
                      >
                        <ExternalLink size={13} strokeWidth={2} />
                      </button>
                    </div>

                    <span className="clay-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                      <Zap size={9} strokeWidth={2.5} />
                      {data.videos.length} video{data.videos.length > 1 ? 's' : ''} in results
                    </span>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Eye size={11} strokeWidth={2} color="var(--text-tertiary)" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {formatViewCount(data.totalViews.toString())}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>total views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 size={11} strokeWidth={2} color="var(--text-tertiary)" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {formatViewCount(topVideo.view_count)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>top video</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
