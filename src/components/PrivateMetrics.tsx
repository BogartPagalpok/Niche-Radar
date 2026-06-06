import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, MousePointer2, AlertCircle, Loader2, WifiOff } from 'lucide-react';
import {
  fetchYouTubeMetrics,
  isMetricsError,
  estimateRevenueFromViews,
  parseViewCount,
  type YouTubeMetrics,
} from '../services/metricsService';
import { hasRequiredCredentials } from '../services/credentialsService';

interface PrivateMetricsProps {
  videoId: string;
  /** Public view-count string from the scraped video (e.g. "1.2M"). */
  viewCountText?: string;
}

interface MetricsState {
  metrics: YouTubeMetrics | null;
  isLoading: boolean;
  error: string | null;
}

export function PrivateMetrics({ videoId, viewCountText }: PrivateMetricsProps): React.ReactElement {
  const [state, setState] = useState<MetricsState>({
    metrics: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    setState({
      metrics: null,
      isLoading: false,
      error: null,
    });
  }, [videoId]);

  const handleFetchPrivateMetrics = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Always start from a view-based revenue ESTIMATE — works on any public
    // video, no credentials required. This guarantees the button does something.
    const views = parseViewCount(viewCountText ?? '0');
    const estimated = estimateRevenueFromViews(views);

    // If the user has connected their own Google/YouTube credentials, try to
    // enrich the estimate with REAL private analytics (views + CTR).
    if (hasRequiredCredentials()) {
      const result = await fetchYouTubeMetrics(videoId);
      if (!isMetricsError(result)) {
        // Use the real view count to recompute revenue, and keep the real CTR.
        const realViews = result.views || estimated.views;
        setState({
          metrics: {
            ...estimateRevenueFromViews(realViews),
            cardClickThroughRate: result.cardClickThroughRate,
          },
          isLoading: false,
          error: null,
        });
        return;
      }
    }

    // No credentials: just show the estimate.
    setState({
      metrics: estimated,
      isLoading: false,
      error: null,
    });
  };

  if (state.isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '32px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-clay-sm)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Loader2
          size={16}
          strokeWidth={2.5}
          color="var(--yt-red)"
          style={{ animation: 'spin 0.7s linear infinite' }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Fetching analytics from YouTube...
        </span>
      </div>
    );
  }

  if (state.error) {
    const isOffline = !hasRequiredCredentials();

    return (
      <div className="space-y-3">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: isOffline ? 'rgba(107,114,128,0.08)' : 'rgba(239,68,68,0.08)',
            border: isOffline ? '1px solid rgba(107,114,128,0.2)' : '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          {isOffline ? (
            <WifiOff
              size={14}
              strokeWidth={2.5}
              color="#6B7280"
              style={{ flexShrink: 0, marginTop: '1px' }}
            />
          ) : (
            <AlertCircle
              size={14}
              strokeWidth={2.5}
              color="#DC2626"
              style={{ flexShrink: 0, marginTop: '1px' }}
            />
          )}
          <p style={{ margin: 0, fontSize: '0.75rem', color: isOffline ? '#4B5563' : '#991B1B', lineHeight: 1.5 }}>
            {isOffline ? 'Analytics Offline - Configure API credentials in Settings' : state.error}
          </p>
        </div>
        <button
          onClick={handleFetchPrivateMetrics}
          className="clay-btn-secondary w-full py-2"
          style={{ fontSize: '0.75rem', fontWeight: 700 }}
        >
          {isOffline ? 'Go to Settings' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!state.metrics) {
    const hasCredentials = hasRequiredCredentials();
    void hasCredentials;

    return (
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Estimated Earnings
        </p>
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)', maxWidth: '280px', lineHeight: 1.4 }}>
          {hasCredentials
            ? 'Click to estimate revenue from public views and enrich it with your real YouTube analytics.'
            : 'Click to estimate revenue from this video\u2019s public view count. Set your niche RPM in Settings for a more accurate figure.'}
        </p>
        <button
          onClick={handleFetchPrivateMetrics}
          className="clay-btn-red py-2 px-5"
          style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '2px' }}
        >
          Estimate Earnings
        </button>
      </div>
    );
  }

  const metrics = state.metrics;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
      {/* Node A: Estimated Revenue */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid rgba(255,0,0,0.15)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.3), transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--yt-red-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <DollarSign size={14} strokeWidth={2.5} color="var(--yt-red)" />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Est. Gross Revenue
          </span>
        </div>

        <div
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--yt-red)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          ${metrics.estimatedRevenue.toFixed(2)}
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Based on {metrics.views.toLocaleString()} views
        </div>
      </div>

      {/* Node B: Click-Through-Rate */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid rgba(59,130,246,0.15)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <MousePointer2 size={14} strokeWidth={2.5} color="#3B82F6" />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Click-Through-Rate
          </span>
        </div>

        <div
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#3B82F6',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          {(metrics.cardClickThroughRate * 100).toFixed(2)}%
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Card engagement rate
        </div>
      </div>

      {/* Node C: Net RPM */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid rgba(34,197,138,0.15)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(34,197,138,0.3), transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(34,197,138,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <TrendingUp size={14} strokeWidth={2.5} color="#22C55E" />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net RPM
          </span>
        </div>

        <div
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#22C55E',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          ${metrics.netRpm.toFixed(2)}
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Revenue per 1K views
        </div>
      </div>
    </div>
  );
}
