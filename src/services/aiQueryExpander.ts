export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  
  if (!cerebrasKey) {
    console.warn("Cerebras API key not found.");
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
        // UPDATED: Using the production model found in {62B3D6F8-299A-48C2-A452-D6855FE5F909}.png
        model: 'gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are a search query optimizer. Output ONLY a concise, technical, niche-optimized YouTube search string. No extra text.' 
          },
          { role: 'user', content: query }
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
    return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    
  } catch (e) {
    console.error("AI Expansion Error:", e);
    return query;
  }
}
