import { useEffect, useState } from 'react';
import { Copy, CheckCircle2, Loader2, AlertCircle, Play } from 'lucide-react';
import { generateThumbnailPrompt, isGeneratorError } from '../services/geminiService';
import { type ExtractedVideo } from '../services/youtubeScraper';

// This UI component is correct and requires no changes. 
// The multimodal API fix needs to be applied to the `geminiService.ts` file where `generateThumbnailPrompt` is defined.

interface ThumbnailPromptGeneratorProps {
  video: ExtractedVideo;
}

interface ThumbnailState {
  prompt: string | null;
  isLoading: boolean;
  error: string | null;
  copied: boolean;
}

export function ThumbnailPromptGenerator({ video }: ThumbnailPromptGeneratorProps): React.ReactElement {
  const [state, setState] = useState<ThumbnailState>({
    prompt: null,
    isLoading: false,
    error: null,
    copied: false,
  });

  useEffect(() => {
    // Structural architectural enforcement: On-demand ONLY. Clear state on video context switch.
    setState({
      prompt: null,
      isLoading: false,
      error: null,
      copied: false,
    });
  }, [video.video_id]);

  const handleGenerateThumbnail = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const result = await generateThumbnailPrompt(video);

    if (isGeneratorError(result)) {
      setState({
        prompt: null,
        isLoading: false,
        error: result.message,
        copied: false,
    });
    } else {
      setState({
        prompt: result.prompt,
        isLoading: false,
        error: null,
        copied: false,
      });
    }
  };

  const handleCopy = (): void => {
    if (state.prompt) {
      navigator.clipboard.writeText(state.prompt);
      setState(prev => ({ ...prev, copied: true }));
      setTimeout(() => setState(prev => ({ ...prev, copied: false })), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          Midjourney Thumbnail Prompt
        </h3>
        {state.prompt && (
          <button
            onClick={handleCopy}
            style={{
              background: state.copied ? 'linear-gradient(135deg, #C6F6E4, #9AEFD0)' : 'linear-gradient(135deg, #FF3333, #FF0000)',
              border: 'none',
              borderRadius: '999px',
              boxShadow: state.copied ? 'var(--shadow-pill-active)' : 'var(--shadow-red)',
              cursor: 'pointer',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: state.copied ? 'var(--mint-text)' : '#FFFFFF',
              transition: 'all 200ms ease',
            }}
            title="Copy thumbnail prompt"
          >
            {state.copied ? (
              <>
                <CheckCircle2 size={11} strokeWidth={2.5} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} strokeWidth={2} />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      {!state.prompt && !state.isLoading && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-inset)',
            border: '1px solid var(--border-subtle)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Visual Concept Lock
          </p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-tertiary)', maxWidth: '280px', lineHeight: 1.4 }}>
            Click below to forward this record's visual variables to Gemini 2.5 and generate a highly optimized Midjourney artwork prompt layout.
          </p>
          <button
            onClick={handleGenerateThumbnail}
            className="clay-btn-secondary flex items-center gap-1.5 px-4 py-2"
            style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: '2px' }}
          >
            <Play size={10} strokeWidth={3} fill="currentColor" />
            Generate Thumbnail Prompt
          </button>
        </div>
      )}

      {state.isLoading && (
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
            Querying Gemini models & engineering thumbnail art structure…
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

      {state.prompt && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-inset)',
            border: '1px solid var(--border-subtle)',
            padding: '14px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {state.prompt}
        </div>
      )}
    </div>
  );
}
