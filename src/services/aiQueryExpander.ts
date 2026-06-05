import { STORAGE_KEY_CEREBRAS } from './credentialsService';

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
            content:
              `You are a professional, white-hat corporate digital marketing assistant. ` +
              `Your task is strictly limited to improving semantic visibility and search engine optimization. ` +
              `You must adhere strictly to YouTube Terms of Service.`
          },
          {
            role: 'user',
            content:
              `Analyze the search term provided inside the XML tags below. ` +
              `Generate ONE optimized YouTube search phrase by adding 2‑4 relevant, high‑traffic descriptive words. ` +
              `Do not include sensationalized language. ` +
              `Return ONLY the phrase.\n\n` +
              `<query>${query}</query>`
          }
        ],
        temperature: 0.2,   // low temperature keeps the output safe and on‑point
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

  // No hard‑coded words – raw query is better than a template.
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
