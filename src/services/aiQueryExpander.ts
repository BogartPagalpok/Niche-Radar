/**
 * src/services/aiQueryExpander.ts
 * 
 * This service takes a raw user search query and uses the Cerebras API 
 * to expand it into a more detailed, niche-specific search string.
 */

export async function expandQuery(query: string): Promise<string> {
  // Retrieve the key you saved in the App Settings UI
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  
  // If no key is configured, return the original query to avoid breaking the search
  if (!cerebrasKey) {
    console.warn("Cerebras API key not found in localStorage. Skipping query expansion.");
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
        model: 'llama3-8b', // Adjust model name if needed based on your plan
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional YouTube research assistant. Expand the user search query into a highly descriptive, niche-optimized search string. Return ONLY the final expanded query string, nothing else.' 
          },
          { 
            role: 'user', 
            content: `Expand this YouTube search query: "${query}"` 
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      throw new Error(`Cerebras API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const expanded = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    
    return expanded;
  } catch (error) {
    console.error("AI Query Expansion failed, falling back to raw query:", error);
    return query;
  }
}
