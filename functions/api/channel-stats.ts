// Cloudflare Pages Function — public channel stats, NO Google login required.
// URL: GET /api/channel-stats?id=CHANNEL_ID   (id can be UC... or @handle)
//
// Scrapes the channel's "About"/home page server-side (no CORS, no OAuth) and
// pulls subscriber count, total views, video count, title, country, thumbnail.

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
      'Cache-Control': 'public, max-age=600',
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

  // Build the channel URL: support UC... ids and @handles.
  const channelUrl = id.startsWith('@')
    ? `https://www.youtube.com/${id}/about`
    : id.startsWith('UC')
      ? `https://www.youtube.com/channel/${id}/about`
      : `https://www.youtube.com/${id}/about`;

  try {
    const res = await fetch(channelUrl, { headers: COMMON_HEADERS });
    const html = await res.text();

    const match =
      html.match(/(?:var\s+)?ytInitialData\s*=\s*({[\s\S]*?})(;\s*<\/script>|;)/) ||
      html.match(/ytInitialData\s*=\s*({[\s\S]*?})/);

    if (!match || !match[1]) {
      return json({ error: 'Channel not found' }, 404);
    }

    const data = JSON.parse(match[1]);

    // Header + metadata locations vary; pull from several known spots.
    const header =
      data?.header?.c4TabbedHeaderRenderer ||
      data?.header?.pageHeaderRenderer ||
      {};
    const meta = data?.metadata?.channelMetadataRenderer || {};

    const title =
      meta.title || header.title?.simpleText || header.title || 'Unknown';
    const thumbnail =
      meta.avatar?.thumbnails?.[0]?.url ||
      header.avatar?.thumbnails?.[0]?.url ||
      '';
    const country = meta.country || 'N/A';

    // Subscriber count text, e.g. "1.2M subscribers"
    const subText =
      header.subscriberCountText?.simpleText ||
      runsText(header.subscriberCountText?.runs) ||
      '';

    // Try to read view/video counts from the about metadata blocks.
    const flat = JSON.stringify(data);
    const viewMatch = flat.match(/"viewCountText":\{"simpleText":"([^"]+)"/);
    const videoMatch =
      flat.match(/"videosCountText":\{"runs":\[\{"text":"([^"]+)"/) ||
      flat.match(/([\d.,]+)\s*videos/i);

    return json({
      channelTitle: title,
      thumbnail,
      country,
      subscribers: subText.replace(/subscribers?/i, '').trim() || 'N/A',
      totalViews: viewMatch ? viewMatch[1].replace(/views?/i, '').trim() : 'N/A',
      videoCount: videoMatch ? videoMatch[1] : 'N/A',
    });
  } catch (err: any) {
    return json({ error: String(err?.message || err) }, 500);
  }
};

function runsText(runs?: Array<{ text: string }>): string {
  return runs && Array.isArray(runs) ? runs.map((r) => r.text).join('') : '';
}
