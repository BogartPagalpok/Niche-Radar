// Cloudflare Pages Function — server-side Google OAuth token refresh.
// URL: POST /api/refresh-token   body: { refresh_token: string }
//
// SECURITY: the Google client_secret must NEVER live in browser code.
// Set these as Cloudflare Pages environment variables (Settings → Env vars):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
// The browser only sends its refresh_token; the secret stays on the server.

interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

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
  const clientId = ctx.env.GOOGLE_CLIENT_ID;
  const clientSecret = ctx.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return json(
      { error: 'Server missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars.' },
      500,
    );
  }

  let refreshToken: string | null = null;
  try {
    const body = (await ctx.request.json()) as { refresh_token?: string };
    refreshToken = body.refresh_token || null;
  } catch {
    /* ignore */
  }

  if (!refreshToken) {
    return json({ error: 'Missing refresh_token in request body.' }, 400);
  }

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!res.ok || !data.access_token) {
      return json(
        { error: data.error_description || data.error || 'Token refresh failed.' },
        res.status || 400,
      );
    }

    // Return ONLY the short-lived access token to the browser.
    return json({
      access_token: data.access_token,
      expires_in: data.expires_in ?? 3600,
    });
  } catch (err: any) {
    return json({ error: String(err?.message || err) }, 500);
  }
};
