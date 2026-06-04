import { Zap, Youtube, Eye, ExternalLink, Star, Loader2 } from 'lucide-react';
import { type ExtractedVideo } from './youtubeScraper';

interface CompetitorScoutProps {
  videos: ExtractedVideo[];
  isLoading?: boolean;
  onSelectVideo?: (video: ExtractedVideo) => void;
}

function ThreatBadge({ views }: { views: string }) {
  const num = parseInt(views?.replace(/[^0-9]/g, '') || '0');
  let level: string;
  let styles: { bg: string; color: string };

  if (num > 1000000) {
    level = 'High';
    styles = { bg: 'rgba(255,0,0,0.1)', color: 'var(--yt-red)' };
  } else if (num > 500000) {
    level = 'Medium';
    styles = { bg: 'rgba(245,158,11,0.1)', color: '#B45309' };
  } else {
    level = 'Low';
    styles = { bg: 'rgba(34,197,94,0.1)', color: '#15803D' };
  }

  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: styles.bg, color: styles.color, borderRadius: '999px', padding: '2px 8px', border: `1px solid ${styles.color}30` }}>
      {level} Views
    </span>
  );
}

export default function CompetitorScout({ videos, isLoading, onSelectVideo }: CompetitorScoutProps) {
  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Search Results
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isLoading ? 'Searching YouTube...' : videos.length > 0 ? `${videos.length} videos found` : 'Enter a search term to find videos'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px', color: 'var(--text-secondary)' }}>
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontSize: '0.85rem' }}>Fetching videos...</span>
        </div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,51,51,0.1), rgba(204,0,0,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Youtube size={24} strokeWidth={1.5} style={{ opacity: 0.5 }} />
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>No videos found</p>
          <p style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.6 }}>Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.video_id}
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
              onClick={() => onSelectVideo?.(video)}
            >
              <div className="flex items-start gap-3">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    style={{
                      width: '120px',
                      height: '68px',
                      borderRadius: '10px',
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
                      width: '120px',
                      height: '68px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)' }} />
                    <Youtube size={20} color="#FFFFFF" strokeWidth={2} style={{ position: 'relative' }} />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                      {video.title}
                    </span>
                    <ThreatBadge views={video.view_count} />
                    <button
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, marginLeft: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.youtube.com/watch?v=${video.video_id}`, '_blank');
                      }}
                    >
                      <ExternalLink size={13} strokeWidth={2} />
                    </button>
                  </div>

                  <span className="clay-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                    <Zap size={9} strokeWidth={2.5} />
                    {video.channel_name}
                  </span>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Eye size={11} strokeWidth={2} color="var(--text-tertiary)" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{video.view_count}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={11} strokeWidth={2} color="var(--text-tertiary)" />
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{video.duration}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                      {video.upload_date}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
