// Task-aware AI routing. Each task is sent to the provider best suited for it,
// with intelligent fallbacks so a burned/rate-limited key never kills a feature.
//
// Providers "work together" via sequential fallback: try the best option first,
// then the next, until success. 
//
// Gemini is *always* forced to the very end of the fallback line for every task
// (as the ultimate last-resort, even if other keys are missing or rate-limited).
//
// Design rationale:
//  - Cerebras (gpt-oss-120b): blazing-fast inference + strong long-form reasoning.
//        => best for SCRIPTS (long/complex) and SEARCH expansion (needs speed).
//  - GPT-4o (GitHub Models): best creative + visual language, true multimodal.
//        => best for THUMBNAIL prompts (creative) and VISION (seeing images).
//  - Groq (llama-3.3-70b): fast, solid general fallback.
//  - Gemini: always the final fallback (kept even if quota is low).

const STORAGE_KEY_GITHUB = 'niche_radar_github_token';
const STORAGE_KEY_CEREBRAS = 'niche_radar_cerebras_key';
const STORAGE_KEY_GROQ = 'niche_radar_groq_key';
const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';

export type AiTask = 'search' | 'script' | 'thumbnail' | 'general';

export interface TextResult {
  text: string;
  provider: string;
  error?: string;
}

interface GenOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  task?: AiTask;
}

type ProviderName = 'GitHub GPT-4o' | 'Cerebras' | 'Groq' | 'Gemini';

// ---- Individual providers (return text or throw) ----

async function callGitHubGPT4o(o: GenOptions): Promise<string> {
  const token = localStorage.getItem(STORAGE_KEY_GITHUB);
  if (!token) throw new Error('no-key');
  const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        ...(o.system ? [{ role: 'system', content: o.system }] : []),
        { role: 'user', content: o.prompt },
      ],
      temperature: o.temperature ?? 0.7,
      max_tokens: o.maxTokens ?? 2048,
    }),
  });
  if (!res.ok) throw new Error(`github ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('github empty');
  return text;
}

async function callCerebras(o: GenOptions): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_CEREBRAS);
  if (!key) throw new Error('no-key');
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages: [
        ...(o.system ? [{ role: 'system', content: o.system }] : []),
        { role: 'user', content: o.prompt },
      ],
      temperature: o.temperature ?? 0.7,
      max_completion_tokens: o.maxTokens ?? 2048,
      reasoning_effort: o.task === 'script' ? 'medium' : 'low',
    }),
  });
  if (!res.ok) throw new Error(`cerebras ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('cerebras empty');
  return text;
}

async function callGroq(o: GenOptions): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_GROQ);
  if (!key) throw new Error('no-key');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...(o.system ? [{ role: 'system', content: o.system }] : []),
        { role: 'user', content: o.prompt },
      ],
      temperature: o.temperature ?? 0.7,
      max_tokens: o.maxTokens ?? 2048,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('groq empty');
  return text;
}

async function callGemini(o: GenOptions): Promise<string> {
  const key = localStorage.getItem(STORAGE_KEY_GEMINI);
  if (!key) throw new Error('no-key');
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const res = await fetch(`${url}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: (o.system ? o.system + '\n\n' : '') + o.prompt }] }],
      generationConfig: { temperature: o.temperature ?? 0.7, maxOutputTokens: o.maxTokens ?? 2048 },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('gemini empty');
  return text;
}

const PROVIDERS: Record<ProviderName, (o: GenOptions) => Promise<string>> = {
  'GitHub GPT-4o': callGitHubGPT4o,
  Cerebras: callCerebras,
  Groq: callGroq,
  Gemini: callGemini,
};

// ---- Task → best-fit provider order ----
// Design: Preferred providers first (fast/quality for the task), then always fall back to Gemini as the ultimate last-resort.
// This guarantees Gemini is *always* at the end of the fallback line for every task.
// Providers "work together" via sequential fallback: we try the best option first, then the next, until one succeeds or we exhaust the list.
const BASE_CHAINS: Record<AiTask, ProviderName[]> = {
  // Short + needs speed → Cerebras first.
  search: ['Cerebras', 'Groq'],
  // Long-form complex reasoning → Cerebras 120B first, GPT-4o as quality backup.
  script: ['Cerebras', 'GitHub GPT-4o', 'Groq'],
  // Creative visual language → GPT-4o first.
  thumbnail: ['GitHub GPT-4o', 'Cerebras', 'Groq'],
  // Generic default.
  general: ['Cerebras', 'GitHub GPT-4o', 'Groq'],
};

// Always append Gemini as the final fallback for reliability.
const TASK_CHAINS: Record<AiTask, ProviderName[]> = Object.fromEntries(
  Object.entries(BASE_CHAINS).map(([task, chain]) => {
    const withoutGemini = chain.filter(p => p !== 'Gemini');
    return [task, [...withoutGemini, 'Gemini']];
  })
) as Record<AiTask, ProviderName[]>;

export async function generateText(o: GenOptions): Promise<TextResult> {
  const task = o.task ?? 'general';
  const chain = TASK_CHAINS[task];
  const errors: string[] = [];

  for (const name of chain) {
    try {
      const text = await PROVIDERS[name]({ ...o, task });
      console.log(`[AI:${task}] ✅ via ${name}`);
      return { text, provider: name };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'no-key') {
        console.warn(`[AI:${task}] ${name} failed: ${msg}`);
        errors.push(`${name}: ${msg}`);
      }
    }
  }

  return {
    text: '',
    provider: 'none',
    error:
      errors.length > 0
        ? `All providers failed for ${task} — ${errors.join(' | ')}`
        : `No AI key configured for ${task}. Add a Cerebras / GitHub / Groq / Gemini key in Settings.`,
  };
}
