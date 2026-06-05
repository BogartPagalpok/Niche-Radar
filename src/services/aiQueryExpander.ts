import { STORAGE_KEY_CEREBRAS } from './credentialsService';

async function tryModel(model: string, query: string, key: string, retries = 2): Promise<string | null> {
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

      // If rate limited, wait and retry
      if (res.status === 429) {
        const retryAfter = res.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 2000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // If not OK, skip retries
      if (!res.ok) break;

      const data = await res.json();
      const expanded = data.choices?.[0]?.message?.content?.trim();
      if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
        return expanded;
      }
      // Empty or echoed – no point retrying this model
      break;
    } catch {
      // Network error – retry
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  return null;
}

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!key) return query;   // no key → raw query

  // 1. Primary model
  let result = await tryModel('gpt-oss-120b', query, key);
  if (result) return result;

  // 2. Fallback model
  result = await tryModel('zai-glm-4.7', query, key);
  if (result) return result;

  // 3. Both models unavailable → raw query (never a template)
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
