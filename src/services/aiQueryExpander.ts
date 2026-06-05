import { STORAGE_KEY_CEREBRAS } from './credentialsService';

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
            content: `Turn the user's short search term into a longer, natural YouTube search phrase. Add a few descriptive words that fit the topic. Return ONLY the phrase.`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.6,
        max_tokens: 30,
      }),
    });
    const data = await res.json();
    const expanded = data.choices?.[0]?.message?.content?.trim();
    if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
      return expanded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!key) return query;   // no key → raw query

  // 1. Try the primary model
  let result = await tryModel('gpt-oss-120b', query, key);
  if (result) return result;

  // 2. Primary failed → try the fallback model
  result = await tryModel('zai-glm-4.7', query, key);
  if (result) return result;

  // 3. Both models failed → honest raw query (no garbage)
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
