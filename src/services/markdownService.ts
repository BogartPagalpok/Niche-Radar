import { type ExtractedVideo } from '../services/youtubeScraper';
import { type YouTubeMetrics } from '../services/metricsService';
import { type EnrichedVideo } from '../services/videoEnrichmentService';

interface MarkdownDocumentParams {
  video: ExtractedVideo;
  metrics: YouTubeMetrics | null;
  scriptPrompt: string;
  thumbnailPrompt: string;
  enrichedVideo?: Partial<EnrichedVideo> | null;
}


interface FlowBeat {
  title: string;
  startSec: number;
  endSec: number;
  description: string;
}

interface FlowImageRow {
  id: string;
  timecode: string;
  filename: string;
  styleSeed: number;
  shotSeed: number;
  beat: string;
  shotType: string;
  prompt: string;
  textOverlay: string;
}

const TARGET_SECONDS_PER_FLOW_IMAGE = 8;
const MIN_FLOW_IMAGE_COUNT = 24;
const MAX_FLOW_IMAGE_COUNT = 120;

function createStableSeed(input: string): number {
  // FNV-1a hash converted into a stable 9-digit positive seed.
  // This keeps the same video/report tied to the same Flow seed every time.
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 100000000 + ((hash >>> 0) % 900000000);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function markdownTableCell(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '/')
    .trim();
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42);

  return slug || 'scene';
}

function parseTimecodeToSeconds(value: string): number | null {
  const parts = value
    .trim()
    .split(':')
    .map(part => Number.parseInt(part, 10));

  if (parts.some(part => Number.isNaN(part))) return null;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function parseDurationToSeconds(duration: string): number | null {
  const clean = duration.trim().toLowerCase();
  const colonMatch = clean.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);

  if (colonMatch) {
    return parseTimecodeToSeconds(colonMatch[0]);
  }

  const hours = Number.parseInt(clean.match(/(\d+)\s*h/)?.[1] ?? '0', 10);
  const minutes = Number.parseInt(clean.match(/(\d+)\s*m/)?.[1] ?? '0', 10);
  const seconds = Number.parseInt(clean.match(/(\d+)\s*s/)?.[1] ?? '0', 10);
  const total = hours * 3600 + minutes * 60 + seconds;

  return total > 0 ? total : null;
}

function formatTimecode(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function filenameTimecode(totalSeconds: number): string {
  return formatTimecode(totalSeconds).replace(/:/g, '-');
}

function extractMarkdownSection(markdown: string, headingNumber: number): string {
  const startPattern = new RegExp(`(^|\\n)##\\s+${headingNumber}\\.`, 'i');
  const startMatch = markdown.match(startPattern);
  if (!startMatch || startMatch.index === undefined) return '';

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = markdown.slice(startIndex);
  const nextHeadingMatch = rest.match(/\n##\s+\d+\./);
  const endIndex = nextHeadingMatch?.index ?? rest.length;

  return rest.slice(0, endIndex).trim();
}

function parseStructuralBeats(scriptPrompt: string, durationSeconds: number | null): FlowBeat[] {
  const beats: FlowBeat[] = [];
  const lines = scriptPrompt.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.replace(/[–—]/g, '-').trim();
    const match = line.match(/^\d+[.)]\s*(?:\*\*)?(.+?)\s*\((\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\)\s*:?(?:\*\*)?\s*(.*)$/);
    if (!match) continue;

    const startSec = parseTimecodeToSeconds(match[2]);
    const endSec = parseTimecodeToSeconds(match[3]);
    if (startSec === null || endSec === null || endSec <= startSec) continue;

    beats.push({
      title: match[1].replace(/\*\*/g, '').trim(),
      startSec,
      endSec: durationSeconds ? Math.min(endSec, durationSeconds) : endSec,
      description: match[4].replace(/\*\*/g, '').trim() || 'Visualize this beat from the production blueprint.',
    });
  }

  if (beats.length > 0) {
    return beats.sort((a, b) => a.startSec - b.startSec);
  }

  const total = durationSeconds ?? 480;
  const fallback: Array<[string, number, number, string]> = [
    ['Opening Hook', 0, 0.07, 'Start with the strongest curiosity gap and emotional promise.'],
    ['Setup / Context', 0.07, 0.18, 'Establish the topic, stakes, and why the viewer should care.'],
    ['Backstory', 0.18, 0.34, 'Show the historical, technical, or narrative background behind the topic.'],
    ['Growth / Opportunity', 0.34, 0.50, 'Visualize the rise, success, or attractive promise before the conflict.'],
    ['Seeds of Conflict', 0.50, 0.68, 'Introduce the hidden weakness, mistake, or pressure building underneath.'],
    ['Crisis / Collapse', 0.68, 0.84, 'Show the consequences, reversal, or most dramatic conflict.'],
    ['Lessons / Takeaways', 0.84, 0.95, 'Translate the story into practical lessons or modern parallels.'],
    ['Final CTA / Resolution', 0.95, 1, 'End with the final takeaway and a clean closing visual.'],
  ];

  return fallback.map(([title, start, end, description]) => ({
    title,
    startSec: Math.floor(total * start),
    endSec: Math.max(Math.floor(total * end), Math.floor(total * start) + 1),
    description,
  }));
}

function findBeatForTime(beats: FlowBeat[], timeSeconds: number): FlowBeat {
  return (
    beats.find(beat => timeSeconds >= beat.startSec && timeSeconds < beat.endSec) ??
    beats.find(beat => timeSeconds < beat.endSec) ??
    beats[beats.length - 1]
  );
}

function createTextOverlay(beat: FlowBeat, shotNumberWithinBeat: number): string {
  if (shotNumberWithinBeat !== 1) return 'NONE';

  return beat.title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ') || 'NEXT';
}

const FLOW_SHOT_PATTERNS = [
  {
    type: 'Wide establishing shot',
    instruction: 'Create a wide cinematic establishing frame that clearly shows the place, scale, and atmosphere for this moment.',
  },
  {
    type: 'Human stakes shot',
    instruction: 'Create a character-driven frame that shows the human cost, emotion, pressure, or decision behind this moment.',
  },
  {
    type: 'Symbolic macro detail',
    instruction: 'Create a close-up symbolic detail that turns the economic, historical, or strategic idea into one memorable visual metaphor.',
  },
  {
    type: 'Map / context visual',
    instruction: 'Create a clean cinematic map, timeline, route, system, or context visual that helps the viewer understand where this moment fits.',
  },
  {
    type: 'Cause-and-effect frame',
    instruction: 'Create a visual cause-and-effect composition with foreground action and background consequence, without clutter.',
  },
  {
    type: 'Evidence / proof frame',
    instruction: 'Create a credible proof-style frame using abstract documents, ledgers, charts, coins, tools, UI cards, or records relevant to the topic.',
  },
  {
    type: 'Conflict / tension frame',
    instruction: 'Create a tense cinematic frame with strong contrast, directional lighting, and visual pressure building toward a turning point.',
  },
  {
    type: 'Transition / motion frame',
    instruction: 'Create a frame designed for gentle animation: parallax layers, camera push-in, drifting atmosphere, and clear depth.',
  },
];

function buildFlowImageRows(params: MarkdownDocumentParams, styleSeed: number, durationSeconds: number | null, beats: FlowBeat[]): FlowImageRow[] {
  const totalSeconds = durationSeconds ?? Math.max(...beats.map(beat => beat.endSec), 480);
  const imageCount = clampNumber(
    Math.ceil(totalSeconds / TARGET_SECONDS_PER_FLOW_IMAGE),
    MIN_FLOW_IMAGE_COUNT,
    MAX_FLOW_IMAGE_COUNT,
  );
  const intervalSeconds = totalSeconds / imageCount;
  const beatCounts = new Map<string, number>();
  const rows: FlowImageRow[] = [];

  for (let index = 0; index < imageCount; index += 1) {
    const timeSeconds = Math.min(Math.floor(index * intervalSeconds), Math.max(totalSeconds - 1, 0));
    const beat = findBeatForTime(beats, timeSeconds);
    const beatKey = `${beat.startSec}-${beat.endSec}-${beat.title}`;
    const shotNumberWithinBeat = (beatCounts.get(beatKey) ?? 0) + 1;
    beatCounts.set(beatKey, shotNumberWithinBeat);

    const pattern = FLOW_SHOT_PATTERNS[index % FLOW_SHOT_PATTERNS.length];
    const id = `IMG-${String(index + 1).padStart(3, '0')}`;
    const timecode = formatTimecode(timeSeconds);
    const filename = `${id.toLowerCase()}-${slugify(beat.title)}-${filenameTimecode(timeSeconds)}.png`;
    const shotSeed = styleSeed + index;
    const prompt = `Use the Global Style Lock. Preserve the source/channel art medium exactly; do not convert cartoon, comic, flat vector, anime, or illustrated thumbnails into photorealistic/3D/cinematic realism. Topic: "${params.video.title}". Timecode: ${timecode}. Beat: "${beat.title}". Beat description: ${beat.description}. This is shot ${shotNumberWithinBeat} inside this beat, so choose a distinct sub-moment and avoid repeating the previous frame. ${pattern.instruction} Make this frame work as one storyboard image in a continuous long-form video sequence. No visible text unless the Text Overlay column is not NONE.`;

    rows.push({
      id,
      timecode,
      filename,
      styleSeed,
      shotSeed,
      beat: beat.title,
      shotType: pattern.type,
      prompt,
      textOverlay: createTextOverlay(beat, shotNumberWithinBeat),
    });
  }

  return rows;
}

function buildFlowImageSequenceManifest(params: MarkdownDocumentParams): string {
  const { video, scriptPrompt, thumbnailPrompt, enrichedVideo } = params;
  const styleSeed = createStableSeed(`${video.video_id}:${video.title}:${video.channel_name}`);
  const durationSeconds = parseDurationToSeconds(video.duration);
  const beats = parseStructuralBeats(scriptPrompt, durationSeconds);
  const rows = buildFlowImageRows(params, styleSeed, durationSeconds, beats);
  const intervalSeconds = durationSeconds ? Math.round((durationSeconds / rows.length) * 10) / 10 : TARGET_SECONDS_PER_FLOW_IMAGE;
  const topic = markdownTableCell(video.title || 'the source video topic');
  const channel = markdownTableCell(video.channel_name || 'the source channel');
  const sourceDescription = markdownTableCell(
    enrichedVideo?.transcriptSummary?.slice(0, 1400) ||
      enrichedVideo?.fullDescription?.slice(0, 1400) ||
      video.description?.slice(0, 1400) ||
      'Use the script blueprint and structural template as the source of truth.'
  );
  const structureSummary = markdownTableCell(extractMarkdownSection(scriptPrompt, 6).slice(0, 1800));
  const visualReference = markdownTableCell(thumbnailPrompt?.slice(0, 2000) || 'Use the thumbnail prompt above only as broad visual DNA, not as the full video style.');

  const globalStyle = `Source-faithful YouTube storyboard frames for "${topic}" from ${channel}; 16:9; the PRIMARY goal is to match the source/channel visual language from the Thumbnail Visual DNA below. Preserve the exact art medium: if the source is 2D cartoon, comic strip, flat vector, anime, doodle, collage, or simple illustration, stay in that medium and avoid photorealism, realistic lighting, 3D render, DSLR/lens language, shallow depth of field, and ultra-detailed faces. If the source is realistic, then preserve that realistic/cinematic look. Keep the same palette, linework/detail level, character/expression style, typography style, background simplicity/complexity, camera/composition grammar, and recurring motifs. One clear focal point per frame, mobile-readable, designed for slow push-ins, pans, parallax, map movement, or simple animation without changing style.`;

  const imageRows = rows
    .map(row => {
      return `| ${row.id} | ${row.timecode} | ${row.filename} | ${row.styleSeed} | ${row.shotSeed} | ${markdownTableCell(row.beat)} | ${markdownTableCell(row.shotType)} | ${markdownTableCell(row.prompt)} | ${markdownTableCell(row.textOverlay)} |`;
    })
    .join('\n');

  return `## Sequential Image Generation Manifest for Google Flow

### Purpose

This is a **full-content visual storyboard**, not a 10-image thumbnail pack. It creates enough ordered frames to cover the full video narrative, using approximately **1 image every ${intervalSeconds} seconds**.

- **Source duration:** ${video.duration || 'unknown'}
- **Total images to generate:** ${rows.length}
- **Recommended use:** Generate these as still frames first, then animate each frame in Flow/image-to-video for short clips and assemble them in order under the narration.

### Source Context Pack

- **Topic:** ${topic}
- **Channel style source:** ${channel}
- **Source thumbnail URL:** ${video.thumbnail_url || 'Not available'}
- **Structural template used:** ${structureSummary || 'No structural template was detected, so the sequence uses a generic hook-to-payoff long-form structure.'}
- **Extra source context:** ${sourceDescription}
- **Thumbnail visual DNA:** ${visualReference}

### Seed / Consistency Control

- **Style Seed:** \`${styleSeed}\`
- Use the **Style Seed** as the constant seed/style anchor for the whole package when Flow exposes seed control.
- Use the **Shot Seed** column only if Flow requires a separate per-generation seed.
- If Flow does not expose manual seed control, keep the seed numbers in the prompt text and use Flow **ingredients/references** instead.
- Upload the source thumbnail as a Flow ingredient/reference named **@source-thumbnail-style** whenever possible.
- After generating the first strong matching frame, save it as a Flow ingredient/reference named **@visual-style-lock** and reuse it for every later row.
- If a recurring character, object, location, map, coin, UI card, or mascot appears, save it as an ingredient too and reference it in later prompts.

### Global Style Lock

${globalStyle}

### Continuity Rules

1. Generate the queue in exact numeric order from **IMG-001** to **${rows[rows.length - 1]?.id ?? 'the final image'}**.
2. Keep the same visual language, color palette, linework/detail level, lighting/background treatment, camera feel, texture quality, and subject design across the whole sequence.
3. Do **not** upgrade a cartoon/comic/flat/vector source into realistic or cinematic imagery; style fidelity beats visual polish.
4. These are video storyboard frames, so avoid giant thumbnail-style typography except when the **Text Overlay** column is not **NONE**.
5. Do not redesign characters, costumes, environments, maps, coins, props, or UI cards after they first appear.
6. Keep every image 16:9 and leave safe space for captions/subtitles.
7. Use the exact filename listed in the table.

### Shared Negative Prompt

Avoid: low quality, blurry, messy composition, over-cluttered frame, unreadable text, random typography, distorted faces, extra fingers, inconsistent character design, random art style changes, watermark, unrelated logos, noisy background, low contrast, off-brand colors, modern objects unless the prompt asks for a modern parallel, photorealism/3D/cinematic realism when the source style is cartoon/comic/flat/vector.

### Flow Clip Assembly Instructions

1. Generate each still image from the queue.
2. Animate each image into a **${Math.max(4, Math.round(intervalSeconds))}-second clip** using gentle camera movement.
3. Use slow push-ins for hooks, slow pans for maps/context, parallax for ruins/environments, and rack focus for proof/details.
4. Add narration, captions, sound effects, and music in your editor; do not rely on AI-generated text inside every frame.
5. Concatenate clips in filename order.

### Image Generation Queue

| ID | Timecode | Filename | Style Seed | Shot Seed | Beat | Shot Type | Prompt | Text Overlay |
|----|----------|----------|------------|-----------|------|-----------|--------|--------------|
${imageRows}

### One-Shot Flow Command

Flow, generate every image from the **Image Generation Queue** in exact numeric order. For each row, combine the **Global Style Lock**, the row-specific **Prompt**, the **Style Seed**, the **Shot Seed** if needed, the **Text Overlay** rule, and the **Shared Negative Prompt**. Use **@source-thumbnail-style** as the primary style reference and reuse **@visual-style-lock** plus any saved recurring ingredients. Continue until all ${rows.length} images are complete. Do not skip rows and do not change the visual style or art medium.
`;
}

export function generateMarkdownDocument(params: MarkdownDocumentParams): string {
  const { video, metrics, scriptPrompt, thumbnailPrompt, enrichedVideo } = params;
  const timestamp = new Date().toLocaleString();

  const sourceDescription = enrichedVideo?.fullDescription || video.description || 'No description available';
  const hasEnrichment = !!(enrichedVideo?.transcriptSummary || enrichedVideo?.fullDescription || enrichedVideo?.enrichmentSource);
  const enrichmentSource = enrichedVideo?.enrichmentSource || 'none';
  const transcriptPreview = enrichedVideo?.transcriptSummary 
    ? enrichedVideo.transcriptSummary.slice(0, 1200) + (enrichedVideo.transcriptSummary.length > 1200 ? '...' : '')
    : null;

  const markdown = `# 🛑 SYSTEM INSTRUCTIONS FOR AI
You are my expert YouTube production assistant and strategist. This document contains a high-signal replication blueprint generated by Niche Radar Viral Factory.

**CRITICAL WORKFLOW (for best results):**
1. **STEP 1:** Carefully read the entire "Niche Radar Script Replication Blueprint" below. Focus first on the "Accurate Video Extraction", "Viral Hooks & Retention Triggers", and "Viral Score" sections.
2. **STEP 2:** Use the "Structural Template" + "High-Quality Replication Narration Beats" to create your own video. Ground your script in the real patterns and examples from the source while adapting for your voice/niche.
3. **PAUSE** after completing your draft script.
4. **ASK:** End your response with: *"Script blueprint applied. Ready for thumbnail concepts and visual production notes?"*
5. **STEP 3:** Only then proceed to the Thumbnail section and production notes.

Do NOT generate a full video script in one go without following the grounded analysis first.

---

# Niche Radar Viral Factory: Complete Video Analysis & Replication Report

**Generated:** ${timestamp}

**Source Video:** [${video.title}](https://www.youtube.com/watch?v=${video.video_id})

---

## Video Information

| Field | Value |
|-------|-------|
| **Title** | ${video.title} |
| **Video ID** | \`${video.video_id}\` |
| **Channel** | ${video.channel_name} |
| **Upload Date** | ${video.upload_date} |
| **Duration** | ${video.duration} |
| **YouTube URL** | https://www.youtube.com/watch?v=${video.video_id} |

### Description (Source Data)

\`\`\`
${sourceDescription}
\`\`\`

${hasEnrichment ? `### Enrichment Status
- **Sources used:** ${enrichmentSource}
- **Transcript available:** ${transcriptPreview ? 'Yes (partial below)' : 'No (or too short)'}
- **Full description captured:** ${enrichedVideo?.fullDescription ? 'Yes' : 'No'}
` : '### Enrichment Status\n- No external enrichment APIs were used (or keys missing). Description and analysis based on title + basic YouTube data only.\n'}

${transcriptPreview ? `### Transcript Summary (from enrichment)
\`\`\`
${transcriptPreview}
\`\`\`
` : ''}

---

## Analytics Metrics

${
  metrics
    ? `| Metric | Value |
|--------|-------|
| **Total Views** | ${metrics.views.toLocaleString()} |
| **Estimated Gross Revenue** | $${metrics.estimatedRevenue.toFixed(2)} |
| **CPM (Cost Per Mille)** | $${metrics.cpm.toFixed(2)} |
| **Card Click-Through-Rate** | ${(metrics.cardClickThroughRate * 100).toFixed(2)}% |
| **Net RPM (Revenue Per 1K Views)** | $${metrics.netRpm.toFixed(2)} |`
    : 'No metrics data available. Ensure your Google API token is configured.'
}

---

## Niche Radar Script Replication Blueprint (Viral Factory Edition)

The following is a **grounded, high-quality replication asset** produced by analyzing the source video's structure, claims, and proven engagement patterns using real enriched data. It emphasizes accuracy, virality, and actionable strategy.

\`\`\`
${scriptPrompt}
\`\`\`

---

## Thumbnail Prompt for AI Image Generators

### Instructions for Midjourney / Stable Diffusion / Flux

Use the following prompt to generate scroll-stopping thumbnails that match the proven visual language of this high-performing video:

\`\`\`
${thumbnailPrompt}
\`\`\`

---

${buildFlowImageSequenceManifest(params)}

---

## How to Use This Report for Maximum Results (Viral Factory Workflow)

1. **Internalize the Accurate Extraction, Viral Hooks & Viral Score** — Understand exactly what made the source video work.
2. **Follow the Structural Template** — Use the beat-by-beat outline as your skeleton.
3. **Adapt the Narration Beats** — Use the provided high-quality samples.
4. **Generate Thumbnails** — Feed the thumbnail section into your image generator.
5. **Produce & Iterate** — Film a test version, analyze retention in YouTube Studio, and refine.
6. **Legal/Ethical Note**: Use this as inspiration and structural guidance. Create original content in your own voice.

---

**Report Generated by Niche Radar Viral Factory** | *YouTube Intelligence Platform*

*All data is provided for educational and strategic planning purposes only. Always create original content.*
`;

  return markdown;
}

export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'niche-radar-analysis.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
