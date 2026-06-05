import { STORAGE_KEY_CEREBRAS } from './credentialsService';

// Only models that actually exist on your account
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
            role: 'user',
            content: `Turn this search term into a longer, specific YouTube search phrase by adding 2‑4 descriptive words. Return ONLY the final phrase.\n\nSearch term: "${query}"`
          }
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

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!key) return query;   // no key → raw query

  for (const model of MODELS) {
    const result = await tryModel(model, query, key);
    if (result) return result;
  }

  // Absolutely no hard‑coded fallback – raw query is honest and YouTube handles it well
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
