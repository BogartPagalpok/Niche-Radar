// youtubeScraper.ts

import { Innertube } from 'youtubei.js';

// ------------------------------------------------------------------
// Types
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

interface ScoredCandidate extends Candidate {
  score: number;
}

// ------------------------------------------------------------------
// 1. QUERY EXPANSION (zero hard‑coded keywords)
// ------------------------------------------------------------------
async function expandQuery(query: string): Promise<string> {
  const cerebrasKey =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('niche_radar_cerebras_key')
      : null;
  const currentYear = new Date().getFullYear();

  // --- Primary: tiny LLM prompt (avoids hallucination, no forced tutorial) ---
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
    } catch { /* fall through */ }
  }

  // --- Fallback 1: YouTube autocomplete (100% dynamic) ---
  try {
    const yt = await Innertube.create();
    const suggestions = await yt.getSearchSuggestions(query);
    if (suggestions.length) {
      const best = suggestions.reduce((a, b) =>
        (a.text?.length || 0) > (b.text?.length || 0) ? a : b
      );
      if (best?.text) return best.text;
    }
  } catch { /* fall through */ }

  // --- Fallback 2: append current year (still no hardcoded year) ---
  if (query.split(' ').length <= 2) {
    return `${query} ${currentYear}`;
  }
  return query;
}

// ------------------------------------------------------------------
// 2. TITLE SIMILARITY (Jaccard on stems)
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
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / (union.size || 1);
}

// ------------------------------------------------------------------
// 3. FETCH CANDIDATE VIDEOS
// ------------------------------------------------------------------
async function fetchCandidates(rawQuery: string): Promise<Candidate[]> {
  const expanded = await expandQuery(rawQuery);
  const yt = await Innertube.create();
  const candidates: Candidate[] = [];
  const seen = new Set<string>();

  const addVideos = (videos: any[]) => {
    for (const v of videos) {
      if (!seen.has(v.id)) {
        seen.add(v.id);
        candidates.push({
          id: v.id,
          title: v.title,
          channelId: v.author.id,
          channelName: v.author.name,
          views: v.view_count ?? 0,
          published: v.published?.date ? new Date(v.published.date) : null,
          durationSec: v.duration?.seconds ?? 0,
        });
      }
    }
  };

  // Primary search with expanded phrase
  const mainSearch = await yt.search(expanded, { type: 'video' });
  addVideos(mainSearch.videos);

  // Extra breadth: top 2 live autocomplete suggestions
  try {
    const suggestions = await yt.getSearchSuggestions(rawQuery);
    for (const sug of suggestions.slice(0, 2)) {
      const res = await yt.search(sug, { type: 'video' });
      addVideos(res.videos);
    }
  } catch {}

  return candidates;
}

// ------------------------------------------------------------------
// 4. SEO SCORING & FINAL PICK
// ------------------------------------------------------------------
async function pickBestVideo(
  candidates: Candidate[],
  expandedQuery: string
): Promise<ScoredCandidate | null> {
  if (!candidates.length) return null;

  // Fetch subscriber counts for all unique channels
  const channelIds = [...new Set(candidates.map((c) => c.channelId))];
  const subsMap = new Map<string, number>();
  try {
    const yt = await Innertube.create();
    for (const id of channelIds) {
      try {
        const channel = await yt.getChannel(id);
        const subs =
          typeof channel.metadata?.subscriberCount === 'number'
            ? channel.metadata.subscriberCount
            : 0;
        subsMap.set(id, subs);
      } catch {
        subsMap.set(id, 1);
      }
    }
  } catch {
    channelIds.forEach((id) => subsMap.set(id, 1));
  }

  const now = Date.now();

  // Raw metrics
  const withMetrics = candidates.map((v) => {
    const subs = subsMap.get(v.channelId) || 1;
    const ageHours = v.published
      ? (now - v.published.getTime()) / 3600000
      : 168;
    const velocity = v.views / (ageHours + 1);
    const relevance = computeRelevance(v.title, expandedQuery);
    return { ...v, subs, ageHours, velocity, relevance };
  });

  // Min‑max normalisation (0‑1)
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

// ------------------------------------------------------------------
// 5. MAIN EXPORT – the whole machine in one call
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// EXAMPLE USAGE (remove or keep for testing)
// ------------------------------------------------------------------
/*
(async () => {
  // Set your Cerebras key in localStorage (browser) or env variable before calling
  const result = await findBestVideo('Mr Beast');
  console.log('Best video:', result);
})();
*/
