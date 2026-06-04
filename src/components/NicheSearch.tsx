import { useState, useCallback, useRef, useMemo } from 'react';
import { Search, Loader2, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { type ExtractedVideo, searchYouTubeVideos } from '../services/youtubeScraper';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { VideoCard } from './VideoCard';
import { useVideoContext } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';

// Helper: Convert relative date strings like "2y ago", "1mo ago", "5d ago" to days
function parseDaysAgo(relativeTime: string): number {
  if (!relativeTime) return Infinity;
  const match = relativeTime.match(/(\d+)\s*(d|day|mo|month|y|year)s?\s*ago/i);
  if (!match) return 0;
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'd' || unit === 'day') return value;
  if (unit === 'mo' || unit === 'month') return value * 30;
  if (unit === 'y' || unit === 'year') return value * 365;
  return 0;
}

interface SearchState {
  query: string;
  rawVideos: ExtractedVideo[];        // original order from scraper
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  continuation: string | null;
  hasSearched: boolean;
}

type SortMethod = 'velocity' | 'total';
type AgeFilter = 30 | 60 | 90 | 365 | 9999;

export default function NicheSearch(): React.ReactElement {
  const { selectedVideo, setSearchedVideos } = useVideoContext();
  const { isDark } = useTheme();
  const [state, setState] = useState<SearchState>({
    query: '',
    rawVideos: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    continuation: null,
    hasSearched: false,
  });

  const [sortMethod, setSortMethod] = useState<SortMethod>('velocity');
  const [maxAgeDays, setMaxAgeDays] = useState<AgeFilter>(90);

  const loadMoreCountRef = useRef<number>(0);

  // Process raw videos: calculate days since upload, views per day, filter by age, sort
  const processedVideos = useMemo(() => {
    if (!state.hasSearched) return [];

    // First map to enriched objects
    const enriched = state.rawVideos.map(video => {
      const daysSinceUpload = parseDaysAgo(video.uploadedDate);
      const viewsPerDay = daysSinceUpload > 0 && daysSinceUpload !== Infinity
        ? video.viewCount / daysSinceUpload
        : video.viewCount; // fallback: treat as 1 day? Actually if no date, keep high velocity
      return { ...video, daysSinceUpload, viewsPerDay };
    });

    // Filter by max age
    const filtered = enriched.filter(video => video.daysSinceUpload <= maxAgeDays);

    // Sort
    const sorted = filtered.sort((a, b) => {
      if (sortMethod === 'velocity') {
        return b.viewsPerDay - a.viewsPerDay;
      } else {
        return b.viewCount - a.viewCount;
      }
    });

    return sorted;
  }, [state.rawVideos, state.hasSearched, sortMethod, maxAgeDays]);

  // Also update the context with filtered+sorted videos for parent components
  const updateContextVideos = useCallback((videos: ExtractedVideo[]) => {
    setSearchedVideos(videos);
  }, [setSearchedVideos]);

  // When processedVideos changes, update context (but avoid infinite loops)
  useMemo(() => {
    if (state.hasSearched) {
      updateContextVideos(processedVideos);
    }
  }, [processedVideos, state.hasSearched, updateContextVideos]);

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
            rawVideos: [],
          }));
          updateContextVideos([]);
          return;
        }

        setState(prev => {
          const totalRawVideos = isInitialSearch ? parsedVideos : [...prev.rawVideos, ...parsedVideos];
          return {
            ...prev,
            rawVideos: totalRawVideos,
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
    [updateContextVideos]
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

      {/* Sorting & Filtering Controls */}
      {state.hasSearched && state.rawVideos.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-surface)',
              borderRadius: '40px',
              padding: '6px 12px',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <TrendingUp size={14} strokeWidth={2} color="var(--text-secondary)" />
            <select
              value={sortMethod}
              onChange={(e) => setSortMethod(e.target.value as SortMethod)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="velocity">🔥 Most Views per Day (Velocity)</option>
              <option value="total">📊 Most Total Views</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-surface)',
              borderRadius: '40px',
              padding: '6px 12px',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <Calendar size={14} strokeWidth={2} color="var(--text-secondary)" />
            <select
              value={maxAgeDays}
              onChange={(e) => setMaxAgeDays(Number(e.target.value) as AgeFilter)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={30}>Last 30 days only</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
              <option value={9999}>All time</option>
            </select>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
            {processedVideos.length} video{processedVideos.length !== 1 ? 's' : ''} shown
            {state.rawVideos.length !== processedVideos.length && ` (${state.rawVideos.length - processedVideos.length} filtered out)`}
          </div>
        </div>
      )}

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

        {state.hasSearched && processedVideos.length === 0 && !state.isLoading && (
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
              {state.rawVideos.length > 0
                ? `No videos within ${maxAgeDays === 9999 ? 'all time' : `last ${maxAgeDays} days`}. Try increasing age filter.`
                : 'No results found'}
            </p>
          </div>
        )}

        {processedVideos.map(video => (
          <VideoCard
            key={video.video_id}
            video={video}
            isSelected={selectedVideo?.video_id === video.video_id}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {state.hasSearched && state.rawVideos.length > 0 && state.continuation && (
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
        {state.hasSearched && state.rawVideos.length > 0 && !state.continuation && (
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
