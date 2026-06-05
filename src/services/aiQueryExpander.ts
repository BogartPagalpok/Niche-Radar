export async function expandQuery(query: string): Promise<string> {
  const cerebrasKey = localStorage.getItem('niche_radar_cerebras_key');
  if (!cerebrasKey) return query;

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
              content: `You are a strict YouTube SEO generator. 
              Output format MUST be: [Actionable Context] + [Topic] + [2026].
              Example: "professional workflow and tutorial for [Topic] 2026".
              Do not use conversational filler. Do not repeat the input.` 
            },
            { role: 'user', content: query }
          ],
          temperature: 0.7,
          max_tokens: 60
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        
        // STRICT VALIDATION: If the AI output lacks these, it failed the framework
        const hasYear = content.includes('2026');
        const hasContext = /tutorial|workflow|build|deep dive|case study/i.test(content);
        
        if (hasYear && hasContext && content.length > query.length) {
          return content;
        }
      }
      
      // If we are here, the AI failed to follow the framework or rate-limited
      throw new Error("Framework mismatch");
      
    } catch (e) {
      if (retries > 0) return fetchWithRetry(retries - 1);
      // HARD FORCE: Construct the string if the AI failed to follow instructions
      return `professional workflow and tutorial for ${query} 2026`;
    }
  };

  return await fetchWithRetry();
}
