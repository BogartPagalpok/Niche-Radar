import { Layers, Hash, TrendingUp, ChevronRight, Plus, Loader2, Search, AlertCircle } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import { useState, useMemo } from 'react';

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

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'how', 'to', 'in', 'for', 'of', 'with', 'a', 'is', 'on', 'that', 
  'this', 'why', 'from', 'your', 'vs', 'or', 'be', 'no', 'but', 'by', 'an', 'all',
  'has', 'was', 'are', 'not', 'it', 'its', 'can', 'you', 'we', 'he', 'she', 'they',
  'new', 'just', 'now', 'what', 'when', 'where', 'which', 'who', 'will', 'up', 'out',
  'about', 'into', 'over', 'after', 'been', 'one', 'two', 'also', 'get', 'got'
]);

// Extract meaningful n-grams (1-3 word phrases) from text
function extractPhrases(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
  
  if (words.length === 0) return [];
  
  const phrases: string[] = [];
  
  // 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  
  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  
  return phrases;
}

interface ClusterData {
  id: number;
  name: string;
  count: number;
  keywords: string[];
  color: string;
  competition: number;
  volume: string;
}

export default function KeywordClusters() {
  const { searchedVideos } = useVideoContext();
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);

  const clusters = useMemo(() => {
    if (!searchedVideos || searchedVideos.length === 0) return [];

    // Extract all meaningful phrases from all video titles
    const phraseCounts: Record<string, number> = {};
    
    searchedVideos.forEach(video => {
      const phrases = extractPhrases(video.title);
      const seen = new Set<string>();
      phrases.forEach(p => {
        if (!seen.has(p)) {
          seen.add(p);
          phraseCounts[p] = (phraseCounts[p] || 0) + 1;
        }
      });
    });

    // Group phrases by shared words
    const groups: Record<string, { phrases: string[]; count: number }> = {};
    
    Object.entries(phraseCounts)
      .filter(([_, count]) => count >= 2) // Only phrases appearing in 2+ videos
      .forEach(([phrase, count]) => {
        const rootWord = phrase.split(' ')[0];
        if (!groups[rootWord]) {
          groups[rootWord] = { phrases: [], count: 0 };
        }
        groups[rootWord].phrases.push(phrase);
        groups[rootWord].count += count;
      });

    const colors = ['#FF0000', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    return Object.entries(groups)
      .filter(([_, data]) => data.phrases.length >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, data], index) => ({
        id: index + 1,
        name: name.toUpperCase(),
        count: data.phrases.length,
        keywords: [...new Set(data.phrases)].sort((a, b) => b.length - a.length).slice(0, 8),
        color: colors[index] || '#6B7280',
        competition: Math.min(85, 15 + (data.phrases.length * 12) + (data.count * 3)),
        volume: `${Math.floor(data.count * 2.5 * 1000).toLocaleString()}`,
      }));
  }, [searchedVideos]);

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Keyword Clusters
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {clusters.length > 0 
              ? `${clusters.length} keyword groups found across ${searchedVideos?.length || 0} videos`
              : 'Search for videos to discover keyword clusters'}
          </p>
        </div>
        <button className="clay-btn-red flex items-center gap-1.5 px-3 py-2" style={{ fontSize: '0.78rem' }}>
          <Search size={13} strokeWidth={2.5} />
          Analyze
        </button>
      </div>

      {clusters.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertCircle size={28} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontSize: '0.85rem', margin: 0 }}>No keyword data yet</p>
          <p style={{ fontSize: '0.72rem', marginTop: '6px', opacity: 0.7 }}>
            Search YouTube to generate keyword clusters from video titles
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clusters.map(cluster => (
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
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
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {cluster.name} Cluster
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      <Hash size={10} strokeWidth={2.5} />{cluster.count} phrases
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      <TrendingUp size={10} strokeWidth={2.5} />~{cluster.volume} appearances
                    </span>
                  </div>
                </div>
                <CompetitionMeter value={cluster.competition} />
                <ChevronRight
                  size={14}
                  strokeWidth={2.5}
                  color="var(--text-tertiary)"
                  style={{
                    transform: expandedCluster === cluster.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms ease',
                  }}
                />
              </div>

              {expandedCluster === cluster.id && (
                <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cluster.keywords.map(kw => (
                    <span
                      key={kw}
                      className="clay-tag"
                      style={{
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                      onClick={() => {
                        // Could trigger a search for this keyword
                        console.log('Search for:', kw);
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
