import { type ExtractedVideo } from './youtubeScraper';
import { generateText } from './aiProviders';

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
  const userPrompt = `You are an elite YouTube analyst and script strategist who has reverse-engineered hundreds of top-performing videos (especially Dan Martell, MrBeast-style list videos, and high-retention educational content). Your job is to produce the HIGHEST-QUALITY, most USEFUL replication asset possible for a serious content creator.

**CRITICAL RULES FOR BEST RESULTS:**
- GROUND EVERYTHING in the actual video data provided. Do not hallucinate tools, names, or specific claims that have zero basis in the title + description.
- First extract and quote what the video actually contains (tools mentioned in the description, claims in the title, implied structure).
- Then analyze the retention/engagement techniques.
- Finally deliver actionable replication guidance that is 80% faithful to what worked + 20% smart, grounded adaptations.
- NEVER invent a full list of 12 brand-new fake tool names with made-up case studies unless the original video itself used completely generic placeholders (which is rare). Prefer referencing real tools from the description or generalizing patterns accurately.
- Be specific, professional, and honest about data limitations (we only have title + description snippet, not full transcript).

VIDEO DATA (use this as the primary source of truth):
- Title: ${video.title}
- Channel: ${video.channel_name}
- Views: ${video.view_count}
- Upload Date: ${video.upload_date}
- Duration: ${video.duration}
- Description: ${video.description || 'No description available'}

OUTPUT FORMAT — Use these exact section headers and produce high-value content:

## 1. ACCURATE VIDEO EXTRACTION
- Quote the exact title and any tools or offers explicitly listed in the description.
- Summarize the core promise and format of the video (e.g. "numbered list of X AI tools with real use cases and ROI stories").
- Note any specific examples, links, or claims visible in the provided data.
- If the description lists actual tools, list them verbatim here.

## 2. RETENTION BLUEPRINT ANALYSIS (Grounded)
3-5 sentences. What observable techniques likely drove the ${video.view_count} views?
- Hook style (big claim, number, curiosity gap, transformation promise)
- Pacing and information density (rapid-fire list? deep case studies? mid-video re-hook?)
- Emotional curve (curiosity → proof → empowerment → bigger vision)
- Structural pattern (numbered tools, case studies with names/numbers, orchestration reveal at the end, strong CTA)
Be precise about what we can reasonably infer from title + description + known high-performing patterns.

## 3. TARGET AUDIENCE & TONE
Who is this video for? What is the emotional energy and positioning of the creator? How should a replicator match or adapt the tone?

## 4. STRUCTURAL TEMPLATE (Beat-by-Beat)
Provide a detailed, timed structural outline that creators can follow exactly. Include:
- Hook (0:00-0:15) — exact technique + example phrasing style
- Intro / Value Prop
- Main Body format (how many items, how each is presented — tool name + benefit + proof + visuals)
- Pattern interrupt / retention re-hook (timing and purpose)
- Climax / strongest leverage point
- Outro + CTA
Use the actual duration: ${video.duration}

## 5. HIGH-QUALITY REPLICATION NARRATION BEATS
For the main body and key sections, write 2-4 high-quality sample narration paragraphs or beats per major section. 
- Base them closely on the real tools/examples from the description where possible.
- Show the style, density, and specificity that made the original work.
- Include [Visual / B-roll suggestions] and [On-screen text] notes.
- Provide both "Faithful Adaptation" and one smart "Creative Variation" for 2-3 of the key sections.
Do NOT write a full 21-minute verbatim script. Focus on the highest-leverage, copy-paste-ready beats.

## 6. ADVANCED ADAPTATION GUIDANCE
- How to adapt this format for a different niche or audience while keeping what made it work.
- Common pitfalls to avoid when replicating this style.
- Specific recommendations for case studies, proof elements, and CTAs that perform well in this format.
- Bonus: 2-3 ways to make the video feel fresh instead of a direct clone.

## 7. PRODUCTION & OPTIMIZATION NOTES
- Recommended B-roll, text overlays, music energy, pacing notes.
- Thumbnail/title psychology that pairs with this script style.
- Metrics to track for success (watch time, CTR on the list format, etc.).

## 8. TITLE VARIATIONS (5 strong ones)
Provide 5 high-potential title variations that keep the proven elements (numbers, "I tested/tried", strong outcome claim) while varying the angle. Make them scroll-stopping and specific.

CRITICAL QUALITY RULES:
- Every claim about "what worked" must be traceable to the video data or widely validated patterns.
- Prioritize usefulness for a real creator over creative flair.
- If the description lists specific tools, reference them accurately instead of replacing them with generic inventions.
- The output should feel like advice from a world-class YouTube strategist, not an AI that just made up a story.
- Fill the structure completely. No placeholders. Make every section genuinely valuable.`;

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
