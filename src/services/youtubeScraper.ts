import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { type ExtractedVideo, searchYouTubeVideos } from '../services/youtubeScraper';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { VideoCard } from './VideoCard';
import { useVideoContext } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';

// ----- FILTER CONSTANTS -----
const MIN_VIEWS = 500000;
const MAX_AGE_DAYS = 15;

// Parse view count from strings like "2.5M", "58,008,646", "890K"
function parseViewCount(raw: any): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return 0;
  let cleaned = raw.replace(/,/g, '');
  const match = cleaned.match(/^([\d.]+)\s*([km])?$/i);
  if (match) {
    let num = parseFloat(match[1]);
    const suffix = match[2]?.toLowerCase();
    if (suffix === 'k') num *= 1000;
    if (suffix === 'm') num *= 1000000;
    return Math.floor(num);
  }
  return parseInt(cleaned, 10) || 0;
}

// Parse relative date strings like "5d ago", "2 weeks ago", "1mo ago", "1y ago"
function parseDaysAgo(dateStr: string): number {
  if (!dateStr) return 999;
  const str = dateStr.toLowerCase();
  // Try to extract number and unit (d, w, m, y)
  const match = str.match(/(\d+)\s*([dwmy])/);
  if (match) {
    const val = parseInt(match[1]);
    const unit = match[2];
    if (unit === 'd') return val;
    if (unit === 'w') return val * 7;
    if (unit === 'm') return val * 30;
    if (unit === 'y') return val * 365;
  }
  // Try absolute date (ISO, etc.)
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 999;
}
// ----- END OF FILTER CONSTANTS -----

interface SearchState {
  query: string;
  videos: ExtractedVideo[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  continuation: string | null;
  hasSearched: boolean;
}

export default function NicheSearch(): React.ReactElement {
  const { selectedVideo, setSearchedVideos } = useVideoContext();
  const { isDark } = useTheme();
  const [state, setState] = useState<SearchState>({
    query: '',
    videos: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    continuation: null,
    hasSearched: false,
  });

  const loadMoreCountRef = useRef<number>(0);

  // Filter videos using the correct field names (view_count, upload_date)
  const filteredVideos = useMemo(() => {
    if (!state.hasSearched) return [];
    return state.videos.filter(video => {
      const viewCount = parseViewCount(video.view_count);
      if (viewCount < MIN_VIEWS) return false;
      const days = parseDaysAgo(video.upload_date);
      return days <= MAX_AGE_DAYS;
    });
  }, [state.videos, state.hasSearched]);

  // ----- DEBUG: Log raw data and filter results -----
  useEffect(() => {
    if (state.videos.length > 0) {
      console.log('=== Niche Radar Debug ===');
      console.log('Raw videos count:', state.videos.length);
      const sample = state.videos[0];
      console.log('First video sample:', {
        title: sample.title,
        view_count: sample.view_count,
        upload_date: sample.upload_date,
        type_of_view_count: typeof sample.view_count,
      });
      console.log('Filtered videos count:', filteredVideos.length);
      if (filteredVideos.length === 0 && state.videos.length > 0) {
        console.log('⚠️ All videos were filtered out. Check view_count and upload_date formats above.');
      }
    }
  }, [state.videos, filteredVideos]);
  // ----- END DEBUG -----

  const performSearch = useCallback(
    async (query: string, continuation: string | null = null): Promise<void> => {
      const isInitialSearch = !continuation;

      setState(prev => ({
        ...prev,
        ...(isInitialSearch && { isLoading: true, error: null }),
        ...(!isInitialSearch && { isLoadingMore: true }),
      }));

      try {
        const result = await searchYouTubeVideos(query, continuation);
        const parsedVideos = result.videos;

        if (parsedVideos.length === 0 && isInitialSearch) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            hasSearched: true,
            error: 'No videos found. Try a different search term.',
            videos: [],
          }));
          setSearchedVideos([]);
          return;
        }

        setState(prev => {
          const totalVideos = isInitialSearch ? parsedVideos : [...prev.videos, ...parsedVideos];
          
          setTimeout(() => setSearchedVideos(totalVideos), 0);

          return {
            ...prev,
            videos: totalVideos,
            continuation: result.continuation,
            isLoading: false,
            isLoadingMore: false,
            hasSearched: true,
            query: query,
          };
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed. Please try again.';

        setState(prev => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: errorMessage,
          hasSearched: true,
        }));
      }
    },
    [setSearchedVideos]
  );

  const handleSearch = useCallback((): void => {
    const trimmedQuery = state.query.trim();
    if (!trimmedQuery) return;

    loadMoreCountRef.current = 0;
    performSearch(trimmedQuery, null);
  }, [state.query, performSearch]);

  const handleLoadMore = useCallback((): void => {
    if (state.isLoadingMore || !state.continuation || state.isLoading || loadMoreCountRef.current > 0) {
      return;
    }

    loadMoreCountRef.current += 1;

    performSearch(state.query, state.continuation);
  }, [state.isLoadingMore, state.continuation, state.isLoading, state.query, performSearch]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    threshold: 0.1,
    rootMargin: '200px',
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setState(prev => ({ ...prev, query: e.target.value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          Video Search
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Search YouTube and analyze video trends
        </p>
      </div>

      {/* Search Bar */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '24px',
          boxShadow: isDark
            ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.5)'
            : 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 16px rgba(0,0,0,0.04)',
          border: 'none',
          padding: '8px 12px 8px 8px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />

        <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search
              size={15}
              strokeWidth={2.5}
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
                zIndex: 2,
              }}
            />
            <input
              className="clay-input"
              type="text"
              value={state.query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Search videos, channels, topics…"
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '12px',
                paddingTop: '12px',
                paddingBottom: '12px',
                fontSize: '0.875rem',
                border: 'none',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="clay-btn-red flex items-center justify-center gap-2"
            disabled={!state.query.trim() || state.isLoading}
            style={{
              opacity: !state.query.trim() ? 0.5 : 1,
              cursor: !state.query.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              height: '44px',
              paddingLeft: '20px',
              paddingRight: '20px',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {state.isLoading && (
              <Loader2
                size={14}
                strokeWidth={2.5}
                style={{ animation: 'spin 0.7s linear infinite' }}
              />
            )}
            <span>{state.isLoading ? 'Searching…' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {state.error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <AlertCircle
            size={14}
            strokeWidth={2.5}
            color="#DC2626"
            style={{ flexShrink: 0, marginTop: '1px' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>
            {state.error}
          </p>
        </div>
      )}

      {/* Results List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingBottom: '8px',
        }}
      >
        {!state.hasSearched && !state.isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '12px',
              paddingBottom: '40px',
            }}
          >
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
              <Search size={24} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                Start searching to discover videos
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', margin: 0 }}>
                Enter keywords, topics, or channel names
              </p>
            </div>
          </div>
        )}

        {/* Empty state when filter removes all videos */}
        {state.hasSearched && filteredVideos.length === 0 && !state.isLoading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '12px',
              paddingBottom: '40px',
            }}
          >
            <AlertCircle size={32} strokeWidth={1.5} color="var(--text-tertiary)" />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {state.videos.length > 0
                ? `No videos with ≥${MIN_VIEWS.toLocaleString()} views in the last ${MAX_AGE_DAYS} days.`
                : 'No results found'}
            </p>
          </div>
        )}

        {/* Render filtered videos */}
        {filteredVideos.map(video => (
          <VideoCard
            key={video.video_id}
            video={video}
            isSelected={selectedVideo?.video_id === video.video_id}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {state.hasSearched && state.videos.length > 0 && state.continuation && (
          <div ref={sentinelRef} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {state.isLoadingMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2
                  size={14}
                  strokeWidth={2.5}
                  color="var(--yt-red)"
                  style={{ animation: 'spin 0.7s linear infinite' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  Loading more…
                </span>
              </div>
            )}
          </div>
        )}

        {/* End of results indicator */}
        {state.hasSearched && state.videos.length > 0 && !state.continuation && (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '20px',
              paddingBottom: '40px',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              No more results
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
