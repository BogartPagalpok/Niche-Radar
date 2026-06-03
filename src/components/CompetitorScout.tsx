import { Zap, Youtube, Users, Eye, ExternalLink, Star } from 'lucide-react';

const COMPETITORS = [
  {
    id: 1,
    channel: 'TechWithTim',
    niche: 'AI & Python',
    subs: '1.2M',
    views: '85M',
    upload_freq: '2x/week',
    avg_views: '180K',
    threat: 'High',
    score: 78,
  },
  {
    id: 2,
    channel: 'NickWhitmore',
    niche: 'Solopreneur',
    subs: '420K',
    views: '18M',
    upload_freq: '1x/week',
    avg_views: '62K',
    threat: 'Medium',
    score: 65,
  },
  {
    id: 3,
    channel: 'JeffSu',
    niche: 'Productivity',
    subs: '680K',
    views: '31M',
    upload_freq: '1x/week',
    avg_views: '94K',
    threat: 'Medium',
    score: 71,
  },
  {
    id: 4,
    channel: 'BrettFromLA',
    niche: 'Creator Economy',
    subs: '190K',
    views: '7M',
    upload_freq: '3x/week',
    avg_views: '38K',
    threat: 'Low',
    score: 48,
  },
];

function ThreatBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    High: { bg: 'rgba(255,0,0,0.1)', color: 'var(--yt-red)' },
    Medium: { bg: 'rgba(245,158,11,0.1)', color: '#B45309' },
    Low: { bg: 'rgba(34,197,94,0.1)', color: '#15803D' },
  };
  const s = styles[level] ?? styles.Medium;
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: s.bg, color: s.color, borderRadius: '999px', padding: '2px 8px', border: `1px solid ${s.color}30` }}>
      {level} Threat
    </span>
  );
}

export default function CompetitorScout() {
  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Competitor Scout
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Track and analyze competing channels in your niches
        </p>
      </div>

      <div className="space-y-3">
        {COMPETITORS.map(ch => (
          <div
            key={ch.id}
            style={{
              background: 'var(--bg-panel)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-clay)',
              border: '1px solid var(--border-subtle)',
              padding: '14px 16px',
              transition: 'all 150ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-clay-lg)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-clay)';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-red)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)' }} />
                <Youtube size={18} color="#FFFFFF" strokeWidth={2} style={{ position: 'relative' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ch.channel}</span>
                  <ThreatBadge level={ch.threat} />
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, marginLeft: 'auto' }}>
                    <ExternalLink size={13} strokeWidth={2} />
                  </button>
                </div>
                <span className="clay-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                  <Zap size={9} strokeWidth={2.5} />
                  {ch.niche}
                </span>

                <div className="flex items-center gap-4 flex-wrap">
                  {[
                    { icon: Users, val: ch.subs, label: 'subs' },
                    { icon: Eye, val: ch.views, label: 'total' },
                    { icon: Star, val: ch.avg_views, label: 'avg/video' },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="flex items-center gap-1">
                        <Icon size={11} strokeWidth={2} color="var(--text-tertiary)" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{m.val}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{m.label}</span>
                      </div>
                    );
                  })}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                    {ch.upload_freq}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
