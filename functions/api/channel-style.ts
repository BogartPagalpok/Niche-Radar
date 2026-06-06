// Cloudflare Pages Function — scrape a channel's recent videos to learn its
// thumbnail/title STYLE, so thumbnail prompts can match the channel's branding.
// URL: GET /api/channel-style?id=CHANNEL_ID   (UC... or @handle)
//
// Returns the channel's recent video titles + thumbnail URLs. No OAuth, no CORS.

interface Env {}

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = (url.searchParams.get('id') || '').trim();
  if (!id) return json({ error: 'Missing ?id=' }, 400);

  const videosUrl = id.startsWith('@')
    ? `https://www.youtube.com/${id}/videos`
    : id.startsWith('UC')
      ? `https://www.youtube.com/channel/${id}/videos`
      : `https://www.youtube.com/${id}/videos`;

  try {
    const res = await fetch(videosUrl, { headers: COMMON_HEADERS });
    const html = await res.text();

    const match =
      html.match(/(?:var\s+)?ytInitialData\s*=\s*({[\s\S]*?})(;\s*<\/script>|;)/) ||
      html.match(/ytInitialData\s*=\s*({[\s\S]*?})/);

    if (!match || !match[1]) return json({ error: 'Channel not found', videos: [] }, 404);

    const data = JSON.parse(match[1]);

    // Walk the JSON to collect richItem/gridVideo renderers.
    const videos: { title: string; thumbnail: string; views: string }[] = [];
    collectVideos(data, videos);

    const top = videos.slice(0, 12);
    return json({
      count: top.length,
      titles: top.map((v) => v.title),
      thumbnails: top.map((v) => v.thumbnail).filter(Boolean),
      videos: top,
    });
  } catch (err: any) {
    return json({ error: String(err?.message || err), videos: [] }, 500);
  }
};

function runsText(runs?: Array<{ text: string }>): string {
  return runs && Array.isArray(runs) ? runs.map((r) => r.text).join('') : '';
}

// Recursively find videoRenderer / gridVideoRenderer / richItemRenderer videos.
function collectVideos(
  node: any,
  out: { title: string; thumbnail: string; views: string }[],
  depth = 0,
): void {
  if (!node || typeof node !== 'object' || depth > 12 || out.length >= 20) return;

  const r = node.videoRenderer || node.gridVideoRenderer;
  if (r?.videoId) {
    const title = r.title?.simpleText || runsText(r.title?.runs) || '';
    const thumbs = r.thumbnail?.thumbnails || [];
    const best = thumbs.length
      ? thumbs.reduce((a: any, b: any) => (b.width * b.height > a.width * a.height ? b : a)).url
      : '';
    const views =
      r.viewCountText?.simpleText || runsText(r.viewCountText?.runs) || '';
    if (title) out.push({ title, thumbnail: best, views });
  }

  for (const key of Object.keys(node)) {
    const val = (node as any)[key];
    if (Array.isArray(val)) {
      for (const item of val) collectVideos(item, out, depth + 1);
    } else if (val && typeof val === 'object') {
      collectVideos(val, out, depth + 1);
    }
  }
}
