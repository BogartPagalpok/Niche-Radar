import { type ExtractedVideo } from './youtubeScraper';
import { generateText } from './aiProviders';
import { enrichVideoData, type EnrichedVideo } from './videoEnrichmentService';

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

export async function generateScriptPrompt(video: ExtractedVideo): Promise<GeminiScriptResponse | GeneratorError> {
  // Always enrich with Supadata (transcripts) + Apify (deeper data) when keys are present.
  // This makes the AI output dramatically more accurate and grounded.
  console.log('[Enrichment] generateScriptPrompt calling enrichVideoData for', video.video_id);
  const enriched: EnrichedVideo = await enrichVideoData(video);
  console.log('[Enrichment] generateScriptPrompt received enriched source:', enriched.enrichmentSource || 'none', 'has transcript:', !!enriched.transcriptSummary, 'has fullDesc:', !!enriched.fullDescription);

  const extraContext = [
    enriched.fullDescription ? `FULL DESCRIPTION:\n${enriched.fullDescription}` : '',
    enriched.transcriptSummary ? `TRANSCRIPT SUMMARY (first ~3000 chars):\n${enriched.transcriptSummary}` : '',
    enriched.extraMetadata ? `EXTRA METADATA (from Apify):\n${JSON.stringify(enriched.extraMetadata, null, 2)}` : '',
    enriched.enrichmentSource ? `Data enrichment sources: ${enriched.enrichmentSource}` : '',
  ].filter(Boolean).join('\n\n');

  const userPrompt = `You are an elite YouTube analyst and script strategist who has reverse-engineered hundreds of top-performing videos (especially Dan Martell, MrBeast-style list videos, and high-retention educational content). Your job is to produce the HIGHEST-QUALITY, most USEFUL replication asset possible for a serious content creator.

${extraContext ? `\n\n--- ENRICHED DATA (use this as primary source of truth — it is much more reliable than title alone) ---\n${extraContext}\n--- END ENRICHED DATA ---\n` : ''}

**CRITICAL RULES FOR BEST RESULTS:**
- GROUND EVERYTHING in the actual + enriched video data provided.
- First extract and quote what the video actually contains (tools mentioned in description or transcript, claims, workflow details).
- Then analyze the retention/engagement techniques.
- Finally deliver actionable replication guidance that is 80% faithful to what worked + 20% smart, grounded adaptations.
- NEVER invent fake tool names with made-up case studies. Prefer referencing real tools from the enriched data.
- Be specific, professional, and honest about data limitations.

VIDEO DATA (use this + the enriched data above):
- Title: ${enriched.title}
- Channel: ${enriched.channel_name}
- Views: ${enriched.view_count}
- Upload Date: ${enriched.upload_date}
- Duration: ${enriched.duration}
- Description: ${enriched.fullDescription || enriched.description || 'No description available'}

OUTPUT FORMAT — Use these exact section headers:

## 1. ACCURATE VIDEO EXTRACTION
- Quote the exact title and any tools or offers from description/transcript.
- Summarize the core promise and format.
- List any specific tools, links, or claims found in the enriched data.

## 2. RETENTION BLUEPRINT ANALYSIS (Grounded)
3-5 sentences on what drove the views (hook, pacing, emotional curve, structural pattern).

## 3. TARGET AUDIENCE & TONE

## 4. STRUCTURAL TEMPLATE (Beat-by-Beat)
Detailed timed outline using the actual duration: ${enriched.duration}

## 5. HIGH-QUALITY REPLICATION NARRATION BEATS
Write 2-4 high-quality sample beats per major section with [Visual] and [On-screen text] notes. Include Faithful Adaptation + one Creative Variation for key sections.

## 6. ADVANCED ADAPTATION GUIDANCE

## 7. PRODUCTION & OPTIMIZATION NOTES

## 8. TITLE VARIATIONS (5 strong ones)

CRITICAL QUALITY RULES:
- Prioritize real details from enriched data (transcript/description) over inference.
- Fill every section completely with useful, specific content.`;

  const result = await generateText({
    prompt: userPrompt,
    temperature: 0.55, // Lower temperature for more grounded, less hallucinatory output
    maxTokens: 8192,
    task: 'script',
  });

  if (!result.text) {
    return { code: 'NO_PROVIDER', message: result.error || 'Script generation failed.' };
  }
  return { script: result.text };
}

export interface ChannelStyleHint {
  titles?: string[];
  thumbnails?: string[];
  /** GPT-4o vision description of the real thumbnails (most accurate signal). */
  visionStyle?: string;
}

export async function generateThumbnailPrompt(
  video: ExtractedVideo,
  channelStyle?: ChannelStyleHint,
): Promise<GeminiThumbnailResponse | GeneratorError> {
  // Enrich for better thumbnails too (full description + transcript context helps with visual concepts)
  console.log('[Enrichment] generateThumbnailPrompt calling enrichVideoData for', video.video_id);
  const enriched: EnrichedVideo = await enrichVideoData(video);
  console.log('[Enrichment] generateThumbnailPrompt received enriched source:', enriched.enrichmentSource || 'none');

  // Build a "channel style" block if we scraped the channel's recent videos.
  let styleBlock = '';

  // Highest-priority signal: actual VISION analysis of the real thumbnails.
  if (channelStyle?.visionStyle && channelStyle.visionStyle.trim()) {
    styleBlock +=
      `\n\nREAL THUMBNAIL STYLE (from AI vision analysis of this channel's actual thumbnails — MATCH THIS CLOSELY):\n` +
      channelStyle.visionStyle.trim();
  }

  const titles = (channelStyle?.titles ?? []).filter(Boolean).slice(0, 10);
  if (titles.length > 0) {
    styleBlock +=
      `\n\nCHANNEL STYLE REFERENCE (match this creator's branding & tone):\n` +
      `Recent video titles from this channel:\n- ` +
      titles.join('\n- ') +
      `\n\nStudy the title patterns above (capitalization, length, emoji use, numbers, ` +
      `emotional words, punctuation). Your typography text and overall tone MUST feel ` +
      `consistent with this channel's existing style so the new thumbnails look like they ` +
      `belong to the same brand.`;
  }

  const extraForThumb = [
    enriched.fullDescription ? `FULL DESCRIPTION: ${enriched.fullDescription}` : '',
    enriched.transcriptSummary ? `TRANSCRIPT CONTEXT: ${enriched.transcriptSummary.slice(0, 800)}` : '',
  ].filter(Boolean).join('\n');

  const userPrompt = `You are a world-class YouTube thumbnail strategist and AI image-prompt engineer who has studied thousands of high-CTR thumbnails (MrBeast, Veritasium, MKBHD style). Analyze this video, then design 3 ORIGINAL, scroll-stopping thumbnail concepts with ready-to-use Midjourney prompts that are HIGHLY SPECIFIC to this video's topic.

VIDEO DATA:
Title: ${enriched.title}
Channel: ${enriched.channel_name}
Views: ${enriched.view_count}
Description: ${enriched.fullDescription || enriched.description || 'No description available'}
${extraForThumb ? extraForThumb + '\n' : ''}${styleBlock}

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

  const result = await generateText({
    prompt: userPrompt,
    temperature: 0.8,
    maxTokens: 4096,
    task: 'thumbnail',
  });

  if (!result.text) {
    return { code: 'NO_PROVIDER', message: result.error || 'Thumbnail generation failed.' };
  }
  return { prompt: result.text };
}

export function isGeneratorError(result: GeminiScriptResponse | GeminiThumbnailResponse | GeneratorError): result is GeneratorError {
  return 'code' in result && 'message' in result && !('script' in result) && !('prompt' in result);
}
