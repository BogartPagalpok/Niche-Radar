// Cloudflare Pages Function — runs server-side on Cloudflare's edge.
// URL: /api/youtube-search
//
// Why this exists: a browser can't fetch youtube.com directly (CORS), which is
// why the old code used flaky public proxies. This Function runs on the server,
// so it fetches YouTube directly — no CORS, no public proxies, ~100k req/day free.
//
// GET  /api/youtube-search?q=QUERY            -> first page
// POST /api/youtube-search  {continuation}    -> next page (infinite scroll)

interface Env {}

const YT_INNERTUBE_KEY = 'AIzaSyAO90d0o_cE2DFOXJB8jJy9Z8V5iveSx_E'; // public web client key

const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300', // cache identical searches 5 min at the edge
    },
  });
}

// --- handle CORS preflight ---
export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

// --- first page: scrape the search results HTML for ytInitialData ---
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ videos: [], continuation: null, error: 'Missing ?q=' }, 400);

  // sp=EgIQAQ%3D%3D filters to "Videos" only (same as the original code)
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    q,
  )}&sp=EgIQAQ%3D%3D`;

  try {
    const res = await fetch(searchUrl, { headers: COMMON_HEADERS });
    const html = await res.text();

    const match =
      html.match(/(?:var\s+)?ytInitialData\s*=\s*({[\s\S]*?})(;\s*<\/script>|;)/) ||
      html.match(/ytInitialData\s*=\s*({[\s\S]*?})/);

    if (!match || !match[1]) return json({ videos: [], continuation: null });

    const data = JSON.parse(match[1]);
    const result = extractFromInitialData(data);
    return json(result);
  } catch (err: any) {
    return json({ videos: [], continuation: null, error: String(err?.message || err) }, 500);
  }
};

// --- next page: call YouTube's innertube continuation endpoint directly ---
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let continuation: string | null = null;
  try {
    const body = (await ctx.request.json()) as { continuation?: string };
    continuation = body.continuation || null;
  } catch {
    /* ignore */
  }
  if (!continuation) return json({ videos: [], continuation: null });

  const endpoint = `https://www.youtube.com/youtubei/v1/search?key=${YT_INNERTUBE_KEY}`;
  const requestBody = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20240101.01.00' } },
    continuation,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { ...COMMON_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();
    const result = extractFromContinuation(data);
    return json(result);
  } catch (err: any) {
    return json({ videos: [], continuation: null, error: String(err?.message || err) }, 500);
  }
};

/* ------------------------- extraction helpers ------------------------- */

interface ExtractedVideo {
  video_id: string;
  title: string;
  view_count: string;
  description: string;
  duration: string;
  upload_date: string;
  thumbnail_url: string;
  channel_name: string;
  channel_id: string;
}

function runs(r?: Array<{ text: string }>): string {
  return r && Array.isArray(r) ? r.map((x) => x.text).join('') : '';
}

function extractVideo(v: any): ExtractedVideo | null {
  try {
    if (!v?.videoId) return null;
    const viewText =
      v.viewCountText?.simpleText || runs(v.viewCountText?.runs) || '';
    const viewMatch = viewText.match(/[\d.,]+/);
    const channel =
      v.longBylineText?.simpleText || runs(v.longBylineText?.runs) || '';
    // The channel ID lives in a nested navigationEndpoint, NOT a top-level field.
    const channelId =
      v.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
      v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
      v.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer
        ?.navigationEndpoint?.browseEndpoint?.browseId ||
      v.channelId ||
      '';
    const thumbs = v.thumbnail?.thumbnails || [];
    const bestThumb = thumbs.length
      ? thumbs.reduce((a: any, b: any) =>
          b.width * b.height > a.width * a.height ? b : a,
        ).url
      : '';
    return {
      video_id: v.videoId,
      title: runs(v.title?.runs) || 'Untitled',
      view_count: viewMatch ? viewMatch[0] : '0',
      description: runs(v.descriptionSnippet?.runs) || '',
      duration: v.lengthText?.simpleText || '0:00',
      upload_date: v.publishedTimeText?.simpleText || 'Unknown',
      thumbnail_url: bestThumb,
      channel_name: channel,
      channel_id: channelId,
    };
  } catch {
    return null;
  }
}

function extractFromInitialData(data: any) {
  const videos: ExtractedVideo[] = [];
  let continuation: string | null = null;
  const section =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer;
  for (const s of section?.contents || []) {
    for (const item of s.itemSectionRenderer?.contents || []) {
      if (item.videoRenderer) {
        const e = extractVideo(item.videoRenderer);
        if (e) videos.push(e);
      }
      // newer responses put the continuation token inside the section
      const tok =
        item.continuationItemRenderer?.continuationEndpoint?.continuationCommand
          ?.token;
      if (tok) continuation = tok;
    }
  }
  if (!continuation) {
    continuation =
      section?.continuations?.[0]?.nextContinuationData?.continuation || null;
  }
  return { videos, continuation };
}

function extractFromContinuation(data: any) {
  const videos: ExtractedVideo[] = [];
  let continuation: string | null = null;
  for (const cmd of data?.onResponseReceivedCommands || []) {
    for (const item of cmd.appendContinuationItemsAction?.continuationItems ||
      []) {
      if (item.videoRenderer) {
        const e = extractVideo(item.videoRenderer);
        if (e) videos.push(e);
      } else if (
        item.continuationItemRenderer?.continuationEndpoint?.continuationCommand
          ?.token
      ) {
        continuation =
          item.continuationItemRenderer.continuationEndpoint.continuationCommand
            .token;
      }
    }
  }
  return { videos, continuation };
}
