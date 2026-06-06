import { useState, useCallback, useRef } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { type ExtractedVideo, searchYouTubeVideos } from '../services/youtubeScraper';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { VideoCard } from './VideoCard';
import { useVideoContext } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';
import { expandQuery } from '../services/aiQueryExpander';
import { processVideoResults } from '../services/rankingEngine';

// Filter options shown as chips in the UI.
const VIEW_OPTIONS = [
  { label: 'Any views', value: 0 },
  { label: '10K+', value: 10_000 },
  { label: '100K+', value: 100_000 },
  { label: '1M+', value: 1_000_000 },
];
const DATE_OPTIONS = [
  { label: 'Any time', value: 0 },
  { label: 'This week', value: 7 },
  { label: 'This month', value: 30 },
  { label: 'This year', value: 365 },
];

interface SearchState {
  query: string;
  videos: ExtractedVideo[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  continuation: string | null;
  hasSearched: boolean;
  searchTarget: string; // Added to handle infinite scroll pagination safely
  minViews: number;
  withinDays: number;
  rawVideos: ExtractedVideo[]; // unfiltered accumulated results, for re-filtering
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
    searchTarget: '',
    minViews: 0,
    withinDays: 0,
    rawVideos: [],
  });

  const loadMoreCountRef = useRef<number>(0);

  const performSearch = useCallback(
    async (targetQuery: string, seedQuery: string, continuation: string | null = null): Promise<void> => {
      const isInitialSearch = !continuation;

      setState(prev => ({
        ...prev,
        ...(isInitialSearch && { isLoading: true, error: null }),
        ...(!isInitialSearch && { isLoadingMore: true }),
      }));

      try {
        const result = await searchYouTubeVideos(targetQuery, continuation);
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
          // We accumulate the RAW scraped videos, then re-rank/filter the whole
          // set each time so filters apply consistently across pages.
          const rawAccumulated = isInitialSearch
            ? parsedVideos
            : [...(prev.rawVideos ?? prev.videos), ...parsedVideos];

          // Apply the ranking engine + the user's view/recency filters
          const rankedVideos = processVideoResults(
            seedQuery,
            [targetQuery],
            [rawAccumulated],
            { minViews: prev.minViews, withinDays: prev.withinDays },
          );

          setTimeout(() => setSearchedVideos(rankedVideos), 0);

          return {
            ...prev,
            videos: rankedVideos,
            rawVideos: rawAccumulated,
            continuation: result.continuation,
            isLoading: false,
            isLoadingMore: false,
            hasSearched: true,
            query: seedQuery, // Keep the input box showing what the user typed
            searchTarget: targetQuery, // Save the AI keyword for infinite scroll
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

  const handleSearch = useCallback(async (): Promise<void> => {
    const trimmedQuery = state.query.trim();
    if (!trimmedQuery) return;

    setState(prev => ({ ...prev, isLoading: true }));
    loadMoreCountRef.current = 0;
    
    try {
      const expandedQuery = await expandQuery(trimmedQuery);
      console.log("Original Search:", trimmedQuery, "| Final Search:", expandedQuery);
      performSearch(expandedQuery, trimmedQuery, null);
    } catch (err) {
      console.error("Expansion failed, falling back:", err);
      performSearch(trimmedQuery, trimmedQuery, null);
    }
  }, [state.query, performSearch]);

  const handleLoadMore = useCallback((): void => {
    if (state.isLoadingMore || !state.continuation || state.isLoading || loadMoreCountRef.current > 0) {
      return;
    }

    loadMoreCountRef.current += 1;

    performSearch(state.searchTarget || state.query, state.query, state.continuation);
  }, [state.isLoadingMore, state.continuation, state.isLoading, state.query, state.searchTarget, performSearch]);

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

  // Re-apply filters instantly against already-fetched raw videos (no new fetch).
  const applyFilters = useCallback(
    (minViews: number, withinDays: number): void => {
      setState(prev => {
        const reranked = processVideoResults(
          prev.query,
          [prev.searchTarget || prev.query],
          [prev.rawVideos],
          { minViews, withinDays },
        );
        setTimeout(() => setSearchedVideos(reranked), 0);
        return { ...prev, minViews, withinDays, videos: reranked };
      });
    },
    [setSearchedVideos],
  );

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

      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '2px' }}>
          Views
        </span>
        {VIEW_OPTIONS.map(opt => {
          const active = state.minViews === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => applyFilters(opt.value, state.withinDays)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '5px 11px',
                borderRadius: '999px',
                border: active ? '1px solid var(--yt-red)' : '1px solid var(--border-subtle)',
                background: active ? 'var(--yt-red)' : 'var(--bg-surface)',
                color: active ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <span style={{ width: '8px' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '2px' }}>
          Date
        </span>
        {DATE_OPTIONS.map(opt => {
          const active = state.withinDays === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => applyFilters(state.minViews, opt.value)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '5px 11px',
                borderRadius: '999px',
                border: active ? '1px solid var(--yt-red)' : '1px solid var(--border-subtle)',
                background: active ? 'var(--yt-red)' : 'var(--bg-surface)',
                color: active ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
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

        {state.videos.map(video => (
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
