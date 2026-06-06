import { type ExtractedVideo } from './youtubeScraper';

export interface GeminiScriptResponse {
  script: string;
}

export interface GeminiThumbnailResponse {
  prompt: string;
}

export interface GeneratorError {
  code: string;
  message: string;
}

function getStoredGeminiKey(): string | null {
  return localStorage.getItem('niche-radar-gemini-key');
}

// Gemini's free tier frequently returns 503 (overloaded). Retry a few times
// with exponential backoff before giving up.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, init);
    // 503/500/429 are transient — wait and retry.
    if (response.ok || ![500, 502, 503, 429].includes(response.status)) {
      return response;
    }
    lastResponse = response;
    if (attempt < retries) {
      const delay = 600 * Math.pow(2, attempt) + Math.random() * 300; // 0.6s, 1.2s, 2.4s
      console.warn(`[Gemini] ${response.status} — retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return lastResponse as Response;
}

export async function generateScriptPrompt(video: ExtractedVideo): Promise<GeminiScriptResponse | GeneratorError> {
  const apiKey = getStoredGeminiKey();

  if (!apiKey) {
    return {
      code: 'NO_GEMINI_KEY',
      message: 'Gemini API key not configured. Please add your key in App Settings.',
    };
  }

  const userPrompt = `You are an expert YouTube scriptwriter. Analyze this successful video, extract its RETENTION BLUEPRINT (hook strategy, pacing pattern, emotional beats, information density), then write a COMPLETELY NEW original script on the SAME TOPIC using that same blueprint.

DO NOT transcribe or copy the original. The original is only a reference for what retention techniques work. Create fresh, original narration that would achieve similar viewer retention and engagement.

VIDEO DATA:
- Title: ${video.title}
- Channel: ${video.channel_name}
- Views: ${video.view_count}
- Upload Date: ${video.upload_date}
- Duration: ${video.duration}
- Description: ${video.description}

OUTPUT A FULL ORIGINAL SCRIPT WITH ALL OF THESE SECTIONS. WRITE REAL NARRATION TEXT FOR EVERY SECTION:

1. RETENTION BLUEPRINT ANALYSIS (3-4 sentences)
What made THIS video work? Identify the hook technique, pacing rhythm, emotional curve, and information delivery pattern that drove ${video.view_count} views. This is the formula you will apply to the new script.

2. TARGET AUDIENCE & TONE (2-3 sentences)
Who is this for? What emotional energy should the creator use? Match the original's energy.

3. THE HOOK (First 5-15 seconds)
Write COMPLETELY ORIGINAL opening lines using the SAME hook technique as the original. Start with a bold claim, shocking stat, provocative question, or cliffhanger. Include notes like [B-ROLL: action shot] or [TEXT ON SCREEN: "$1M mistake"]. This must grab attention instantly.

4. INTRO & VALUE PROPOSITION (0:15-1:00)
Introduce the topic with fresh framing. Answer "Why should the viewer care RIGHT NOW?" Build curiosity. Tease what's coming. Write every word.

5. THE BIG REVEAL / MAIN THESIS (1:00-2:00)
Deliver the core message. If the original uses a numbered list format, use the SAME structure but with NEW content. Be hyper-specific — use real names, numbers, dates, statistics, and examples. Write the full narration.

6. KEY POINTS DEEP DIVE (Main body)
For EACH key point, provide:
- A clear section heading
- 3-5 sentences of original narration
- At least one concrete example, case study, or story
- Visual suggestions [in brackets]
Write full narration for every point. Do not skip. Do not summarize.

7. PATTERN INTERRUPT / RETENTION HOOK (Mid-video)
Write a 10-20 second segment that re-engages viewers. Use the SAME pattern interrupt technique as the original but with new words. Reference back to the hook.

8. CLIMAX / STRONGEST POINT
Save the most impressive reveal for near the end. Match the original's emotional peak intensity. Make it quotable.

9. OUTRO & CALL TO ACTION
Write original closing words with a specific CTA. Include what video to watch next and why.

10. PRODUCTION NOTES
B-roll types, text overlays, music style, props, color grading.

11. BONUS: 5 ORIGINAL TITLE VARIATIONS
Different angles: curiosity gap, how-to, listicle, controversial, emotional.

CRITICAL INSTRUCTIONS:
- Do NOT transcribe or copy the original video. Create COMPLETELY NEW original content.
- Extract the STRUCTURAL PATTERN (hook style, pacing, emotional beats) and apply it to fresh narration.
- Every section must contain complete, original narration text. No placeholders.
- Be specific. Use numbers, names, examples. No vague generalizations.
- The final output should fill a ${video.duration} video.
- Do not cut off mid-sentence. Complete every thought fully.`;

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetchWithRetry(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          code: 'INVALID_GEMINI_KEY',
          message: 'Gemini API key is invalid. Please update in App Settings.',
        };
      }
      if (response.status === 429) {
        return {
          code: 'RATE_LIMITED',
          message: 'Gemini API quota exceeded. Try again in a minute, or use an AI Studio key for higher limits.',
        };
      }
      if (response.status === 503 || response.status === 500 || response.status === 502) {
        return {
          code: 'GEMINI_OVERLOADED',
          message: 'Gemini is temporarily overloaded (503). Please click Generate again in a few seconds.',
        };
      }
      return {
        code: 'GEMINI_API_ERROR',
        message: `Gemini API error: ${response.statusText}`,
      };
    }

    const data: any = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return {
        code: 'NO_RESPONSE',
        message: 'Gemini API returned no response.',
      };
    }

    const scriptText = data.candidates[0]?.content?.parts?.[0]?.text || '';

    if (!scriptText) {
      return {
        code: 'EMPTY_RESPONSE',
        message: 'Gemini generated an empty script prompt.',
      };
    }

    return {
      script: scriptText,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate script prompt';

    return {
      code: 'FETCH_ERROR',
      message: errorMessage,
    };
  }
}

export interface ChannelStyleHint {
  titles?: string[];
  thumbnails?: string[];
}

export async function generateThumbnailPrompt(
  video: ExtractedVideo,
  channelStyle?: ChannelStyleHint,
): Promise<GeminiThumbnailResponse | GeneratorError> {
  const apiKey = getStoredGeminiKey();

  if (!apiKey) {
    return {
      code: 'NO_GEMINI_KEY',
      message: 'Gemini API key not configured. Please add your key in App Settings.',
    };
  }

  // Build a "channel style" block if we scraped the channel's recent videos.
  let styleBlock = '';
  const titles = (channelStyle?.titles ?? []).filter(Boolean).slice(0, 10);
  if (titles.length > 0) {
    styleBlock =
      `\n\nCHANNEL STYLE REFERENCE (match this creator's branding & tone):\n` +
      `Recent video titles from this channel:\n- ` +
      titles.join('\n- ') +
      `\n\nStudy the title patterns above (capitalization, length, emoji use, numbers, ` +
      `emotional words, punctuation). Your typography text and overall tone MUST feel ` +
      `consistent with this channel's existing style so the new thumbnails look like they ` +
      `belong to the same brand.`;
  }

  const userPrompt = `You are a world-class YouTube thumbnail strategist and AI image-prompt engineer who has studied thousands of high-CTR thumbnails (MrBeast, Veritasium, MKBHD style). Analyze this video, then design 3 ORIGINAL, scroll-stopping thumbnail concepts with ready-to-use Midjourney prompts that are HIGHLY SPECIFIC to this video's topic.

VIDEO DATA:
Title: ${video.title}
Channel: ${video.channel_name}
Views: ${video.view_count}
Description: ${video.description}${styleBlock}

THUMBNAIL PSYCHOLOGY — apply these proven CTR principles to every concept:
- CURIOSITY GAP: imply a question or "what happens next?" the viewer must click to resolve.
- EMOTION: a clear emotional hook (shock, awe, tension, desire, transformation).
- ONE CLEAR FOCAL POINT: a single dominant subject, not a busy scene.
- HIGH CONTRAST & COLOR POP: bright/complementary colors against a darker or blurred background so it stands out in the feed.
- MOBILE-FIRST: readable at tiny size; max 3-5 BIG words of text; bold heavy font with outline/glow.
- DEPTH: foreground subject sharp, background slightly blurred (shallow depth of field) for a 3D pop.
- RULE OF THIRDS: subject offset, leaving negative space for the text.

CRITICAL RULES:
1. NO generic gamer faces or cliché reactions. The main subject MUST be a specific character, object, or environment directly tied to THIS video's actual topic.
2. ALWAYS include typography: exact text in quotes (e.g., "TEXT HERE") + a vivid font description.
3. Each of the 3 concepts must use a DIFFERENT strategy (e.g., one Transformation/Before-After, one Mystery/Curiosity, one Bold-Claim/Number).
4. Midjourney prompts must be richly descriptive: subject, action/expression, lighting, color palette, mood, camera/lens, and end with the exact technical flags.

OUTPUT EXACTLY THIS FORMAT:

THUMBNAIL CONCEPT 1 - [Strategy name]
Main Subject: [Specific, topic-relevant subject + expression/action]
Typography Text: ["Short punchy 3-5 word phrase"]
Typography Style: [Bold font + color + effect, e.g. heavy condensed sans-serif, bright yellow with thick black outline and subtle glow]
Color Palette: [2-3 dominant colors that create contrast]
Composition: [Focal placement, depth, background treatment]
Midjourney prompt: [Detailed subject], [background], [lighting & color], [mood], shallow depth of field, dramatic studio lighting, ultra-detailed, high contrast, typography "TEXT" in [style], --ar 16:9 --style raw --v 6.1
Why this works for CTR: [2 sentences referencing the psychology above]
Best for: [target viewer]

THUMBNAIL CONCEPT 2 - [Different strategy]
Main Subject: [...]
Typography Text: ["..."]
Typography Style: [...]
Color Palette: [...]
Composition: [...]
Midjourney prompt: [...] --ar 16:9 --style raw --v 6.1
Why this works for CTR: [...]
Best for: [...]

THUMBNAIL CONCEPT 3 - [Different strategy]
Main Subject: [...]
Typography Text: ["..."]
Typography Style: [...]
Color Palette: [...]
Composition: [...]
Midjourney prompt: [...] --ar 16:9 --style raw --v 6.1
Why this works for CTR: [...]
Best for: [...]`;

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: userPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetchWithRetry(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          code: 'INVALID_GEMINI_KEY',
          message: 'Gemini API key is invalid. Please update in App Settings.',
        };
      }
      if (response.status === 429) {
        return {
          code: 'RATE_LIMITED',
          message: 'Gemini API quota exceeded. Try again in a minute, or use an AI Studio key for higher limits.',
        };
      }
      if (response.status === 503 || response.status === 500 || response.status === 502) {
        return {
          code: 'GEMINI_OVERLOADED',
          message: 'Gemini is temporarily overloaded (503). Please click Generate again in a few seconds.',
        };
      }
      return {
        code: 'GEMINI_API_ERROR',
        message: `Gemini API error: ${response.statusText}`,
      };
    }

    const data: any = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return {
        code: 'NO_RESPONSE',
        message: 'Gemini API returned no response.',
      };
    }

    const promptText = data.candidates[0]?.content?.parts?.[0]?.text || '';

    if (!promptText) {
      return {
        code: 'EMPTY_RESPONSE',
        message: 'Gemini generated an empty thumbnail prompt.',
      };
    }

    return {
      prompt: promptText,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate thumbnail prompt';

    return {
      code: 'FETCH_ERROR',
      message: errorMessage,
    };
  }
}

export function isGeneratorError(result: GeminiScriptResponse | GeminiThumbnailResponse | GeneratorError): result is GeneratorError {
  return 'code' in result && 'message' in result && !('script' in result) && !('prompt' in result);
}
