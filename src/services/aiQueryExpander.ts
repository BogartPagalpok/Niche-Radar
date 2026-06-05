// src/services/aiQueryExpander.ts
// Browser‑compatible YouTube SEO Machine
// Required keys in localStorage:
//   'niche_radar_cerebras_key'   – Cerebras API key (optional)
//   'niche_radar_youtube_key'    – YouTube Data API v3 key (required)

// ------------------------------------------------------------
// 1. QUERY EXPANSION (LLM, no hard‑coded strings)
// ------------------------------------------------------------
async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  const currentYear = new Date().getFullYear();

  // Primary: Cerebras LLM (tiny prompt to avoid hallucination)
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
    } catch {
      // fall through to dynamic fallback
    }
  }

  // Fallback: simply append current year (still dynamic, no hardcoded “trending”)
  if (query.split(' ').length <= 2) {
    return `${query} ${currentYear}`;
  }
  return query;
}

// ------------------------------------------------------------
// 2. SIMILARITY (Jaccard on stems)
// ------------------------------------------------------------
function computeRelevance(title: string, expandedQuery: string): number {
  const stem = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  const wordsA = new Set(stem(title));
  const wordsB = new Set(stem(expandedQuery));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / (union.size || 1);
}

// ------------------------------------------------------------
// 3. FETCH CANDIDATES (YouTube Data API v3, browser‑safe)
// ------------------------------------------------------------
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
  const YT_KEY = localStorage.getItem('niche_radar_youtube_key');
  if (!YT_KEY) throw new Error('Missing YouTube API key (niche_radar_youtube_key)');

  const expanded = await expandQuery(rawQuery);
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  const searchAndAdd = async (q: string) => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(q)}&key=${YT_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) return;
    for (const item of data.items) {
      const id = item.id.videoId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      candidates.push({
        id,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelName: item.snippet.channelTitle,
        views: 0, // will enrich later
        published: new Date(item.snippet.publishedAt),
        durationSec: 0, // not available in search, will enrich later
      });
    }
  };

  // Primary search with the expanded phrase
  await searchAndAdd(expanded);

  // Extra breadth: also search the original query (still dynamic)
  if (expanded !== rawQuery) {
    await searchAndAdd(rawQuery);
  }

  return candidates;
}

// ------------------------------------------------------------
// 4. ENRICH WITH STATS & SCORE
// ------------------------------------------------------------
interface ScoredCandidate extends Candidate {
  score: number;
}

async function pickBestVideo(
  candidates: Candidate[],
  expandedQuery: string
): Promise<ScoredCandidate | null> {
  if (!candidates.length) return null;

  const YT_KEY = localStorage.getItem('niche_radar_youtube_key');
  if (!YT_KEY) throw new Error('Missing YouTube API key');

  // Batch get video statistics + duration via videos.list
  const videoIds = candidates.map((c) => c.id);
  const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${YT_KEY}`;
  let videoStats: any = {};
  try {
    const res = await fetch(videoUrl);
    const data = await res.json();
    for (const item of data.items || []) {
      videoStats[item.id] = {
        views: parseInt(item.statistics?.viewCount || '0', 10),
        duration: parseDuration(item.contentDetails?.duration || 'PT0S'),
      };
    }
  } catch {}

  // Batch get channel subscriber counts via channels.list
  const channelIds = [...new Set(candidates.map((c) => c.channelId))];
  const subsMap = new Map<string, number>();
  try {
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds.join(',')}&key=${YT_KEY}`;
    const res = await fetch(channelUrl);
    const data = await res.json();
    for (const item of data.items || []) {
      const subs = parseInt(item.statistics?.subscriberCount || '0', 10);
      subsMap.set(item.id, subs);
    }
  } catch {}

  const now = Date.now();

  const withMetrics = candidates.map((v) => {
    const stats = videoStats[v.id] || { views: 0, duration: 0 };
    const subs = subsMap.get(v.channelId) || 1;
    const ageHours = v.published
      ? (now - v.published.getTime()) / 3600000
      : 168;
    const velocity = stats.views / (ageHours + 1);
    const relevance = computeRelevance(v.title, expandedQuery);
    return {
      ...v,
      views: stats.views,
      durationSec: stats.duration,
      subs,
      ageHours,
      velocity,
      relevance,
    };
  });

  // Min‑max normalisation
  const norm = (arr: number[]) => {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const range = max - min || 1;
    return arr.map((v) => (v - min) / range);
  };

  const rels = norm(withMetrics.map((x) => x.relevance));
  const auths = norm(withMetrics.map((x) => Math.log(x.subs + 1)));
  const fresh = norm(withMetrics.map((x) => 1 / (1 + x.ageHours / 168)));
  const vels = norm(withMetrics.map((x) => x.velocity));

  const scored: ScoredCandidate[] = withMetrics.map((v, i) => ({
    ...v,
    score: rels[i] * auths[i] * fresh[i] * vels[i],
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ------------------------------------------------------------
// 5. HELPERS
// ------------------------------------------------------------
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// ------------------------------------------------------------
// 6. PUBLIC API (keep original exports)
// ------------------------------------------------------------
export { expandQuery };

export async function identifyRelevantTopic(query: string): Promise<string> {
  return await expandQuery(query);
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
