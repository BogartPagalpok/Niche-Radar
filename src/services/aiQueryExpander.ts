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
            content: `You are the Niche-Radar AI Engine. Follow this exact 3-step workflow:
            
            Step 1: Analyze the user input to identify the specific niche, industry, or target audience.
            Step 2: Formulate a highly targeted, high-converting YouTube search query based on that exact niche.
            Step 3: Output ONLY the final formulated search query to be fed directly into the YouTube scraper.
            
            CRITICAL CONSTRAINTS:
            - Do NOT output your reasoning or the text for Step 1 and Step 2.
            - Do NOT wrap the final result in quotes, brackets, or punctuation.
            - Output absolutely nothing except the final search string.` 
          },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        max_tokens: 40
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API fail: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const refined = data.choices[0].message.content.trim().replace(/^["'`]|["'`\.]+$/g, '');
    
    return refined || query;
  } catch (e) {
    console.error("AI Expansion Error:", e);
    return query;
  }
}

export async function expandQuery(query: string): Promise<string> {
  return await identifyRelevantTopic(query);
}
