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

  const userPrompt = `You are an expert YouTube content strategist and scriptwriter. Analyze this video and create a detailed, production-ready script replication prompt that content creators can use to create similar high-performing videos.

Video Title: ${video.title}
Channel: ${video.channel_name}
Views: ${video.view_count}
Upload Date: ${video.upload_date}
Duration: ${video.duration}
Description: ${video.description}

Generate a comprehensive, copyable script prompt that includes:
1. Target audience and tone
2. Hook strategy for the first 5 seconds
3. Core value proposition and key points
4. Pacing and retention techniques
5. Call-to-action strategy
6. Production notes and visual recommendations

Format this as a detailed prompt that another content creator could use to produce a similar video. Be specific and actionable.`;

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
        maxOutputTokens: 1500,
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

  const userPrompt = `You are an expert YouTube thumbnail designer and AI prompt engineer. Analyze this video and reverse-engineer a detailed, word-weighted prompt optimized for image generators like Midjourney, DALL-E, or Stable Diffusion.

Video Title: ${video.title}
Channel: ${video.channel_name}
Views: ${video.view_count}
Description: ${video.description}

Create a comprehensive Midjourney/image generator prompt that captures the visual essence and design principles of a high-performing thumbnail for this content. Include:

1. Main subject/focal point description
2. Color palette and contrast strategy
3. Typography and text overlay strategy
4. Composition and layout principles
5. Emotional tone and viewer psychology
6. Technical rendering details

Format as a single, detailed prompt that could be directly used with Midjourney or similar tools. Include specific artistic terms, style references, and technical parameters. Optimize for viewer attention and click-through rate.`;

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
        maxOutputTokens: 1200,
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
