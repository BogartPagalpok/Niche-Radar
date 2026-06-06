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
              `You are a YouTube niche research expert who finds untapped, high-intent content angles. ` +
              `You understand search intent, sub-niches, and what actually drives views on YouTube.`,
          },
          {
            role: 'user',
            content:
              `A creator wants to research the topic in the tags below. ` +
              `Rewrite it into ONE specific, high-intent YouTube search query that surfaces ` +
              `successful videos in a focused SUB-NICHE of this topic.\n\n` +
              `RULES:\n` +
              `- DO NOT just append generic filler words like "review", "tutorial", "guide", "explained", "tips", or "${new Date().getFullYear()}".\n` +
              `- DO narrow into a concrete angle, format, audience, or use-case (e.g. a specific problem, comparison, or scenario).\n` +
              `- Keep it natural — something a real person would type into YouTube search.\n` +
              `- 3 to 7 words. Return ONLY the query, no quotes, no explanation.\n\n` +
              `Examples:\n` +
              `"camera" -> "best budget camera for filmmaking"\n` +
              `"coffee" -> "espresso machine mistakes beginners make"\n` +
              `"investing" -> "dividend investing for passive income"\n\n` +
              `<query>${query}</query>`,
          },
        ],
        temperature: 0.6,            // a bit more creative so it finds real sub-niches, not generic padding
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
