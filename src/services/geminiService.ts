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
  console.log('[Enrichment] generateScriptPrompt calling enrichVideoData for', video.video_id);
  const enriched: EnrichedVideo = await enrichVideoData(video);
  console.log('[Enrichment] generateScriptPrompt received enriched source:', enriched.enrichmentSource || 'none', 'has transcript:', !!enriched.transcriptSummary, 'has fullDesc:', !!enriched.fullDescription);

  const extraContext = [
    enriched.fullDescription ? `FULL DESCRIPTION:\n${enriched.fullDescription}` : '',
    enriched.transcriptSummary ? `TRANSCRIPT SUMMARY (first ~3000 chars):\n${enriched.transcriptSummary}` : '',
    enriched.extraMetadata ? `EXTRA METADATA (from Apify):\n${JSON.stringify(enriched.extraMetadata, null, 2)}` : '',
    enriched.enrichmentSource ? `Data enrichment sources: ${enriched.enrichmentSource}` : '',
  ].filter(Boolean).join('\n\n');

  const userPrompt = `You are an elite YouTube analyst and viral content strategist who has reverse-engineered hundreds of top-performing videos (MrBeast, Dan Martell, high-retention educational/list videos). Your job is to produce the HIGHEST-QUALITY, most VIRAL-POTENTIAL replication asset possible.

${extraContext ? `\n\n--- ENRICHED DATA (PRIMARY SOURCE OF TRUTH — use this for all claims, hooks, and examples) ---\n${extraContext}\n--- END ENRICHED DATA ---` : ''}

**VIRAL FACTORY RULES (CRITICAL):**
- Extract and quote REAL viral triggers from the transcript (curiosity gaps, emotional beats, retention cliffhangers, pattern interrupts, "you won't believe" moments).
- Prioritize hooks and structures that drive shares, comments, and watch time.
- Be 80% faithful to what actually worked in the enriched data + 20% smart, high-virality adaptations.
- NEVER hallucinate tools, claims, or examples not present in the enriched data.
- Focus on what makes content spread: emotional payoff, curiosity, relatability, actionable value.

VIDEO DATA:
- Title: ${enriched.title}
- Channel: ${enriched.channel_name}
- Views: ${enriched.view_count}
- Duration: ${enriched.duration}
- Description: ${enriched.fullDescription || enriched.description || 'No description available'}

OUTPUT FORMAT — Use these exact section headers:

## 1. ACCURATE VIDEO EXTRACTION
- Quote the exact title and any tools/offers/claims from description or transcript.
- Summarize the core promise and format.
- List specific tools, links, or claims found in the enriched data.

## 2. VIRAL HOOKS & RETENTION TRIGGERS (from Transcript)
- Extract 5-7 specific viral triggers with timestamps or quotes from the transcript.
- For each: Hook type (curiosity, emotion, story, pattern interrupt, etc.) + why it works.

## 3. VIRAL SCORE (1-10)
- Give an overall Viral Score based on the enriched data.
- Breakdown: Hook Strength / Retention Power / Shareability / Emotional Impact (1-10 each).
- One sentence justification using real data from the transcript/description.

## 4. RETENTION BLUEPRINT ANALYSIS (Grounded)
3-5 sentences on what drove the views (hook, pacing, emotional curve, structural pattern, cliffhangers).

## 5. TARGET AUDIENCE & TONE

## 6. STRUCTURAL TEMPLATE (Beat-by-Beat)
Detailed timed outline using the actual duration: ${enriched.duration}

## 7. HIGH-QUALITY REPLICATION NARRATION BEATS
Write 2-4 high-quality sample beats per major section with [Visual] and [On-screen text] notes. Include Faithful Adaptation + one Creative Viral Variation for key sections.

## 8. ADVANCED VIRAL ADAPTATION GUIDANCE
Specific tactics to increase shareability, comments, and algorithm favor using the enriched data.

## 9. PRODUCTION & OPTIMIZATION NOTES

## 10. TITLE VARIATIONS (7 strong ones — optimized for CTR + search)

## 11. 3 FULL SCRIPT VARIATIONS (Short & Viral)
Provide 3 concise, ready-to-adapt full script variations (60-90 seconds each) that maximize virality while staying faithful to the source structure and enriched data. Number them 1-3.

CRITICAL QUALITY RULES:
- Prioritize real details from enriched data (transcript/description) over inference.
- Fill every section completely with useful, specific, viral-optimized content.
- The output must feel like a professional viral content strategist wrote it.`;

  const result = await generateText({
    prompt: userPrompt,
    temperature: 0.55,
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
  visionStyle?: string;
}

export async function generateThumbnailPrompt(
  video: ExtractedVideo,
  channelStyle?: ChannelStyleHint,
): Promise<GeminiThumbnailResponse | GeneratorError> {
  console.log('[Enrichment] generateThumbnailPrompt calling enrichVideoData for', video.video_id);
  const enriched: EnrichedVideo = await enrichVideoData(video);
  console.log('[Enrichment] generateThumbnailPrompt received enriched source:', enriched.enrichmentSource || 'none');

  let styleBlock = '';

  if (channelStyle?.visionStyle && channelStyle.visionStyle.trim()) {
    styleBlock += `\n\nREAL THUMBNAIL STYLE (from AI vision analysis of this channel's actual thumbnails — MATCH THIS CLOSELY):\n` + channelStyle.visionStyle.trim();
  }

  const titles = (channelStyle?.titles ?? []).filter(Boolean).slice(0, 10);
  if (titles.length > 0) {
    styleBlock += `\n\nCHANNEL STYLE REFERENCE (match this creator's branding & tone):\nRecent video titles from this channel:\n- ` + titles.join('\n- ') + `\n\nStudy the title patterns above...`;
  }

  const extraForThumb = [
    enriched.fullDescription ? `FULL DESCRIPTION: ${enriched.fullDescription}` : '',
    enriched.transcriptSummary ? `TRANSCRIPT CONTEXT: ${enriched.transcriptSummary.slice(0, 800)}` : '',
  ].filter(Boolean).join('\n');

  const userPrompt = `You are a YouTube thumbnail strategist and AI image-prompt engineer. Your job is to create ORIGINAL thumbnail concepts that preserve the SOURCE VIDEO / CHANNEL visual language as closely as possible while changing the topic/content enough to be original.

STYLE FIDELITY IS THE TOP PRIORITY:
- If the real thumbnail style is simple 2D cartoon, comic strip, flat vector, anime, hand-drawn, meme collage, low-detail doodle, or any non-realistic medium, the generated prompts MUST stay in that exact medium.
- Do NOT upgrade cartoon/comic/flat thumbnails into photorealistic, cinematic realism, 3D render, ultra-detailed faces, shallow depth of field, DSLR photography, or dramatic studio lighting.
- Only use realistic/cinematic/photographic language if the source thumbnails are actually realistic/cinematic/photographic.
- Treat the REAL THUMBNAIL STYLE block as a strict style lock. It overrides generic CTR advice.
- Clone the visual grammar, not copyrighted characters, logos, or exact frames.

VIDEO DATA:
Title: ${enriched.title}
Channel: ${enriched.channel_name}
Views: ${enriched.view_count}
Description: ${enriched.fullDescription || enriched.description || 'No description available'}
${extraForThumb ? extraForThumb + '\n' : ''}${styleBlock}

THUMBNAIL PSYCHOLOGY — apply these without changing the source art style:
- CURIOSITY GAP: imply a question or "what happens next?"
- EMOTION: clear readable expression/action appropriate to the source style.
- ONE CLEAR FOCAL POINT
- HIGH CONTRAST & COLOR POP matching the source palette
- MOBILE-FIRST readability
- SIMPLE composition that matches the channel's proven layout pattern

CRITICAL RULES:
1. The main subject MUST be specific to THIS video's actual topic from the enriched data.
2. ALWAYS include typography unless the real source style normally uses no typography.
3. Each of the 3 concepts must use a DIFFERENT CTR strategy but the SAME source visual style.
4. Every image prompt must begin with a concise SOURCE STYLE LOCK.
5. Every image prompt must include a STYLE NEGATIVE clause that prevents the wrong medium, e.g. "not photorealistic, not 3D render" when source is cartoon.
6. End with technical flags, but do not use flags/phrases that contradict the source style.

OUTPUT EXACTLY THIS FORMAT:

SOURCE STYLE LOCK:
[One strict paragraph describing the exact source/channel visual style and what to avoid. If source is cartoon/comic/flat, explicitly say not photorealistic and not 3D.]

THUMBNAIL CONCEPT 1 - [Strategy name]
Main Subject: [Specific, topic-relevant subject + expression/action]
Typography Text: ["Short punchy 2-5 word phrase"]
Typography Style: [Match source typography, color, outline, placement]
Color Palette: [Match source palette]
Composition: [Match source layout/focal placement/background treatment]
Image prompt: SOURCE STYLE LOCK: [repeat style lock in brief]. [Detailed subject/action/background in the source style], typography "TEXT" in [matched style], style negatives: [wrong styles to avoid], --ar 16:9 --style raw
Why this works for CTR: [2 sentences referencing psychology + enriched data]
Style match notes: [Explain how this preserves the source thumbnail style]
Best for: [target viewer]

[Same for CONCEPT 2 and 3]`;

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
