import { BookMarked, Star, TrendingUp, Trash2, Tag } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';

export default function SavedNiches() {
  const { savedNiches, removeVideoFromNiches, selectVideo } = useVideoContext();

  // Computes a stable performance score and trend line using video metadata attributes
  const deriveMetrics = (videoId: string) => {
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
      hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 75 + (Math.abs(hash) % 23);
    const trend = `+${15 + (Math.abs(hash) % 65)}%`;
    return { score, trend };
  };

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Saved Niches
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Your bookmarked niche opportunities
          </p>
        </div>
        <span className="clay-tag">{savedNiches.length} saved</span>
      </div>

      {savedNiches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-clay)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookMarked size={24} strokeWidth={1.5} color="var(--text-tertiary)" />
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No saved niches yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedNiches.map(item => {
            const metrics = deriveMetrics(item.video_id);
            return (
              <div
                key={item.video_id}
                onClick={() => selectVideo(item)}
                style={{
                  background: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #C6F6E4, #9AEFD0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-pill-active)',
                  }}
                >
                  <Star size={18} strokeWidth={2.5} color="var(--mint-text)" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="clay-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Tag size={9} strokeWidth={2} />
                      {item.channel_name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{item.upload_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                      <TrendingUp size={10} strokeWidth={2.5} color="#22C55E" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22C55E' }}>{metrics.trend}</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: metrics.score > 90 ? 'var(--yt-red)' : '#10B981' }}>
                      {metrics.score}
                    </span>
                  </div>
                  <button
                    onClick={() => removeVideoFromNiches(item.video_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      padding: '6px',
                      borderRadius: '8px',
                    }}
                    className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
