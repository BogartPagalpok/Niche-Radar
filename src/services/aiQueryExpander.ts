// src/services/aiQueryExpander.ts

export async function identifyRelevantTopic(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  if (!cerebrasKey) return query;

  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: `You are the Niche-Radar SEO Engine. 
            
            YOUR ONLY JOB: Append 3-4 high-traffic, specific YouTube keywords to the user's input.
            
            CRITICAL RULES:
            1. DO NOT return the original input word alone. If the input is "AI", you MUST return something like "AI tools for productivity 2026".
            2. If you return only the input word, you have failed.
            3. No conversational filler, no quotes, no punctuation.` 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.9, // Higher randomness to force creative expansion
        max_tokens: 50
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || query;

    // Hard verification: If it's still echoing the input, manually force a high-value expansion
    if (result.toLowerCase() === query.toLowerCase()) {
      return `${query} trending best 2026`;
    }
    
    return result;
  } catch (e) {
    return `${query} trending`;
  }
}

export async function expandQuery(query: string): Promise<string> {
  return await identifyRelevantTopic(query);
}
