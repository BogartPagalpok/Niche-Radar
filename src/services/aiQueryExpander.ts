import { STORAGE_KEY_CEREBRAS } from './credentialsService';

export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!cerebrasKey) return query;

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
            content: `Rewrite this search into a longer YouTube phrase:`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.8,
        max_tokens: 25,
        stop: ["\n"]
      }),
    });
    const data = await res.json();
    const expanded = data.choices?.[0]?.message?.content?.trim();

    if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
      return expanded;
    }
  } catch {}

  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
