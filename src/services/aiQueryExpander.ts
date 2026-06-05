import { STORAGE_KEY_CEREBRAS } from './credentialsService';

export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  const currentYear = new Date().getFullYear();

  // 1. No key → do something useful but minimal (still no hard‑coded year)
  if (!cerebrasKey) {
    // Deterministic, varied fallback – NEVER a year
    const words = ['explained', 'guide', 'overview', 'analysis', 'review', 'insights'];
    const pick = words.reduce((sum, w) => sum + w.charCodeAt(0), 0) + query.length;
    return `${query} ${words[pick % words.length]}`;
  }

  // 2. First attempt – strict prompt
  const makeRequest = async (isRetry: boolean): Promise<string> => {
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
            content: isRetry
              ? `FAILED ATTEMPT – you previously echoed the user input. This is forbidden.
Turn the user's query into a specific, high‑traffic YouTube search phrase.
Use the current year (${currentYear}) ONLY if relevant. Add at least 3 words.
If the topic is very broad, make it concrete (e.g., "best computer builds" instead of "computer").
Output ONLY the phrase. No quotes.`
              : `You are a YouTube SEO engine. The user's query is exactly what they typed.
Your job: produce a longer, more specific search phrase that people actually type into YouTube.
- If the query is a single generic word, add context (e.g., "best", "how to", "news", "review").
- Use the current year (${currentYear}) only if it makes sense for the topic.
- NEVER echo the original word alone. Always add at least 2 extra words.
- Output ONLY the final phrase. No quotes.`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.9,
        max_tokens: 40,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  };

  // 3. First try
  try {
    let result = await makeRequest(false);
    if (result && result.toLowerCase() !== query.toLowerCase() && result.split(' ').length > 1) {
      return result;
    }
    // 4. Retry with harsher instruction
    result = await makeRequest(true);
    if (result && result.toLowerCase() !== query.toLowerCase()) {
      return result;
    }
  } catch {}

  // 5. Absolute last resort – but still not a year
  const fallbacks = ['explained', 'guide', 'overview', 'analysis', 'review', 'insights'];
  const idx = query.length % fallbacks.length;
  return `${query} ${fallbacks[idx]}`;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
