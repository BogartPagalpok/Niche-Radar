import { useState, useEffect } from 'react';
import { type ExtractedVideo } from '../services/youtubeScraper';
import { fetchYouTubeMetrics, isMetricsError, type YouTubeMetrics } from '../services/metricsService';
import { generateScriptPrompt, generateThumbnailPrompt, isGeneratorError } from '../services/geminiService';
import { PrivateMetrics } from './PrivateMetrics';
import { ScriptPromptGenerator } from './ScriptPromptGenerator';
import { ThumbnailPromptGenerator } from './ThumbnailPromptGenerator';
import { AnalysisReport } from './AnalysisReport';
import { Loader2 } from 'lucide-react';

interface AnalyticsPanelProps {
  video: ExtractedVideo;
}

interface GeneratorState {
  scriptPrompt: string;
  thumbnailPrompt: string;
  isLoading: boolean;
}

export function AnalyticsPanel({ video }: AnalyticsPanelProps): React.ReactElement {
  const [metrics, setMetrics] = useState<YouTubeMetrics | null>(null);
  const [generatorState, setGeneratorState] = useState<GeneratorState>({
    scriptPrompt: '',
    thumbnailPrompt: '',
    isLoading: true,
  });

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setGeneratorState(prev => ({ ...prev, isLoading: true }));

      const metricsResult = await fetchYouTubeMetrics(video.video_id);
      if (!isMetricsError(metricsResult)) {
        setMetrics(metricsResult);
      }

      const scriptResult = await generateScriptPrompt(video);
      const scriptPrompt = !isGeneratorError(scriptResult) ? scriptResult.script : '';

      const thumbnailResult = await generateThumbnailPrompt(video);
      const thumbnailPrompt = !isGeneratorError(thumbnailResult) ? thumbnailResult.prompt : '';

      setGeneratorState({
        scriptPrompt: scriptPrompt,
        thumbnailPrompt: thumbnailPrompt,
        isLoading: false,
      });
    };

    loadData();
  }, [video.video_id]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section 1: Private Metrics */}
      <section>
        <h2
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          1. Performance Metrics
        </h2>
        <PrivateMetrics videoId={video.video_id} />
      </section>

      <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

      {/* Section 2: Script Prompt */}
      <section>
        <h2
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          2. Content Script Prompt
        </h2>
        {generatorState.isLoading && generatorState.scriptPrompt === '' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '32px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-inset)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Loader2
              size={16}
              strokeWidth={2.5}
              color="var(--yt-red)"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Generating script…
            </span>
          </div>
        ) : (
          <ScriptPromptGenerator video={video} />
        )}
      </section>

      <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

      {/* Section 3: Thumbnail Prompt */}
      <section>
        <h2
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          3. Thumbnail Prompt
        </h2>
        {generatorState.isLoading && generatorState.thumbnailPrompt === '' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '32px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-inset)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Loader2
              size={16}
              strokeWidth={2.5}
              color="var(--yt-red)"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Generating thumbnail…
            </span>
          </div>
        ) : (
          <ThumbnailPromptGenerator video={video} />
        )}
      </section>

      <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

      {/* Section 4: Analysis Report */}
      <section>
        <h2
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '12px',
            textTransform: 'uppercase',
          }}
        >
          4. Complete Analysis Report
        </h2>
        <AnalysisReport
          video={video}
          metrics={metrics}
          scriptPrompt={generatorState.scriptPrompt}
          thumbnailPrompt={generatorState.thumbnailPrompt}
        />
      </section>
    </div>
  );
}
