import { STORAGE_KEY_CEREBRAS } from './credentialsService';
import youtubeSearchApi from 'youtube-search-api';

const MODELS = ['gpt-oss-120b', 'zai-glm-4.7'];

async function tryModel(model: string, query: string, key: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Turn the user's search term into a longer YouTube search phrase. Add 2‑4 descriptive words. Return ONLY the phrase.`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 30,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const expanded = data.choices?.[0]?.message?.content?.trim();
    if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
      return expanded;
    }
  } catch {}
  return null;
}

async function getYoutubeSuggestion(query: string): Promise<string | null> {
  try {
    const suggestions = await youtubeSearchApi.getSearchSuggestions(query);
    // youtube-search-api may return an array of strings directly, or an object
    const list = Array.isArray(suggestions) ? suggestions : suggestions?.data;
    if (list && list.length) {
      // pick the longest, most specific suggestion
      return list.reduce((a: string, b: string) => (a.length > b.length ? a : b));
    }
  } catch {}
  return null;
}

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);

  if (key) {
    // 1. Try both Cerebras models
    for (const model of MODELS) {
      const result = await tryModel(model, query, key);
      if (result) return result;
    }
  }

  // 2. Fallback to live YouTube autocomplete (dynamic, no hardcoded words)
  const ytSuggestion = await getYoutubeSuggestion(query);
  if (ytSuggestion && ytSuggestion.toLowerCase() !== query.toLowerCase()) {
    return ytSuggestion;
  }

  // 3. Absolute last resort – raw query (YouTube’s own ranking is excellent)
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
