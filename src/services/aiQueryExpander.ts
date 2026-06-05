export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  
  if (!cerebrasKey) {
    console.warn("No API key. Skipping expansion.");
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
        model: 'llama3-8b',
        messages: [
          { 
            role: 'system', 
            content: 'You are a search query optimizer. Output ONLY a concise, SEO-friendly search string for YouTube based on the user topic. Do not include quotes or conversational filler.' 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.5,
        max_tokens: 30
      })
    });

    if (!response.ok) throw new Error(`API returned ${response.status}`);
    
    const data = await response.json();
    const expanded = data.choices[0].message.content.trim();
    
    // Safety check to ensure we didn't get an empty or error string
    return expanded && expanded.length > 3 ? expanded : query;
    
  } catch (e) {
    console.error("AI Expansion Error:", e);
    return query; // Silent fallback
  }
}
