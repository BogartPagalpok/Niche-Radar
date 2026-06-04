import { useState, useEffect } from 'react';
import { type ExtractedVideo } from '../services/youtubeScraper';
import { fetchYouTubeMetrics, isMetricsError } from '../services/metricsService';
import { generateScriptPrompt, generateThumbnailPrompt, isGeneratorError } from '../services/geminiService';
import { PrivateMetrics } from './PrivateMetrics';
import { ScriptPromptGenerator } from './ScriptPromptGenerator';
import { ThumbnailPromptGenerator } from './ThumbnailPromptGenerator';
import { AnalysisReport } from './AnalysisReport';
import { Loader2 } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';

interface AnalyticsPanelProps {
  video: ExtractedVideo;
}

export function AnalyticsPanel({ video }: AnalyticsPanelProps): React.ReactElement {
  // Use global context folder tracking utilities
  const { analysisFolder, saveAnalysisToFolder } = useVideoContext();
  const [isLoading, setIsLoading] = useState(false);

  // Check if this specific video has an existing analysis blueprint in the storage folder
  const savedData = analysisFolder?.[video.video_id];

  const handleTriggerAnalysis = async (): Promise<void> => {
    setIsLoading(true);

    let finalMetrics = null;
    const metricsResult = await fetchYouTubeMetrics(video.video_id);
    if (!isMetricsError(metricsResult)) {
      finalMetrics = metricsResult;
    }

    const scriptResult = await generateScriptPrompt(video);
    const scriptPrompt = !isGeneratorError(scriptResult) ? scriptResult.script : '';

    const thumbnailResult = await generateThumbnailPrompt(video);
    const thumbnailPrompt = !isGeneratorError(thumbnailResult) ? thumbnailResult.prompt : '';

    // Commit data structurally to our global persistent local folder storage path
    saveAnalysisToFolder(video, finalMetrics, scriptPrompt, thumbnailPrompt);
    
    setIsLoading(false);
  };

  // Read variables directly out of the folder definition object
  const hasGeneratedData = !!savedData;
  const currentMetrics = savedData ? savedData.metrics : null;
  const currentScriptPrompt = savedData ? savedData.scriptPrompt : '';
  const currentThumbnailPrompt = savedData ? savedData.thumbnailPrompt : '';

  return (
    <div className="space-y-6 animate-fade-in" style={{ paddingBottom: '32px' }}>
      {!hasGeneratedData && !isLoading && (
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

      {isLoading && (
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

      {hasGeneratedData && !isLoading && (
        <>
          {/* Section 1: Performance Metrics */}
          <section>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '12px', textTransform: 'uppercase' }}>
              1. Performance Metrics
            </h2>
            <PrivateMetrics videoId={video.video_id} />
          </section>

          <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

          {/* Section 2: Script Prompt */}
          <section>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '12px', textTransform: 'uppercase' }}>
              2. Content Script Prompt
            </h2>
            <ScriptPromptGenerator video={video} />
          </section>

          <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

          {/* Section 3: Thumbnail Prompt */}
          <section>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '12px', textTransform: 'uppercase' }}>
              3. Thumbnail Prompt
            </h2>
            <ThumbnailPromptGenerator video={video} />
          </section>

          <div style={{ height: '1px', background: 'var(--border-subtle)', borderRadius: '999px', opacity: 0.4 }} />

          {/* Section 4: Analysis Report */}
          <section>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '12px', textTransform: 'uppercase' }}>
              4. Complete Analysis Report
            </h2>
            <AnalysisReport
              video={video}
              metrics={currentMetrics}
              scriptPrompt={currentScriptPrompt}
              thumbnailPrompt={currentThumbnailPrompt}
            />
          </section>
        </>
      )}
    </div>
  );
}
