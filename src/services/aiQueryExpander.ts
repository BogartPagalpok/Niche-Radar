// src/services/aiQueryExpander.ts
import youtubeSearchApi from 'youtube-search-api';

// ------------------------------------------------------------------
// 1. DYNAMIC QUERY EXPANSION (Cerebras or date‑only fallback)
// ------------------------------------------------------------------
async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  const currentYear = new Date().getFullYear();

  if (cerebrasKey) {
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cerebrasKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-oss-120b',
          messages: [
            {
              role: 'system',
              content:
                `Expand user query into a YouTube search phrase. Infer intent. ` +
                `Append high-traffic modifiers (e.g., year ${currentYear} if relevant). ` +
                `No tutorial unless asked. Only the phrase, no quotes.`,
            },
            { role: 'user', content: query },
          ],
          temperature: 0.2,
          max_tokens: 30,
        }),
      });
      const data = await res.json();
      const expanded = data.choices?.[0]?.message?.content?.trim();
      if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
        return expanded;
      }
    } catch { /* fall through to dynamic fallback */ }
  }

  // Dynamic fallback – only the current year, no hard‑coded keywords
  if (query.split(' ').length <= 2) {
    return `${query} ${currentYear}`;
  }
  return query;
}

// ------------------------------------------------------------------
// 2. TITLE SIMILARITY (Jaccard)
// ------------------------------------------------------------------
function computeRelevance(title: string, expandedQuery: string): number {
  const stem = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  const wordsA = new Set(stem(title));
  const wordsB = new Set(stem(expandedQuery));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / (union.size || 1);
}

// ------------------------------------------------------------------
// 3. CANDIDATE FETCHING (youtube-search-api – unlimited, no key)
// ------------------------------------------------------------------
interface Candidate {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  views: number;
  published: Date | null;
  durationSec: number;
}

async function fetchCandidates(rawQuery: string): Promise<Candidate[]> {
  const expanded = await expandQuery(rawQuery);
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  const searchAndAdd = async (q: string) => {
    try {
      const result = await youtubeSearchApi.default(q);
      const items = result?.items || [];
      for (const item of items) {
        const id = item.id?.videoId;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        candidates.push({
          id,
          title: item.snippet?.title || '',
          channelId: item.snippet?.channelId || '',
          channelName: item.snippet?.channelTitle || '',
          views: 0,
          published: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null,
          durationSec: 0,
        });
      }
    } catch { /* skip query if error */ }
  };

  // Search with the expanded phrase, and also with the raw query for diversity
  await searchAndAdd(expanded);
  if (expanded !== rawQuery) {
    await searchAndAdd(rawQuery);
  }

  return candidates;
}

// ------------------------------------------------------------------
// 4. OPTIONAL ENRICHMENT (YouTube Data API key if available)
// ------------------------------------------------------------------
async function enrichCandidatesIfPossible(candidates: Candidate[]): Promise<void> {
  const YT_KEY = localStorage.getItem('niche_radar_youtube_key');
  if (!YT_KEY || candidates.length === 0) return;

  const videoIds = candidates.map(c => c.id).join(',');
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_KEY}`
    );
    const data = await res.json();
    if (data.items) {
      const statsMap: Record<string, { views: number; duration: number }> = {};
      for (const item of data.items) {
        statsMap[item.id] = {
          views: parseInt(item.statistics?.viewCount || '0', 10),
          duration: parseDuration(item.contentDetails?.duration || 'PT0S'),
        };
      }
      for (const c of candidates) {
        if (statsMap[c.id]) {
          c.views = statsMap[c.id].views;
          c.durationSec = statsMap[c.id].duration;
        }
      }
    }
  } catch {}
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) +
         (parseInt(match[2] || '0') * 60) +
         parseInt(match[3] || '0');
}

// ------------------------------------------------------------------
// 5. SEO SCORING (relevance × freshness × velocity [if available])
// ------------------------------------------------------------------
interface ScoredCandidate extends Candidate {
  score: number;
}

async function pickBestVideo(
  candidates: Candidate[],
  expandedQuery: string
): Promise<ScoredCandidate | null> {
  if (!candidates.length) return null;

  // Try to enrich with real stats (no‑op if key missing)
  await enrichCandidatesIfPossible(candidates);

  const now = Date.now();
  const withMetrics = candidates.map(v => {
    const ageHours = v.published ? (now - v.published.getTime()) / 3600000 : 168;
    const velocity = v.views / (ageHours + 1);
    const relevance = computeRelevance(v.title, expandedQuery);
    return { ...v, ageHours, velocity, relevance };
  });

  // Min‑max normalise each dimension (0‑1)
  const norm = (arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map(v => (v - min) / range);
  };

  const rels = norm(withMetrics.map(x => x.relevance));
  const auths = Array(withMetrics.length).fill(1);   // channel authority not available without API
  const fresh = norm(withMetrics.map(x => 1 / (1 + x.ageHours / 168)));
  const vels = withMetrics.some(x => x.views > 0)
    ? norm(withMetrics.map(x => x.velocity))
    : Array(withMetrics.length).fill(1);

  const scored: ScoredCandidate[] = withMetrics.map((v, i) => ({
    ...v,
    score: rels[i] * auths[i] * fresh[i] * vels[i],
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ------------------------------------------------------------------
// 6. PUBLIC API (identical to your original exports)
// ------------------------------------------------------------------
export { expandQuery };

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}

export async function findBestVideo(query: string): Promise<{
  videoId: string;
  title: string;
  channel: string;
  url: string;
  score: number;
  expandedQuery: string;
}> {
  const expanded = await expandQuery(query);
  const candidates = await fetchCandidates(query);
  const best = await pickBestVideo(candidates, expanded);
  if (!best) {
    throw new Error('No videos found');
  }
  return {
    videoId: best.id,
    title: best.title,
    channel: best.channelName,
    url: `https://www.youtube.com/watch?v=${best.id}`,
    score: best.score,
    expandedQuery: expanded,
  };
}
