// src/services/aiQueryExpander.ts

export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  const currentYear = new Date().getFullYear();

  // If Cerebras key exists, try the LLM
  if (cerebrasKey) {
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
                `Expand user query into a YouTube search phrase. ` +
                `Infer intent. Append high-traffic modifiers (e.g., year ${currentYear} if relevant). ` +
                `No tutorial unless asked. Only the phrase, no quotes.`,
            },
            { role: 'user', content: query },
          ],
          temperature: 0.2,
          max_tokens: 30,
        }),
      });
      const data = await res.json();
      const expanded = data.choices?.[0]?.message?.content?.trim();
      if (expanded && expanded.toLowerCase() !== query.toLowerCase()) {
        return expanded;
      }
    } catch {
      // ignore errors, fall through to fallback
    }
  }

  // Fallback: append current year (never a hardcoded word)
  if (query.split(' ').length <= 2) {
    return `${query} ${currentYear}`;
  }
  return query;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
