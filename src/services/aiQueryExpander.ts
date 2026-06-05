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
            content: `You are a Niche Analysis Engine. 
            Task: Identify the most relevant technical or educational topic associated with the input.
            Output: ONLY the refined search topic. Do not wrap in quotes or punctuation.
            Constraints: No "workflow", "tutorial", or filler. Focus on core subject matter.` 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        max_tokens: 30
      })
    });

    if (!response.ok) throw new Error("API fail");
    
    const data = await response.json();
    const refined = data.choices[0].message.content.trim().replace(/^["'`]|["'`\.]+$/g, '');
    
    return refined || query;
  } catch (e) {
    return query;
  }
}

export async function expandQuery(query: string): Promise<string> {
  return await identifyRelevantTopic(query);
}
