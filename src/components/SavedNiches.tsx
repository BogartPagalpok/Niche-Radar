import { BookMarked, Star, TrendingUp, Trash2, Tag } from 'lucide-react';

const SAVED = [
  { id: 1, name: 'AI Side Hustles', score: 96, saved_at: '2 days ago', tags: ['AI', 'Monetization'], trend: '+61%' },
  { id: 2, name: 'Micro SaaS Building', score: 88, saved_at: '4 days ago', tags: ['Tech', 'Startup'], trend: '+34%' },
  { id: 3, name: 'Personal Finance Gen Z', score: 81, saved_at: '1 week ago', tags: ['Finance', 'Education'], trend: '+22%' },
];

export default function SavedNiches() {
  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Saved Niches
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Your bookmarked niche opportunities
          </p>
        </div>
        <span className="clay-tag">{SAVED.length} saved</span>
      </div>

      {SAVED.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
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
            <BookMarked size={24} strokeWidth={1.5} color="var(--text-tertiary)" />
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No saved niches yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {SAVED.map(item => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-panel)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-clay)',
                border: '1px solid var(--border-subtle)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #C6F6E4, #9AEFD0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-pill-active)',
                }}
              >
                <Star size={18} strokeWidth={2.5} color="var(--mint-text)" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {item.name}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.tags.map(t => (
                    <span key={t} className="clay-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Tag size={9} strokeWidth={2} />
                      {t}
                    </span>
                  ))}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{item.saved_at}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                    <TrendingUp size={10} strokeWidth={2.5} color="#22C55E" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22C55E' }}>{item.trend}</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: item.score > 90 ? 'var(--yt-red)' : '#10B981' }}>
                    {item.score}
                  </span>
                </div>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    padding: '6px',
                    borderRadius: '8px',
                  }}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
