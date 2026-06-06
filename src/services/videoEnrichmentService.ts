import { getCredentials } from './credentialsService';
import { type ExtractedVideo } from './youtubeScraper';

export interface EnrichedVideo extends ExtractedVideo {
  fullDescription?: string;
  transcriptSummary?: string;
  extraMetadata?: Record<string, any>;
  enrichmentSource?: string; // e.g. "supadata + apify"
}

/**
 * Enriches video data using your other APIs:
 * - Supadata → transcripts + metadata (bypasses YouTube limits)
 * - Apify → deeper analytics / channel data
 *
 * This data is injected into Gemini (and the fallback chain) so reports
 * become much more accurate instead of guessing from title only.
 */
export async function enrichVideoData(video: ExtractedVideo): Promise<EnrichedVideo> {
  const creds = getCredentials();
  const enriched: EnrichedVideo = { ...video };
  const sources: string[] = [];

  // === Supadata (transcripts) ===
  if (creds.supadataKey) {
    try {
      const transcript = await fetchSupadataTranscript(video.video_id, creds.supadataKey);
      if (transcript) {
        enriched.transcriptSummary = transcript.slice(0, 3000);
        sources.push('supadata');
      }
    } catch (e) {
      console.warn('[Enrichment] Supadata failed:', e);
    }
  }

  // === Apify (deeper data) ===
  if (creds.apifyKey) {
    try {
      const extra = await fetchApifyVideoData(video.video_id, creds.apifyKey);
      if (extra) {
        enriched.extraMetadata = extra;
        if (extra.fullDescription && !enriched.description) {
          enriched.fullDescription = extra.fullDescription;
        }
        sources.push('apify');
      }
    } catch (e) {
      console.warn('[Enrichment] Apify failed:', e);
    }
  }

  if (sources.length > 0) {
    enriched.enrichmentSource = sources.join(' + ');
  }

  return enriched;
}

// ======================
// Supadata helper
// ======================
async function fetchSupadataTranscript(videoId: string, apiKey: string): Promise<string | null> {
  // TODO: Adjust this URL and headers to match your exact Supadata plan/docs
  const url = `https://api.supadata.ai/v1/transcript?videoId=${videoId}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`Supadata returned status ${res.status}`);
    return null;
  }

  const data = await res.json();

  // Common response shapes — adjust if your Supadata returns differently
  if (data.transcript) return data.transcript;
  if (data.text) return data.text;
  if (Array.isArray(data)) return data.map((s: any) => s.text || '').join(' ');

  return null;
}

// ======================
// Apify helper (placeholder)
// ======================
async function fetchApifyVideoData(videoId: string, apiKey: string): Promise<any | null> {
  // Apify usually needs an Actor run. This is a simplified example.
  // Replace with your actual Apify actor ID and input format.
  const actorId = 'your-youtube-scraper-actor-id'; // ← CHANGE THIS

  try {
    const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: `https://www.youtube.com/watch?v=${videoId}` }],
        maxItems: 1,
      }),
    });

    if (!res.ok) return null;

    const run = await res.json();
    // In real usage you normally poll the run and then fetch the dataset.
    // For now we return whatever is immediately available.
    return run?.data || null;
  } catch (e) {
    console.warn('Apify call failed:', e);
    return null;
  }
}
