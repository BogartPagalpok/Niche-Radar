import { useState, useEffect } from 'react';
import { ExternalLink, Youtube, User, Calendar, Eye, Clock, Copy, CheckCircle2, BarChart3, FileText, Loader2 } from 'lucide-react';
import { type ExtractedVideo } from '../services/youtubeScraper';
import { AnalyticsPanel } from './AnalyticsPanel';
import { useTheme } from '../context/ThemeContext';
import { useVideoContext } from '../context/VideoContext';
import { type ActiveView } from './Sidebar';

interface VideoDetailViewProps {
  video: ExtractedVideo;
  onNavigate?: (view: ActiveView) => void; // Optional hook if passing layout handlers downward
}

type TabType = 'details' | 'analytics';

export function VideoDetailView({ video, onNavigate }: VideoDetailViewProps): React.ReactElement {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [channelStats, setChannelStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsFetched, setStatsFetched] = useState(false);
  const { isDark } = useTheme();
  const { savedNiches, saveVideoToNiches, removeVideoFromNiches } = useVideoContext();

  const isBookmarked = savedNiches.some(v => v.video_id === video.video_id);

  const handleCopy = (text: string, label: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveToggle = (): void => {
    if (isBookmarked) {
      removeVideoFromNiches(video.video_id);
    } else {
      saveVideoToNiches(video);
    }
  };

  const handleFetchStats = async (): Promise<void> => {
    if (!video?.channel_id || loadingStats) return;
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('niche-radar-google-token');
      if (!token) {
        setChannelStats({ subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A', country: 'N/A', error: 'Add Token in Settings' });
        setStatsFetched(true);
        setLoadingStats(false);
        return;
      }
      
      const cleanToken = token.replace(/^"|"$/g, '');

      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${video.channel_id}`, {
        headers: { 
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/json'
        }
      });
      
      const data = await res.json();
      if (data.items?.length) {
        const s = data.items[0].statistics;
        const sn = data.items[0].snippet;
        const f = (n: string) => { const x = parseInt(n); return x >= 1000000 ? (x/1000000).toFixed(1)+'M' : x >= 1000 ? (x/1000).toFixed(1)+'K' : n; };
        setChannelStats({ subscribers: f(s.subscriberCount), totalViews: f(s.viewCount), videoCount: f(s.videoCount), country: sn.country || 'N/A' });
      } else {
        setChannelStats({ subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A', country: 'N/A', error: data.error?.message || 'Not found' });
      }
    } catch {
      setChannelStats({ subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A', country: 'N/A', error: 'Failed' });
    }
    setStatsFetched(true);
    setLoadingStats(false);
  };

  useEffect(() => {
    if (video?.channel_id) {
      handleFetchStats();
    }
  }, [video?.channel_id]);

  const youtubeUrl = `https://www.youtube.com/watch?v=${video.video_id}`;
  const channelUrl = `https://www.youtube.com/channel/${video.channel_id}`;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Tab navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
        }}
      >
        {[
          { id: 'details' as TabType, label: 'Video Details', icon: FileText },
          { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--yt-red)' : '2px solid transparent',
                cursor: 'pointer',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? 'var(--yt-red)' : 'var(--text-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              <Icon size={14} strokeWidth={2.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-5">
          {/* Thumbnail */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '24px',
              overflow: 'hidden',
              background: 'var(--bg-surface)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 12px 30px rgba(0,0,0,0.6)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 12px 24px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {video.thumbnail_url ? (
              <>
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.85)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={12} strokeWidth={2.5} />
                  {video.duration}
                </div>
              </>
            ) : (
              <Youtube size={48} strokeWidth={1.5} color="var(--yt-red)" />
            )}
          </div>

          {/* Video title */}
          <h1
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            {video.title}
          </h1>

          {/* Channel info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                boxShadow: 'var(--shadow-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} strokeWidth={2} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {video.channel_name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '2px',
                }}
              >
                {video.channel_id}
              </p>
            </div>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="clay-btn-secondary"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
            >
              <ExternalLink size={12} strokeWidth={2} />
              Visit
            </a>
          </div>

          {/* Metadata grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}
          >
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Eye size={13} strokeWidth={2.5} color="var(--yt-red)" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Views
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {video.view_count}
              </p>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Calendar size={13} strokeWidth={2.5} color="#3B82F6" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Uploaded
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {video.upload_date}
              </p>
            </div>
          </div>

          {/* Channel Stats Button / Card */}
          <div>
            {!statsFetched ? (
              <div
                className="clay-btn-secondary flex items-center gap-2 px-4 py-3"
                style={{ fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
              >
                <Loader2 size={14} className="animate-spin" />
                Loading Channel Stats...
              </div>
            ) : channelStats && !channelStats.error ? (
              <div className="stat-card">
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '12px', textTransform: 'uppercase' }}>
                  Channel Stats
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>Subscribers</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{channelStats.subscribers}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>Total Views</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{channelStats.totalViews}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>Videos</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{channelStats.videoCount}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>Country</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{channelStats.country}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="stat-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ fontSize: '0.75rem', color: '#EF4444', textAlign: 'center', margin: 0, fontWeight: 600 }}>
                  {channelStats?.error || 'Could not load stats'}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div>
              <h2
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                }}
              >
                Description
              </h2>
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay-sm)',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  maxHeight: '150px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {video.description}
              </div>
            </div>
          )}

          {/* Video ID and sharing */}
          <div>
            <h2
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                marginBottom: '10px',
                textTransform: 'uppercase',
              }}
            >
              Video Details
            </h2>

            <div className="space-y-2">
              {/* Video ID */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Video ID
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontWeight: 600,
                      marginTop: '2px',
                    }}
                  >
                    {video.video_id}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(video.video_id, 'videoId')}
                  className="clay-btn-secondary"
                  style={{ padding: '6px 10px', flexShrink: 0 }}
                  title="Copy video ID"
                >
                  {copied === 'videoId' ? (
                    <CheckCircle2 size={12} strokeWidth={2.5} color="#22C55E" />
                  ) : (
                    <Copy size={12} strokeWidth={2} />
                  )}
                </button>
              </div>

              {/* YouTube URL */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    YouTube Link
                  </p>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      margin: 0,
                      fontSize: '0.78rem',
                      color: 'var(--yt-red)',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      marginTop: '2px',
                      textDecoration: 'none',
                    }}
                  >
                    {youtubeUrl}
                  </a>
                </div>
                <button
                  onClick={() => handleCopy(youtubeUrl, 'link')}
                  className="clay-btn-secondary"
                  style={{ padding: '6px 10px', flexShrink: 0 }}
                  title="Copy link"
                >
                  {copied === 'link' ? (
                    <CheckCircle2 size={12} strokeWidth={2.5} color="#22C55E" />
                  ) : (
                    <Copy size={12} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px' }}>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="clay-btn-red flex items-center justify-center gap-2 px-4 py-3"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <Youtube size={14} strokeWidth={2.5} />
              Watch on YouTube
            </a>
            <button 
              onClick={handleSaveToggle}
              className="clay-btn-secondary flex items-center justify-center gap-2 px-4 py-3 flex-1"
            >
              <CheckCircle2 size={14} strokeWidth={2.5} color={isBookmarked ? "#22C55E" : "currentColor"} />
              <span>{isBookmarked ? 'Saved' : 'Save Video'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          <AnalyticsPanel video={video} />
        </div>
      )}
    </div>
  );
}
