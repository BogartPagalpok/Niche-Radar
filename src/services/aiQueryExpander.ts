export async function expandQuery(query: string): Promise<string> {
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
        // Try the preview model if the production model is overwhelmed
        model: 'zai-glm-4.7', 
        messages: [
          { role: 'system', content: 'You are a search query optimizer. Return ONLY a concise, technical YouTube search string.' },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    // If 429, just return query immediately without waiting
    if (response.status === 429) {
      console.warn("Cerebras busy, using raw query.");
      return query;
    }

    if (!response.ok) throw new Error(`API Status ${response.status}`);
    
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
  } catch (e) {
    return query;
  }
}
