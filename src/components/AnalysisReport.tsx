import { useEffect, useState } from 'react';
import { Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateMarkdownDocument, downloadMarkdownFile } from '../services/markdownService';
import { type ExtractedVideo } from '../services/youtubeScraper';
import { type YouTubeMetrics } from '../services/metricsService';

interface AnalysisReportProps {
  video: ExtractedVideo;
  metrics: YouTubeMetrics | null;
  scriptPrompt: string;
  thumbnailPrompt: string;
}

interface ReportState {
  isGenerating: boolean;
  isDownloading: boolean;
  downloadComplete: boolean;
  error: string | null;
  markdownContent: string | null;
}

export function AnalysisReport({ video, metrics, scriptPrompt, thumbnailPrompt }: AnalysisReportProps): React.ReactElement {
  const [state, setState] = useState<ReportState>({
    isGenerating: true,
    isDownloading: false,
    downloadComplete: false,
    error: null,
    markdownContent: null,
  });

  useEffect(() => {
    try {
      const markdown = generateMarkdownDocument({
        video: video,
        metrics: metrics,
        scriptPrompt: scriptPrompt && scriptPrompt.trim() !== '' 
          ? scriptPrompt 
          : '⚠️ No script prompt generated. Please generate the script prompt in the dashboard before exporting this report.',
        thumbnailPrompt: thumbnailPrompt && thumbnailPrompt.trim() !== '' 
          ? thumbnailPrompt 
          : '⚠️ No thumbnail prompt generated. Please generate the thumbnail prompt in the dashboard before exporting this report.',
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        markdownContent: markdown,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate markdown document';

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
    }
  }, [video, metrics, scriptPrompt, thumbnailPrompt]);

  const handleDownload = (): void => {
    if (!state.markdownContent) return;

    setState(prev => ({ ...prev, isDownloading: true }));

    try {
      const timestamp = new Date().getTime();
      const filename = `niche-radar-${video.video_id}-${timestamp}.md`;
      downloadMarkdownFile(state.markdownContent, filename);

      setState(prev => ({
        ...prev,
        isDownloading: false,
        downloadComplete: true,
      }));

      setTimeout(
        () => setState(prev => ({ ...prev, downloadComplete: false })),
        2000
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';

      setState(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage,
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          Analysis Report
        </h3>
        {state.markdownContent && !state.isGenerating && (
          <span className="clay-tag-mint" style={{ fontSize: '0.7rem' }}>
            {state.markdownContent.length} characters
          </span>
        )}
      </div>

      {state.isGenerating && (
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
            Compiling report…
          </span>
        </div>
      )}

      {state.error && (
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
      )}

      {state.markdownContent && !state.isGenerating && (
        <>
          {/* Preview */}
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-inset)',
              border: '1px solid var(--border-subtle)',
              padding: '12px 14px',
              maxHeight: '200px',
              overflowY: 'auto',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.7rem',
              lineHeight: 1.5,
              color: 'var(--text-tertiary)',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {state.markdownContent.slice(0, 500)}…
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={state.isDownloading}
            className="clay-btn-red flex items-center justify-center gap-2 px-4 py-3 w-full"
            style={{
              opacity: state.isDownloading ? 0.7 : 1,
              cursor: state.isDownloading ? 'not-allowed' : 'pointer',
            }}
            title="Download as Markdown file"
          >
            {state.downloadComplete ? (
              <>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                <span>Downloaded!</span>
              </>
            ) : state.isDownloading ? (
              <>
                <Loader2 size={14} strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }} />
                <span>Downloading…</span>
              </>
            ) : (
              <>
                <Download size={14} strokeWidth={2.5} />
                <span>Download Replication .md Sheet</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
