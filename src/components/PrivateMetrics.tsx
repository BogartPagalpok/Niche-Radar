import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, MousePointer2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchYouTubeMetrics, isMetricsError, type YouTubeMetrics } from '../services/metricsService';

interface PrivateMetricsProps {
  videoId: string;
}

interface MetricsState {
  metrics: YouTubeMetrics | null;
  isLoading: boolean;
  error: string | null;
}

export function PrivateMetrics({ videoId }: PrivateMetricsProps): React.ReactElement {
  const [state, setState] = useState<MetricsState>({
    metrics: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadMetrics = async (): Promise<void> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await fetchYouTubeMetrics(videoId);

      if (isMetricsError(result)) {
        setState({
          metrics: null,
          isLoading: false,
          error: result.message,
        });
      } else {
        setState({
          metrics: result,
          isLoading: false,
          error: null,
        });
      }
    };

    loadMetrics();
  }, [videoId]);

  if (state.isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-clay-sm)',
        }}
      >
        <Loader2
          size={16}
          strokeWidth={2.5}
          color="var(--yt-red)"
          style={{ animation: 'spin 0.7s linear infinite' }}
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Loading metrics…
        </span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}
      >
        <AlertCircle
          size={14}
          strokeWidth={2.5}
          color="#DC2626"
          style={{ flexShrink: 0, marginTop: '1px' }}
        />
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#991B1B', lineHeight: 1.5 }}>
          {state.error}
        </p>
      </div>
    );
  }

  if (!state.metrics) {
    return (
      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px' }}>
        No metrics available
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
