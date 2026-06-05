// src/services/aiQueryExpander.ts

export async function identifyRelevantTopic(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  if (!cerebrasKey) {
    console.error("AI Expansion Error: Missing 'niche_radar_cerebras_key' in localStorage.");
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
        model: 'gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: `You are the Niche-Radar AI Engine. Follow this exact flow:
            
            1. IDENTIFY THE USER'S WORD AND RELEVANT WORDS THAT ARE CURRENTLY HOT ON YOUTUBE.
            2. FORMAT FOR THE SCRAPER (Output ONLY the final combined search string).
            3. PREPARE FOR RESULTS (No quotes, no punctuation, no conversational filler).` 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.5,
        max_tokens: 40
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API fail: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    const rawContent = data.choices?.[0]?.message?.content || '';
    const refined = rawContent.trim().replace(/^["'`]|["'`\.]+$/g, '');
    
    // Safety net to prevent UI crash
    if (refined.toLowerCase() === query.toLowerCase()) {
      return `${query} trending currently`;
    }
    
    return refined || query;
  } catch (e) {
    console.error("AI Expansion Error:", e);
    return query;
  }
}

export async function expandQuery(query: string): Promise<string> {
  return await identifyRelevantTopic(query);
}
