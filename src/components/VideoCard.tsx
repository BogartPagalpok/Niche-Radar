import { Clock, Eye, User } from 'lucide-react';
import { type ExtractedVideo } from '../services/youtubeScraper';
import { useVideoContext } from '../context/VideoContext';

interface VideoCardProps {
  video: ExtractedVideo;
  isSelected: boolean;
}

export function VideoCard({ video, isSelected }: VideoCardProps): React.ReactElement {
  const { selectVideo } = useVideoContext();

  const handleCardClick = (): void => {
    selectVideo(video);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isSelected ? 'var(--shadow-clay-lg)' : 'var(--shadow-clay)',
        border: isSelected ? '1px solid var(--yt-red-muted)' : '1px solid var(--border-subtle)',
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        gap: '12px',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(0.98)' : 'scale(1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        if (!isSelected) {
          el.style.boxShadow = 'var(--shadow-clay-lg)';
          el.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        if (!isSelected) {
          el.style.boxShadow = 'var(--shadow-clay)';
          el.style.transform = 'translateY(0)';
        }
      }}
      onMouseDown={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(0.98)';
      }}
      onMouseUp={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = isSelected ? 'scale(0.98)' : 'scale(1)';
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: '88px',
          height: '88px',
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-clay-sm)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            {/* Duration overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                backdropFilter: 'blur(4px)',
              }}
            >
              {video.duration}
            </div>
          </>
        ) : (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF3333, #CC0000)',
              boxShadow: 'var(--shadow-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '8px', height: '8px', background: '#FFFFFF', borderRadius: '1px' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {/* Title */}
        <h3
          style={{
            margin: 0,
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {video.title}
        </h3>

        {/* Channel name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          <User size={10} strokeWidth={2.5} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {video.channel_name}
          </span>
        </div>

        {/* Metadata row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.68rem',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Eye size={9} strokeWidth={2.5} />
            <span>{video.view_count}</span>
          </div>
          <span style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={9} strokeWidth={2.5} />
            <span>{video.upload_date}</span>
          </div>
        </div>

        {/* Description snippet */}
        {video.description && (
          <p
            style={{
              margin: 0,
              fontSize: '0.68rem',
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {video.description}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #C6F6E4, #9AEFD0)',
            boxShadow: 'var(--shadow-pill-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--mint-text)" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 6 4 9 11 2" />
          </svg>
        </div>
      )}
    </div>
  );
}
