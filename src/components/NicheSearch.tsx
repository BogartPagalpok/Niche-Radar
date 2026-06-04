import { useState, useCallback, useRef, useMemo } from 'react';
import { Search, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { type ExtractedVideo, searchYouTubeVideos } from '../services/youtubeScraper';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { VideoCard } from './VideoCard';
import { useVideoContext } from '../context/VideoContext';
import { useTheme } from '../context/ThemeContext';

// Minimum views required to be considered viral – no flops
const MIN_VIEWS = 500000; // 500k

// Convert YouTube date string to days ago
function getDaysAgo(uploadedDate: string): number {
  if (!uploadedDate) return 999;

  const str = uploadedDate.toLowerCase();

  // "X days ago", "X day ago", "Xd"
  let match = str.match(/(\d+)\s*d(?:ay)?s?\s*ago/);
  if (match) return parseInt(match[1]);

  // "X weeks ago"
  match = str.match(/(\d+)\s*w(?:ee)?k?s?\s*ago/);
  if (match) return parseInt(match[1]) * 7;

  // "X months ago"
  match = str.match(/(\d+)\s*mo(?:nth)?s?\s*ago/);
  if (match) return parseInt(match[1]) * 30;

  // "X years ago"
  match = str.match(/(\d+)\s*y(?:ear)?s?\s*ago/);
  if (match) return parseInt(match[1]) * 365;

  // Absolute date
  const date = new Date(uploadedDate);
  if (!isNaN(date.getTime())) {
    const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  }

  return 999;
}

interface SearchState {
  query: string;
  rawVideos: ExtractedVideo[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  continuation: string | null;
  hasSearched: boolean;
}

type SortMethod = 'velocity' | 'total';

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

  const [sortMethod, setSortMethod] = useState<SortMethod>('velocity'); // default: velocity (highest views/day first)
  const loadMoreCountRef = useRef<number>(0);

  // Process videos: filter to last 15 days, minimum 500k views, then enrich & sort
  const processedVideos = useMemo(() => {
    if (!state.hasSearched) return [];

    const MAX_AGE_DAYS = 15;

    const enriched = state.rawVideos
      .map(video => {
        // 1. Exclude low-view flops (<500k)
        if (video.viewCount < MIN_VIEWS) return null;

        // 2. Check age (<=15 days)
        const daysSinceUpload = getDaysAgo(video.uploadedDate);
        if (daysSinceUpload > MAX_AGE_DAYS) return null;

        // 3. Calculate views per day (velocity)
        const viewsPerDay = daysSinceUpload > 0 ? video.viewCount / daysSinceUpload : video.viewCount;
        return { ...video, daysSinceUpload, viewsPerDay };
      })
      .filter((v): v is ExtractedVideo & { daysSinceUpload: number; viewsPerDay: number } => v !== null);

    // Sort: velocity = highest views/day first; total = highest total views first
    const sorted = enriched.sort((a, b) => {
      if (sortMethod === 'velocity') return b.viewsPerDay - a.viewsPerDay;
      return b.viewCount - a.viewCount;
    });

    return sorted;
  }, [state.rawVideos, state.hasSearched, sortMethod]);

  const updateContextVideos = useCallback((videos: ExtractedVideo[]) => {
    setSearchedVideos(videos);
  }, [setSearchedVideos]);

  useMemo(() => {
    if (state.hasSearched) updateContextVideos(processedVideos);
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
            query,
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
    if (state.isLoadingMore || !state.continuation || state.isLoading || loadMoreCountRef.current > 0) return;
    loadMoreCountRef.current += 1;
    performSearch(state.query, state.continuation);
  }, [state.isLoadingMore, state.continuation, state.isLoading, state.query, performSearch]);

  const sentinelRef = useInfiniteScroll(handleLoadMore, { threshold: 0.1, rootMargin: '200px' });
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch();
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => setState(prev => ({ ...prev, query: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Video Search
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Search YouTube and analyze video trends (last 15 days, min {MIN_VIEWS.toLocaleString()} views)
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        background: 'var(--bg-panel)',
        borderRadius: '24px',
        boxShadow: isDark ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.5)' : 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 16px rgba(0,0,0,0.04)',
        border: 'none',
        padding: '8px 12px 8px 8px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
        <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={15} strokeWidth={2.5} style={{ position: 'absolute', left: '14px', color: 'var(--text-tertiary)', zIndex: 2 }} />
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
            {state.isLoading && <Loader2 size={14} strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }} />}
            <span>{state.isLoading ? 'Searching…' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Sort Controls (only velocity/total) */}
      {state.hasSearched && state.rawVideos.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            borderRadius: '40px',
            padding: '6px 12px',
            boxShadow: 'var(--shadow-clay-sm)',
          }}>
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
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
            {processedVideos.length} winner{processedVideos.length !== 1 ? 's' : ''} shown (last 15 days, ≥{MIN_VIEWS.toLocaleString()} views)
            {state.rawVideos.length !== processedVideos.length && ` (${state.rawVideos.length - processedVideos.length} flops hidden)`}
          </div>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
        }}>
          <AlertCircle size={14} strokeWidth={2.5} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontSize: '0.75rem', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>{state.error}</p>
        </div>
      )}

      {/* Results List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '8px' }}>
        {!state.hasSearched && !state.isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', paddingBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-clay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={24} strokeWidth={1.5} color="var(--text-tertiary)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>Start searching to discover viral videos</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', margin: 0 }}>Enter keywords, topics, or channel names</p>
            </div>
          </div>
        )}

        {state.hasSearched && processedVideos.length === 0 && !state.isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', paddingBottom: '40px' }}>
            <AlertCircle size={32} strokeWidth={1.5} color="var(--text-tertiary)" />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {state.rawVideos.length > 0
                ? `No viral videos found (last 15 days, ≥${MIN_VIEWS.toLocaleString()} views). Try a different search term.`
                : 'No results found'}
            </p>
          </div>
        )}

        {processedVideos.map(video => (
          <VideoCard key={video.video_id} video={video} isSelected={selectedVideo?.video_id === video.video_id} />
        ))}

        {state.hasSearched && state.rawVideos.length > 0 && state.continuation && (
          <div ref={sentinelRef} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {state.isLoadingMore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={14} strokeWidth={2.5} color="var(--yt-red)" style={{ animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Loading more…</span>
              </div>
            )}
          </div>
        )}

        {state.hasSearched && state.rawVideos.length > 0 && !state.continuation && (
          <div style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '40px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>No more results</span>
          </div>
        )}
      </div>
    </div>
  );
}
