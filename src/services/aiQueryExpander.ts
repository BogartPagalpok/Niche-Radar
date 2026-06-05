import { STORAGE_KEY_CEREBRAS } from './credentialsService';

const MODELS = [
  'llama3.1-8b',
  'zai-glm-4.7',
  'gpt-oss-120b',
  'qwen-3-235b-a22b-instruct-2507',
];

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

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);

  if (key) {
    for (const model of MODELS) {
      const result = await tryModel(model, query, key);
      if (result) return result;
    }
  }

  // fallback – raw query (YouTube’s own ranking is excellent)
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
