export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  
  if (!cerebrasKey) {
    console.warn("Cerebras API key not found. Skipping expansion.");
    return query;
  }

  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Verified model name for Cerebras API
        model: 'llama-3.1-8b',
        messages: [
          { 
            role: 'system', 
            content: 'You are a search query optimizer for Niche Radar. Transform the user query into a hyper-specific, SEO-optimized YouTube search string. Return ONLY the search string.' 
          },
          { 
            role: 'user', 
            content: `Optimize this for YouTube: "${query}"` 
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const expanded = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    
    return expanded.length > 3 ? expanded : query;
    
  } catch (e) {
    console.error("AI Expansion Error:", e);
    return query; // Fallback
  }
}
