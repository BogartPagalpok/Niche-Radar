import { FileText, Trash2, Clock } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';

// Shows every analysis the user has generated (persisted in localStorage via
// analysisFolder). This is the "where did my generated data go?" view.
export default function GeneratedAnalyses(): React.ReactElement {
  const { analysisFolder, selectVideo } = useVideoContext();

  const items = Object.values(analysisFolder).sort(
    (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime(),
  );

  const handleOpen = (item: (typeof items)[number]): void => {
    // Re-open the video in the detail panel so the user sees the full analysis.
    selectVideo({
      video_id: item.video_id,
      title: item.title,
      view_count: '',
      description: '',
      duration: '',
      upload_date: '',
      thumbnail_url: item.thumbnail_url || '',
      channel_name: item.channel_name,
      channel_id: '',
    });
  };

  const handleDelete = (videoId: string): void => {
    try {
      const raw = localStorage.getItem('niche-radar-analysis-folder');
      const folder = raw ? JSON.parse(raw) : {};
      delete folder[videoId];
      localStorage.setItem('niche-radar-analysis-folder', JSON.stringify(folder));
      window.location.reload(); // simplest reliable refresh of this list
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Generated Analyses
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Every blueprint you've generated is saved here. Click one to reopen it.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textAlign: 'center',
            paddingBottom: '40px',
          }}
        >
          <FileText size={28} strokeWidth={1.5} color="var(--text-tertiary)" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
            No analyses yet
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0, maxWidth: '260px', lineHeight: 1.5 }}>
            Open a video and run “Blueprint Extraction” — your generated scripts and prompts will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          {items.map(item => (
            <div
              key={item.video_id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-clay-sm)',
              }}
            >
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt=""
                  style={{ width: '88px', height: '50px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '88px', height: '50px', borderRadius: '8px', background: 'var(--bg-panel)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--text-tertiary)" />
                </div>
              )}

              <button
                onClick={() => handleOpen(item)}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={11} /> {item.analyzedAt} · {item.channel_name}
                </p>
              </button>

              <button
                onClick={() => handleDelete(item.video_id)}
                title="Delete this analysis"
                style={{ flexShrink: 0, padding: '8px', borderRadius: '10px', border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer' }}
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
