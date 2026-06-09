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
        'Identify the source medium first using only what is visible in the reference images. ' +
        'Do not infer the style from the topic, title, genre, or your own defaults. ' +
        'If a style trait is not visible, say "not visible" instead of inventing it. ' +
        'Return a DETAILED SOURCE STYLE DNA CARD, not a generic paragraph. Be specific enough that another image model can clone the visual grammar. ' +
        'Use this exact structure:\n' +
        'SOURCE MEDIUM: [observed medium/art style from the image]\n' +
        'ART DIRECTION: [overall look, era, polish level, whether simple or detailed]\n' +
        'LINEWORK: [outline thickness, sketchiness, edge sharpness, stroke style]\n' +
        'SHAPES & CHARACTER DESIGN: [head/body proportions, facial features, eyes, mouth, expressions, anatomy simplification]\n' +
        'COLOR PALETTE: [dominant colors, approximate hex codes if possible, saturation, contrast]\n' +
        'LIGHTING/SHADING: [flat colors, cel shading, gradients, realistic light, shadows, or no shading]\n' +
        'BACKGROUND: [plain/gradient/photo/scene, detail level, texture]\n' +
        'COMPOSITION: [subject placement, cropping, negative space, scale, visual hierarchy]\n' +
        'TYPOGRAPHY: [font category, color, outline, shadow, case, size, placement, how much text]\n' +
        'RECURRING MOTIFS: [props, arrows, charts, maps, faces, icons, etc.]\n' +
        'DO USE: [prompt phrases that preserve the observed style]\n' +
        'DO NOT USE: [prompt phrases/styles that would change or contradict the observed source medium, linework, rendering, palette, typography, or composition]\n' +
        'Do not be vague. Mention exact visual traits visible in the thumbnails and only style negatives that are relevant to the observed source style.',
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
        temperature: 0.2,
        max_tokens: 1200,
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
