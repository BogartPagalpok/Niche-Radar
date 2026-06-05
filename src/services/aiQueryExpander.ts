import { STORAGE_KEY_CEREBRAS } from './credentialsService';

const MODELS = [
  'llama3.1-8b',
  'zai-glm-4.7',
  'gpt-oss-120b',
  'qwen-3-235b-a22b-instruct-2507',
];

async function tryModel(model: string, query: string, key: string, retries = 1): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
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
              content: `Turn the user's short search term into a longer, natural YouTube search phrase. Add a few descriptive words that fit the topic. Return ONLY the phrase.`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.6,
          max_tokens: 30,
        }),
      });

      // Handle rate limiting
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 2000;
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) break;  // other errors – skip this model

      const data = await res.json();
      const expanded = data.choices?.[0]?.message?.content?.trim();
      if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
        return expanded;
      }
      break;  // empty/echoed – no point retrying same model
    } catch {
      if (attempt < retries) await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!key) return query;

  for (const model of MODELS) {
    const result = await tryModel(model, query, key);
    if (result) return result;
  }

  // Every model failed or echoed – honest raw query (YouTube is good at raw queries)
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
