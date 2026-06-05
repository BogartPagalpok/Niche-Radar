export async function identifyRelevantTopic(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  if (!cerebrasKey) return query;

  try {
    const response = await fetch('https://cerebras.ai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Keeping your valid organization model
        model: 'gpt-oss-120b', 
        messages: [
          { 
            role: 'system', 
            content: `You are a Niche Analysis Engine. 
            Input: A user search term.
            Task: Identify the most relevant, high-intent technical or educational topic associated with this term.
            Output: ONLY the refined search topic. Do not wrap in markdown, quotes, or punctuation.
            Constraints: 
            - No "workflow", "tutorial", or filler phrases.
            - Do not echo the input if it is too broad.
            - Focus on the specific core subject matter (e.g., Input 'AI' -> Output 'agentic LLM architecture').` 
          },
          { role: 'user', content: query }
        ],
        // Lower temperature ensures deterministic extraction
        temperature: 0.2, 
        max_tokens: 30
      })
    });

    if (!response.ok) throw new Error("API fail");
    
    const data = await response.json();
    
    // Fixed: Added back the missing [0] array index wrapper
    const rawContent = data.choices[0].message.content;
    
    // Sanitizes any potential trailing punctuation or wrapper quotes
    const refinedOutput = rawContent.trim().replace(/^["'`]|["'`\.]+$/g, '');
    
    return refinedOutput || query;

  } catch (e) {
    return query; // Fallback to raw query if Analysis Engine fails
  }
}
