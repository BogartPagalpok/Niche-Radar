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
            content: `You are a YouTube search query writer. Turn the user's word(s) into a longer, real-world search phrase that someone would actually type into YouTube. Add 2-4 descriptive words. Output only the phrase.`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.8,
        max_tokens: 30,
      }),
    });
    const data = await res.json();
    const expanded = data.choices?.[0]?.message?.content?.trim();

    // If it's empty, null, or identical to input, just return the original query
    if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
      return expanded;
    }
  } catch {}

  // No hardcoded fallback – raw query is better than nonsense
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
