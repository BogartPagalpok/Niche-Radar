// Vision analysis of real thumbnails using GPT-4o via GitHub Models (the key
// you already store). Produces a concrete style description that makes generated
// thumbnail prompts match the actual video/channel look instead of generic art.

const STORAGE_KEY_GITHUB = 'niche_radar_github_token';

export interface ThumbnailVisionResult {
  styleAnalysis: string;
  error?: string;
}

/**
 * Send the video's own thumbnail + a few channel thumbnails to GPT-4o and ask
 * it to describe the recurring VISUAL style (composition, colors, faces, text,
 * mood). The result is injected into the thumbnail-prompt generator.
 */
export async function analyzeThumbnailStyle(
  videoThumbnailUrl: string,
  channelThumbnailUrls: string[] = [],
): Promise<ThumbnailVisionResult> {
  const token = localStorage.getItem(STORAGE_KEY_GITHUB);
  if (!token) {
    return { styleAnalysis: '', error: 'No GitHub (GPT-4o vision) token configured.' };
  }

  // Collect up to 4 images: the source thumbnail first, then channel samples.
  const images = [videoThumbnailUrl, ...channelThumbnailUrls]
    .filter(Boolean)
    .slice(0, 4);
  if (images.length === 0) {
    return { styleAnalysis: '', error: 'No thumbnail images to analyze.' };
  }

  const content: any[] = [
    {
      type: 'text',
      text:
        'You are a YouTube thumbnail VISUAL STYLE FORENSICS analyst. Look at these REAL thumbnails ' +
        '(the first is the target video; the rest are from the same channel). ' +
        'Your job is NOT to make them more cinematic or realistic. Your job is to preserve the exact art direction. ' +
        'Identify the source medium first: photorealistic, 3D render, anime, flat vector, comic strip, simple 2D cartoon, meme collage, etc. ' +
        'If the source is cartoon/comic/flat/vector, explicitly say: DO NOT use photorealism, realistic lighting, 3D render, shallow depth of field, or ultra-detailed faces. ' +
        'Return a reusable STYLE LOCK covering: 1) medium/art style, 2) linework/detail level, 3) color palette & contrast, ' +
        '4) composition/layout & focal point, 5) face/expression style if any, 6) typography style & placement, ' +
        '7) background treatment, 8) motifs, and 9) style-negative words to avoid. ' +
        'Output a concise but strict paragraph an AI image generator can follow to match the source look.',
    },
    ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  try {
    const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content }],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { styleAnalysis: '', error: `Vision API ${res.status}: ${txt.slice(0, 120)}` };
    }

    const data = await res.json();
    const analysis = data.choices?.[0]?.message?.content?.trim() || '';
    return { styleAnalysis: analysis };
  } catch (e) {
    return {
      styleAnalysis: '',
      error: e instanceof Error ? e.message : 'Vision analysis failed.',
    };
  }
}
