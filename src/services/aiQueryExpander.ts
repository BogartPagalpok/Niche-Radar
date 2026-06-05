export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  
  if (!cerebrasKey) {
    console.warn("No API key found.");
    return query;
  }

  const fetchWithRetry = async (retries = 2): Promise<string> => {
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
              content: 'You are a search optimizer. Return ONLY a technical, niche-optimized YouTube search string. You MUST modify the query. If the user input is simple (e.g. "AI"), return a complex, multi-word search string like "AI machine learning tutorial 2026 deep dive". Never return the original input.' 
            },
            { role: 'user', content: query }
          ],
          temperature: 0.8,
          max_tokens: 50
        })
      });

      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchWithRetry(retries - 1);
      }

      if (!response.ok) throw new Error(`API Status ${response.status}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

      // Force change: if AI echoes input, force append
      return (content.toLowerCase() === query.toLowerCase()) 
        ? `${query} deep dive tutorial 2026` 
        : content;
      
    } catch (e) {
      if (retries > 0) return fetchWithRetry(retries - 1);
      throw e;
    }
  };

  try {
    return await fetchWithRetry();
  } catch (err) {
    console.error("AI Expansion failed, forcing modification.");
    return `${query} deep dive tutorial 2026`;
  }
}
