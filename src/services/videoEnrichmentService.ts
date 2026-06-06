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
      const apifyData = await fetchApifyVideoData(video.video_id, creds.apifyKey);
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
      console.warn('[Enrichment] Apify enrichment failed:', error);
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
/**
 * Fetches additional video/channel data using Apify (with polling + dataset retrieval for real data).
 */
async function fetchApifyVideoData(videoId: string, apiKey: string): Promise<any | null> {
  // Default to a popular, actively maintained YouTube scraper on Apify (2026).
  // Change this if you use a different actor (check your Apify Console > Actors for the exact ID/name).
  // Common alternatives: 'apify/youtube-scraper', 'clockworks/youtube-scraper', or your custom fork.
  const actorId = 'streamers/youtube-scraper';

  console.log(`[Enrichment] Apify key found, starting run on actor "${actorId}" for video ${videoId}`);

  // Start the actor run
  const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`;
  const runResponse = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startUrls: [
        { url: `https://www.youtube.com/watch?v=${videoId}` }
      ],
      maxItems: 1,
      // Common options for YouTube scrapers (tune per actor docs)
      includeVideoDetails: true,
      includeChannelDetails: true,
      maxResults: 1,
    }),
  });

  if (!runResponse.ok) {
    const errBody = await runResponse.text().catch(() => '');
    console.error(`[Enrichment] Apify run start failed ${runResponse.status} for actor ${actorId}: ${errBody}`);
    throw new Error(`Apify run creation failed: ${runResponse.status}`);
  }

  let runData = await runResponse.json();
  let runId = runData.data?.id || runData.id;
  const initialDatasetId = runData.data?.defaultDatasetId || runData.defaultDatasetId;

  if (!runId) {
    console.log('[Enrichment] Apify run created but no run ID returned. Returning raw run data.');
    return runData.data || runData;
  }

  // Poll the run status for a short time (max ~16 seconds) so we can retrieve real dataset items.
  // This makes the enrichment much more useful (full description, comments preview, etc.).
  // If your actor is slow or you prefer zero delay, you can remove the polling loop.
  let finalStatus = 'RUNNING';
  let datasetId = initialDatasetId;
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s between polls

    try {
      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apiKey}`
      );
      if (statusRes.ok) {
        runData = await statusRes.json();
        finalStatus = runData.data?.status || runData.status || 'UNKNOWN';
        datasetId = runData.data?.defaultDatasetId || datasetId;
        console.log(`[Enrichment] Apify run ${runId} status after poll #${attempt + 1}: ${finalStatus}`);

        if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(finalStatus)) {
          break;
        }
      }
    } catch (pollErr) {
      console.warn('[Enrichment] Apify poll error (will retry):', pollErr);
    }
  }

  // If succeeded, fetch the actual scraped items from the dataset (this is where the good data lives)
  if (finalStatus === 'SUCCEEDED' && datasetId) {
    try {
      const itemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiKey}&limit=1&clean=true&format=json`;
      const itemsRes = await fetch(itemsUrl);
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        if (Array.isArray(items) && items.length > 0) {
          const item = items[0];
          console.log('[Enrichment] ✅ Apify dataset item retrieved successfully (has description?', !!item.description, ')');
          return item; // Usually contains: title, description, viewCount, likes, comments, channel info, etc.
        }
      }
    } catch (dsErr) {
      console.warn('[Enrichment] Apify dataset fetch error:', dsErr);
    }
  }

  // Fallbacks: return whatever run output we have
  if (runData.data?.output) {
    return runData.data.output;
  }
  if (runData.data) {
    return runData.data;
  }
  return runData || null;
}
