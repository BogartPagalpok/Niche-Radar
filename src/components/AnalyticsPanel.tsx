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
    isLoading: false,
  });

  useEffect(() => {
    // Structural architectural enforcement: On-demand ONLY. Do not auto-fetch or auto-generate on look-up.
    setMetrics(null);
    setGeneratorState({
      scriptPrompt: '',
      thumbnailPrompt: '',
      isLoading: false,
    });
  }, [video.video_id]);

  const handleTriggerAnalysis = async (): Promise<void> => {
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

  const hasGeneratedData = generatorState.scriptPrompt !== '' || generatorState.thumbnailPrompt !== '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Run Analysis Trigger Gateway Controls */}
      {!hasGeneratedData && !generatorState.isLoading && (
        <div
          style={{
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-clay)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Deep Generative Analysis Ready
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: '320px', lineHeight: 1.4 }}>
            Click below to initiate the active Gemini model extraction engine and process secure API data metrics for this video blueprint.
          </p>
          <button
            onClick={handleTriggerAnalysis}
            className="clay-btn-red py-2.5 px-6"
            style={{ fontSize: '0.8rem', fontWeight: 700, marginTop: '4px' }}
          >
            Run Blueprint Extraction
          </button>
        </div>
      )}

      {generatorState.isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '48px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-inset)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Loader2
            size={24}
            strokeWidth={2.5}
            color="var(--yt-red)"
            style={{ animation: 'spin 0.7s linear infinite' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Processing Deep Analytics & Model Prompt Structure...
          </span>
        </div>
      )}

      {hasGeneratedData && !generatorState.isLoading && (
        <>
          {/* Section 1: Performance Metrics */}
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
            <ScriptPromptGenerator video={video} />
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
            <ThumbnailPromptGenerator video={video} />
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
        </>
      )}
    </div>
  );
}
