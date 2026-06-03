import { Layers, Hash, TrendingUp, ChevronRight, Plus } from 'lucide-react';

const CLUSTERS = [
  {
    id: 1,
    name: 'AI Automation',
    count: 24,
    volume: '2.1M',
    competition: 18,
    keywords: ['AI workflow', 'no-code AI', 'automation tools', 'zapier alternatives', 'n8n tutorial', 'AI agent', 'LLM apps'],
    color: '#FF0000',
  },
  {
    id: 2,
    name: 'Creator Economy',
    count: 18,
    volume: '890K',
    competition: 42,
    keywords: ['youtube growth', 'creator monetization', 'sponsorship', 'digital products', 'course creation'],
    color: '#3B82F6',
  },
  {
    id: 3,
    name: 'Wealth Building',
    count: 31,
    volume: '3.4M',
    competition: 55,
    keywords: ['index funds', 'real estate investing', 'dividend stocks', 'financial freedom', 'early retirement'],
    color: '#10B981',
  },
  {
    id: 4,
    name: 'Health Optimization',
    count: 22,
    volume: '1.7M',
    competition: 38,
    keywords: ['biohacking', 'longevity', 'sleep optimization', 'cold plunge', 'zone 2 training'],
    color: '#F59E0B',
  },
];

function CompetitionMeter({ value }: { value: number }) {
  const color = value < 30 ? '#22C55E' : value < 55 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>
        {value < 30 ? 'LOW' : value < 55 ? 'MED' : 'HIGH'}
      </span>
      <div
        style={{
          width: '60px',
          height: '4px',
          borderRadius: '999px',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-inset)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: '999px' }} />
      </div>
    </div>
  );
}

export default function KeywordClusters() {
  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Keyword Clusters
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            AI-grouped keyword topics by semantic relevance
          </p>
        </div>
        <button className="clay-btn-red flex items-center gap-1.5 px-3 py-2" style={{ fontSize: '0.78rem' }}>
          <Plus size={13} strokeWidth={2.5} />
          New Cluster
        </button>
      </div>

      <div className="space-y-3">
        {CLUSTERS.map(cluster => (
          <div
            key={cluster.id}
            style={{
              background: 'var(--bg-panel)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-clay)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              transition: 'all 150ms ease',
            }}
          >
            {/* Cluster header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${cluster.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-clay-sm)',
                }}
              >
                <Layers size={16} strokeWidth={2.5} color={cluster.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cluster.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    <Hash size={10} strokeWidth={2.5} />{cluster.count} keywords
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    <TrendingUp size={10} strokeWidth={2.5} />{cluster.volume} monthly
                  </span>
                </div>
              </div>
              <CompetitionMeter value={cluster.competition} />
              <ChevronRight size={14} strokeWidth={2.5} color="var(--text-tertiary)" />
            </div>

            {/* Keywords */}
            <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {cluster.keywords.map(kw => (
                <span key={kw} className="clay-tag">{kw}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
