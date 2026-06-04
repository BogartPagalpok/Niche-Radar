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

    const response = await fetch(`${url}?key=${apiKey}`, {
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

export async function generateThumbnailPrompt(video: ExtractedVideo): Promise<GeminiThumbnailResponse | GeneratorError> {
  const apiKey = getStoredGeminiKey();

  if (!apiKey) {
    return {
      code: 'NO_GEMINI_KEY',
      message: 'Gemini API key not configured. Please add your key in App Settings.',
    };
  }

  const userPrompt = `You are an expert YouTube thumbnail designer and AI image prompt engineer. Analyze this video's thumbnail strategy, then create 3 ORIGINAL Midjourney prompts for NEW thumbnails that would achieve similar or better CTR.

VIDEO DATA:
Title: ${video.title}
Channel: ${video.channel_name}
Views: ${video.view_count}
Description: ${video.description}

OUTPUT 3 ORIGINAL THUMBNAIL CONCEPTS:

THUMBNAIL CONCEPT 1 - FACIAL REACTION / EMOTION
Style: Close-up expressive face, strong emotion (shock, excitement, fear, amazement)
Midjourney prompt: [write the complete prompt]
Why this works for CTR: [2 sentences]
Best for: [what type of viewer this attracts]

THUMBNAIL CONCEPT 2 - COMPARISON / BEFORE-AFTER
Style: Split screen or side-by-side showing contrast
Midjourney prompt: [write the complete prompt]
Why this works for CTR: [2 sentences]
Best for: [what type of viewer this attracts]

THUMBNAIL CONCEPT 3 - CURIOSITY GAP / MYSTERY
Style: Something partially hidden, unusual, or unexplained that makes you need to click
Midjourney prompt: [write the complete prompt]
Why this works for CTR: [2 sentences]
Best for: [what type of viewer this attracts]

Include in every Midjourney prompt: --ar 16:9 --style raw --v 6.1

Make prompts specific. Include: subject description, expression, lighting, colors, background, camera angle, mood. Do not include text in the image prompts — text overlays are added in post-production.`;

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

    const response = await fetch(`${url}?key=${apiKey}`, {
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
