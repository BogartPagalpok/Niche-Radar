import { STORAGE_KEY_CEREBRAS } from './credentialsService';

const MODELS = ['gpt-oss-120b', 'zai-glm-4.7'];

async function tryModel(model: string, query: string, key: string): Promise<string | null> {
  console.groupCollapsed(`[Cerebras] tryModel("${model}")`);
  try {
    console.log('[Cerebras] Sending request for query:', query);

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
            content:
              `You are a professional, white-hat corporate digital marketing assistant.` +
              `Your task is strictly limited to improving semantic visibility and search engine optimization.` +
              `You must adhere strictly to YouTube Terms of Service.`,
          },
          {
            role: 'user',
            content:
              `Analyze the search term provided inside the XML tags below.` +
              `Generate ONE optimized YouTube search phrase by adding 2-4 relevant, high-traffic descriptive words.` +
              `Do not include sensationalized language.` +
              `Return ONLY the phrase.\n\n` +
              `<query>${query}</query>`,
          },
        ],
        temperature: 0.2,            // low temperature keeps the output safe and on-point
        max_completion_tokens: 150,  // reasoning models need headroom or content comes back empty
        reasoning_effort: 'low',     // keep reasoning short so it doesn't eat the token budget
      }),
    });

    // ---- FAILURE POINT 1: non-2xx HTTP status ----
    if (!res.ok) {
      const errBody = await res.text().catch(() => '<could not read body>');
      console.error(
        `[Cerebras] ❌ HTTP ${res.status} ${res.statusText} for model "${model}". Body:`,
        errBody,
      );
      return null;
    }

    // ---- FAILURE POINT 2: response is not valid JSON ----
    let data: any;
    try {
      data = await res.json();
    } catch (jsonErr) {
      console.error(`[Cerebras] ❌ Failed to parse JSON for model "${model}":`, jsonErr);
      return null;
    }

    console.log('[Cerebras] Raw message object:', data?.choices?.[0]?.message);

    // ---- FAILURE POINT 3: no content in the response ----
    let expanded: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    const finishReason = data?.choices?.[0]?.finish_reason;

    if (!expanded) {
      console.error(
        `[Cerebras] ❌ Empty content for model "${model}". finish_reason="${finishReason}". ` +
          `If finish_reason is "length", increase max_completion_tokens / lower reasoning_effort.`,
      );
      return null;
    }

    console.log('[Cerebras] Content before cleanup:', JSON.stringify(expanded));

    // Clean out wrapping quotes, terminal punctuation, or markdown syntax
    // that bypasses the echo check while acting like an unexpanded query
    expanded = expanded
      .replace(/["'.`!]/g, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .trim();

    console.log('[Cerebras] Content after cleanup:', JSON.stringify(expanded));

    // ---- FAILURE POINT 4: result echoes the query / isn't longer ----
    const isEcho = expanded.toLowerCase() === query.toLowerCase();
    const isLonger = expanded.length > query.length;

    if (isEcho) {
      console.warn(`[Cerebras] ⚠️ Rejected: model "${model}" echoed the original query.`);
      return null;
    }
    if (!isLonger) {
      console.warn(
        `[Cerebras] ⚠️ Rejected: result for "${model}" is not longer than the query ` +
          `(result=${expanded.length} chars, query=${query.length} chars).`,
      );
      return null;
    }

    console.log(`[Cerebras] ✅ Success with model "${model}":`, expanded);
    return expanded;
  } catch (networkErr) {
    // ---- FAILURE POINT 5: network / CORS / fetch threw ----
    console.error(
      `[Cerebras] ❌ Request threw for model "${model}" (network error, CORS block, or aborted):`,
      networkErr,
    );
    return null;
  } finally {
    console.groupEnd();
  }
}

export async function expandQuery(query: string): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);

  // ---- FAILURE POINT 0: no API key stored ----
  if (!key) {
    console.error(
      `[Cerebras] ❌ No API key found in localStorage under "${STORAGE_KEY_CEREBRAS}". ` +
        `Returning raw query. Save your csk-... key to that key.`,
    );
    return query;
  }

  for (const model of MODELS) {
    const result = await tryModel(model, query, key);
    if (result) return result;
  }

  // If both models echo or fail, use a dynamic code-driven fallback
  // without hardcoding static years or static strings
  const currentYear = new Date().getFullYear();
  const fallback = `${query} overview ${currentYear}`;
  console.warn(
    `[Cerebras] ⚠️ All models failed/echoed. Using dynamic fallback:`,
    fallback,
  );
  return fallback;
}

export async function identifyRelevantTopic(query: string): Promise<string> {
  return expandQuery(query);
}
