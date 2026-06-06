async function fetchApifyVideoData(videoId: string, apiKey: string): Promise<any | null> {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

  // In the browser we MUST go through our Cloudflare Pages Function proxy.
  // Direct calls to api.apify.com from the browser hit CORS preflight blocks.
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
          // actorId is optional; server uses 'streamers/youtube-scraper' by default
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
  const actorId = 'streamers/youtube-scraper';
  console.log(`[Enrichment] (non-browser) Direct Apify on actor "${actorId}" for video ${videoId}`);

  const runUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiKey}`;
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
    throw new Error(`Apify run creation failed: ${runResponse.status} ${errBody}`);
  }

  const runData = await runResponse.json();
  return runData.data || runData || null;
}
