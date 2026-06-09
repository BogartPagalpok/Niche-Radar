import { getCredentials } from './credentialsService';
import { type ExtractedVideo } from './youtubeScraper';

export interface EnrichedVideo extends ExtractedVideo {
  fullDescription?: string;
  transcriptSummary?: string;
  extraMetadata?: Record<string, any>;
  enrichmentSource?: string; // e.g. "supadata + apify"
}

/**
 * Enriches the basic video data (from YouTube search scraper) using your other APIs.
 * 
 * - Supadata: Excellent for getting full transcripts and metadata (bypasses YouTube restrictions).
 * - Apify: Great for deeper scraping, channel statistics, comments, or alternative video data.
 * 
 * This enriched data is passed to the AI (Gemini is always the final fallback) so the
 * Script Replication Blueprint and thumbnails become much more accurate and specific.
 */
export async function enrichVideoData(video: ExtractedVideo): Promise<EnrichedVideo> {
  const creds = getCredentials();
  const enriched: EnrichedVideo = { ...video };
  const sources: string[] = [];

  console.log('[Enrichment] Checking other APIs... supadataKey present:', !!creds.supadataKey, 'apifyKey present:', !!creds.apifyKey);

  // === 1. Supadata (Primary for transcripts + metadata) ===
  if (creds.supadataKey) {
    console.log('[Enrichment] Supadata key found, attempting transcript fetch for', video.video_id);
    try {
      const transcript = await fetchSupadataTranscript(video.video_id, creds.supadataKey);
      if (transcript && transcript.length > 50) {
        enriched.transcriptSummary = transcript.slice(0, 4000); // Limit length for prompt
        sources.push('supadata');
        console.log('[Enrichment] ✅ Supadata transcript fetched successfully, length:', transcript.length);
      } else {
        console.log('[Enrichment] Supadata returned no usable transcript (or empty)');
      }

      // Also fetch full video metadata (often has complete description, view stats, etc.)
      const videoMeta = await fetchSupadataVideoData(video.video_id, creds.supadataKey);
      if (videoMeta) {
        if (videoMeta.description && !enriched.fullDescription) {
          enriched.fullDescription = videoMeta.description;
          console.log('[Enrichment] ✅ Supadata video description captured, length:', videoMeta.description.length);
        }
        // Merge any extra fields
        enriched.extraMetadata = {
          ...(enriched.extraMetadata || {}),
          supadataVideo: {
            title: videoMeta.title,
            description: videoMeta.description,
            viewCount: videoMeta.viewCount,
            likeCount: videoMeta.likeCount,
            channelTitle: videoMeta.channelTitle,
            publishedAt: videoMeta.publishedAt,
          },
        };
        if (!sources.includes('supadata')) sources.push('supadata');
        console.log('[Enrichment] ✅ Supadata video metadata fetched');
      }
    } catch (error) {
      console.warn('[Enrichment] Supadata enrichment failed:', error);
    }
  } else {
    console.log('[Enrichment] No supadataKey in settings - skipping Supadata');
  }

  // === 2. Apify (For deeper / alternative data) ===
  if (creds.apifyKey) {
    console.log('[Enrichment] Apify key found, attempting data fetch for', video.video_id);
    try {
      const apifyData = await fetchApifyVideoData(video.video_id, creds.apifyKey, creds.apifyActorId || undefined);
      if (apifyData) {
        enriched.extraMetadata = apifyData;

        // Apify YouTube scrapers typically put the full description at top level
        if (apifyData.description && !enriched.fullDescription) {
          enriched.fullDescription = apifyData.description;
          console.log('[Enrichment] ✅ Apify provided full description, length:', apifyData.description.length);
        } else if (apifyData.fullDescription) {
          enriched.fullDescription = apifyData.fullDescription;
        } else if (apifyData.videoDetails?.description) {
          enriched.fullDescription = apifyData.videoDetails.description;
        }

        // Capture other useful fields if present
        if (apifyData.transcript && !enriched.transcriptSummary) {
          enriched.transcriptSummary = String(apifyData.transcript).slice(0, 4000);
        }

        sources.push('apify');
        console.log('[Enrichment] ✅ Apify data fetched successfully (keys:', Object.keys(apifyData).slice(0, 8).join(', '), ')');
      } else {
        console.log('[Enrichment] Apify returned no usable data');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Failed to fetch') || msg.includes('CORS') || msg.includes('ERR_FAILED')) {
        console.warn('[Enrichment] Apify skipped due to CORS/network (common on direct browser calls to Apify). Supadata data is still being used. To enable Apify, the proxy at /api/apify-enrich must be deployed.');
      } else {
        console.warn('[Enrichment] Apify enrichment failed:', error);
      }
    }
  } else {
    console.log('[Enrichment] No apifyKey in settings - skipping Apify');
  }

  if (sources.length > 0) {
    enriched.enrichmentSource = sources.join(' + ');
    console.log('[Enrichment] Final enrichment sources:', enriched.enrichmentSource);
  } else {
    console.log('[Enrichment] No other APIs were used (keys missing or fetch failed)');
  }

  return enriched;
}

// ============================================
// Supadata Integration
// ============================================
/**
 * Fetches transcript using Supadata (updated 2026 for correct auth + endpoint).
 */
async function fetchSupadataTranscript(videoId: string, apiKey: string): Promise<string | null> {
  // CORRECT Supadata endpoint + auth (per official docs 2026):
  // - Use /v1/youtube/transcript (or /v1/transcript in some versions)
  // - Header MUST be x-api-key (NOT Bearer or Authorization)
  // - videoId or url param supported; text=true often returns clean content string
  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`;

  console.log('[Enrichment] Supadata transcript request URL:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      // Do NOT send Authorization: Bearer — it causes 401
    },
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    console.error(`[Enrichment] Supadata transcript HTTP ${response.status} for ${videoId}: ${errBody}`);
    throw new Error(`Supadata API error: ${response.status}`);
  }

  const data = await response.json();

  // Robust parsing for Supadata response formats (content string, array of chunks, etc.)
  if (typeof data === 'string') return data;
  if (data.content) {
    if (typeof data.content === 'string') return data.content;
    if (Array.isArray(data.content)) {
      return data.content.map((item: any) => item.text || item.content || '').join('\n');
    }
  }
  if (data.transcript) return data.transcript;
  if (data.text) return data.text;
  if (Array.isArray(data)) {
    return data.map((item: any) => item.text || item.content || '').join('\n');
  }
  if (data.data?.transcript) return data.data.transcript;
  if (data.data?.content) return typeof data.data.content === 'string' ? data.data.content : '';

  return null;
}

// Additional Supadata helper for full video metadata (description, stats, etc.)
async function fetchSupadataVideoData(videoId: string, apiKey: string): Promise<any | null> {
  const url = `https://api.supadata.ai/v1/youtube/video?id=${videoId}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });
    if (!response.ok) {
      console.warn(`[Enrichment] Supadata video metadata ${response.status}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.warn('[Enrichment] Supadata video metadata fetch error:', e);
    return null;
  }
}

// ============================================
// Apify Integration
// ============================================
function normalizeApifyActorId(actorId: string): string {
  const trimmed = actorId.trim();
  const apifyUrlMatch = trimmed.match(/apify\.com\/([^/?#]+)\/([^/?#]+)/i);
  if (apifyUrlMatch) {
    return `${apifyUrlMatch[1]}~${apifyUrlMatch[2]}`;
  }
  return trimmed.replace('/', '~');
}

function buildApifyInput(actorId: string, videoId: string): Record<string, unknown> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  if (actorId === 'apidojo~youtube-scraper-api') {
    return {
      startUrls: [{ url }],
      includeShorts: false,
      includeLiveStreams: false,
      getTrending: false,
      maxItems: 1,
    };
  }

  if (actorId === 'streamers~youtube-channel-scraper') {
    return {
      startUrls: [{ url }],
      maxResults: 1,
      maxResultsShorts: 0,
      maxResultStreams: 0,
    };
  }

  return {
    startUrls: [{ url }],
    maxResults: 1,
    maxResultsShorts: 0,
    maxResultStreams: 0,
    downloadSubtitles: false,
  };
}

/**
 * Fetches additional video/channel data using Apify (with polling + dataset retrieval for real data).
 */
async function fetchApifyVideoData(videoId: string, apiKey: string, actorIdOverride?: string): Promise<any | null> {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

  // In the browser we MUST go through our Cloudflare Pages Function proxy.
  // Direct calls to api.apify.com from the browser hit CORS preflight blocks (as seen in production).
  // The proxy runs server-side and returns the data cleanly.
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    console.log('[Enrichment] Routing Apify through server proxy (/api/apify-enrich) to avoid CORS');
    try {
      const proxyRes = await fetch(`${API_BASE}/api/apify-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          apifyKey: apiKey,
          // Optional UI setting. Examples:
          // - apidojo/youtube-scraper-api
          // - streamers/youtube-channel-scraper
          actorId: actorIdOverride,
        }),
      });

      if (!proxyRes.ok) {
        const err = await proxyRes.json().catch(() => ({}));
        throw new Error(`Apify proxy error: ${proxyRes.status} ${err.error || ''}`);
      }

      const result = await proxyRes.json();
      if (result.data) {
        return result.data;
      }
      return result;
    } catch (proxyErr) {
      console.warn('[Enrichment] Apify proxy call failed:', proxyErr);
      // Fall through to return null so enrichment continues with Supadata only
      return null;
    }
  }

  // Fallback for non-browser environments (rare in this app)
  // Apify REST API uses tilde-separated public actor names, not slash paths.
  // Default matches the Fast YouTube Channel Scraper actor used in Apify setup.
  const actorId = normalizeApifyActorId(actorIdOverride || 'streamers/youtube-channel-scraper');
  console.log(`[Enrichment] (non-browser) Direct Apify on actor "${actorId}" for video ${videoId}`);

  const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`;
  const runResponse = await fetch(runUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildApifyInput(actorId, videoId)),
  });

  if (!runResponse.ok) {
    const errBody = await runResponse.text().catch(() => '');
    throw new Error(`Apify run creation failed: ${runResponse.status} ${errBody}`);
  }

  const runData = await runResponse.json();
  return runData.data || runData || null;
}
