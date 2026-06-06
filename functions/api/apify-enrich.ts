// Cloudflare Pages Function — runs server-side on Cloudflare's edge.
// URL: /api/apify-enrich
//
// Accepts: { videoId, apifyKey, actorId? }
// Returns clean scraped data or error. No CORS issues for the browser.

interface Env {}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { videoId?: string; apifyKey?: string; actorId?: string } = {};
  try {
    body = (await ctx.request.json()) as any;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { videoId, apifyKey, actorId: requestedActor } = body;

  if (!videoId || !apifyKey) {
    return json({ error: 'videoId and apifyKey are required' }, 400);
  }

  // Use the actor the user actually has access to (from their Apify Console)
  const actorId = requestedActor || 'streamers/youtube-scraper';

  console.log(`[Apify Proxy] Starting for video ${videoId} on actor ${actorId}`);

  try {
    const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyKey}`;
    const runResponse = await fetch(runUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startUrls: [{ url: `https://www.youtube.com/watch?v=${videoId}` }],
        maxItems: 1,
        includeVideoDetails: true,
        includeChannelDetails: true,
        maxResults: 1,
      }),
    });

    if (!runResponse.ok) {
      const errBody = await runResponse.text().catch(() => '');
      console.error(`[Apify Proxy] Run start failed ${runResponse.status}: ${errBody}`);
      return json({ error: `Apify run creation failed: ${runResponse.status}`, details: errBody }, runResponse.status);
    }

    let runData = await runResponse.json();
    let runId = runData.data?.id || runData.id;
    let datasetId = runData.data?.defaultDatasetId || runData.defaultDatasetId;

    if (!runId) {
      return json({ data: runData.data || runData });
    }

    // Poll (up to ~24s)
    let finalStatus = 'RUNNING';
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise(r => setTimeout(r, 2000));

      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${apifyKey}`
      );
      if (statusRes.ok) {
        runData = await statusRes.json();
        finalStatus = runData.data?.status || runData.status || 'UNKNOWN';
        datasetId = runData.data?.defaultDatasetId || datasetId;
        console.log(`[Apify Proxy] Run ${runId} status: ${finalStatus}`);

        if (['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(finalStatus)) {
          break;
        }
      }
    }

    if (finalStatus === 'SUCCEEDED' && datasetId) {
      const itemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyKey}&limit=1&clean=true&format=json`;
      const itemsRes = await fetch(itemsUrl);
      if (itemsRes.ok) {
        const items = await itemsRes.json();
        if (Array.isArray(items) && items.length > 0) {
          console.log(`[Apify Proxy] ✅ Dataset item retrieved for ${videoId}`);
          const item = items[0];
          // Return clean, useful structure for the app
          return json({
            data: {
              title: item.title,
              description: item.description,
              viewCount: item.viewCount,
              likeCount: item.likes,
              channelName: item.channelName,
              transcript: item.transcript || null,
              ...item, // include everything else
            },
            source: 'apify-proxy',
            runId,
            status: finalStatus,
          });
        }
      }
    }

    // Fallbacks
    if (runData.data?.output) {
      return json({ data: runData.data.output, source: 'apify-proxy', status: finalStatus });
    }
    return json({ data: runData.data || runData, source: 'apify-proxy', status: finalStatus });

  } catch (err: any) {
    console.error('[Apify Proxy] Unexpected error:', err);
    return json({ error: 'Apify proxy failed', message: String(err?.message || err) }, 500);
  }
};
