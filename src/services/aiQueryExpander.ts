import { STORAGE_KEY_CEREBRAS } from './credentialsService';

export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  const currentYear = new Date().getFullYear();

  if (!cerebrasKey) return query;   // no key → raw query (YouTube is good enough)

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
            content:
              `You are a YouTube SEO expert. Follow these steps internally before giving your answer:
1. Identify the user’s search INTENT (news, entertainment, education, review, documentary, etc.).
2. Based on that intent, think of 2‑3 HIGH‑TRAFFIC YouTube modifiers (like "${currentYear}", "explained", "top 10", "full episode", "official", etc.). Do NOT force a year unless it makes sense for the intent.
3. Combine the original query with those modifiers into ONE concise, natural‑sounding search phrase that real people would type into YouTube.

Then output ONLY that final phrase. No extra text, no quotes, no explanation.`
          },
          { role: 'user', content: query }
        ],
        temperature: 0.7,    // high enough to be creative, low enough to stay on topic
        max_tokens: 50,
      }),
    });

    const data = await res.json();
    const expanded = data.choices?.[0]?.message?.content?.trim();

    // If the AI still returned the input verbatim (very unlikely now), fall back to the raw query.
    // No hard‑coded keywords – just trust YouTube’s own algorithm.
    if (!expanded || expanded.toLowerCase() === query.toLowerCase()) {
      return query;
    }

    return expanded;
  } catch {
    return query;   // if API fails, raw query is fine
  }
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
