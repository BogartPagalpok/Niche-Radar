(async function debugAllModels() {
  const query = prompt("Enter test query:", "GAMEBOY");
  if (!query) return;

  const key = localStorage.getItem('niche_radar_cerebras_key');
  if (!key) { console.warn('❌ No Cerebras key found in localStorage'); return; }

  const models = [
    'llama3.1-8b',
    'zai-glm-4.7',
    'gpt-oss-120b',
    'qwen-3-235b-a22b-instruct-2507',
  ];

  console.log(`🧪 Testing all models for query: "${query}"\n`);

  for (const model of models) {
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: "Turn the user's short search term into a longer, natural YouTube search phrase. Add a few descriptive words that fit the topic. Return ONLY the phrase."
            },
            { role: 'user', content: query }
          ],
          temperature: 0.6,
          max_tokens: 30,
        }),
      });

      const status = res.status;
      const data = await res.json();
      const output = data.choices?.[0]?.message?.content?.trim();

      if (status === 200 && output && output.toLowerCase() !== query.toLowerCase()) {
        console.log(`%c✅ ${model}:%c "${output}"`, 'color: green; font-weight: bold', 'color: inherit');
      } else if (status === 200 && (!output || output.toLowerCase() === query.toLowerCase())) {
        console.warn(`⚠️  ${model}: empty or echoed (raw: "${output}")`);
      } else if (status === 429) {
        console.warn(`⏳ ${model}: rate limited (429)`);
      } else {
        console.error(`❌ ${model}: HTTP ${status} – ${JSON.stringify(data)}`);
      }
    } catch (e) {
      console.error(`💥 ${model}: network error – ${e.message}`);
    }
  }
})();
