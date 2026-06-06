import { supabase } from '../lib/supabase';

export const STORAGE_KEY_ACCESS_TOKEN = 'niche-radar-google-token';
export const STORAGE_KEY_REFRESH_TOKEN = 'niche-radar-refresh-token';
export const STORAGE_KEY_TOKEN_EXPIRY = 'niche-radar-token-expiry';
export const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';
export const STORAGE_KEY_CHANNEL_ID = 'niche-radar-channel-id';
export const STORAGE_KEY_CLIENT_ID = 'niche-radar-client-id';
export const STORAGE_KEY_CLIENT_SECRET = 'niche-radar-client-secret';

export const STORAGE_KEY_CEREBRAS = 'niche_radar_cerebras_key';
export const STORAGE_KEY_GROQ = 'niche_radar_groq_key';
export const STORAGE_KEY_GITHUB = 'niche_radar_github_token';
export const STORAGE_KEY_SUPADATA = 'niche_radar_supadata_key';
export const STORAGE_KEY_APIFY = 'niche_radar_apify_key';

// Legacy alias so old imports keep compiling
export const STORAGE_KEY_TOKEN = STORAGE_KEY_ACCESS_TOKEN;

export interface Credentials {
  googleToken: string | null;   // alias for accessToken
  accessToken: string | null;
  refreshToken: string | null;
  geminiKey: string | null;
  channelId: string | null;
  clientId: string | null;
  clientSecret: string | null;
  youtubeApiKey: null;          // removed – kept for type compat
  supadataKey: string | null;
  apifyKey: string | null;
}

export function getCredentials(): Credentials {
  const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
  return {
    accessToken,
    googleToken: accessToken,
    refreshToken: localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN),
    geminiKey: localStorage.getItem(STORAGE_KEY_GEMINI),
    channelId: localStorage.getItem(STORAGE_KEY_CHANNEL_ID),
    clientId: localStorage.getItem(STORAGE_KEY_CLIENT_ID),
    clientSecret: localStorage.getItem(STORAGE_KEY_CLIENT_SECRET),
    youtubeApiKey: null,
    supadataKey: localStorage.getItem(STORAGE_KEY_SUPADATA),
    apifyKey: localStorage.getItem(STORAGE_KEY_APIFY),
  };
}

function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10) - 60_000;
}

function persistAccessToken(token: string, expiresInSeconds = 3600): void {
  localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, String(Date.now() + expiresInSeconds * 1000));
}

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);

  if (!refreshToken) {
    return null;
  }

  // SECURITY: the client_secret is no longer used in the browser. The refresh
  // happens server-side via the Cloudflare Function at /api/refresh-token,
  // which holds GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET as env vars.
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

  try {
    const response = await fetch(`${API_BASE}/api/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();
    if (response.ok && data.access_token) {
      persistAccessToken(data.access_token, data.expires_in ?? 3600);
      return data.access_token;
    }
    console.error('Token refresh failed:', data.error || data);
    return null;
  } catch (error) {
    console.error('Token refresh network error:', error);
    return null;
  }
}

/**
 * Returns a valid access token, automatically refreshing via Refresh Token if expired.
 * Priority: 1) Supabase session provider_token  2) localStorage token with expiry check + auto-refresh
 * Every API caller should use this instead of reading localStorage directly.
 */
export async function getValidToken(): Promise<string | null> {
  // 1. Prefer Supabase-managed Google token (set when user signs in via Google OAuth)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.provider_token) {
    return session.provider_token;
  }

  // 2. Fall back to manually stored token (sandbox / manual credentials flow)
  const current = localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN);
  if (current && !isTokenExpired()) {
    return current;
  }

  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }

  return refreshPromise;
}

/**
 * Force a brand-new token, ignoring any cached/valid one.
 * - If signed in via Supabase, refreshes the Supabase session.
 * - Otherwise clears expiry and runs the server-side refresh.
 * Returns { token, source } so the UI can report what happened.
 */
export async function forceRefreshToken(): Promise<{ token: string | null; source: string }> {
  // 1. Supabase session path
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.provider_token) {
      return { token: data.session.provider_token, source: 'Supabase (Google) session refreshed' };
    }
    if (session.provider_token) {
      return { token: session.provider_token, source: 'Supabase session (existing token)' };
    }
  }

  // 2. Manual refresh-token path — clear expiry to FORCE a new access token.
  localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
  const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
  if (!refreshToken) {
    return { token: null, source: 'No Google session or refresh token found. Sign in with Google, or add a Refresh Token in Settings.' };
  }
  const token = await doRefresh();
  return {
    token,
    source: token ? 'Refresh token exchanged via /api/refresh-token' : 'Refresh failed (check server GOOGLE_CLIENT_ID/SECRET env vars).',
  };
}

/** Called after a successful Google OAuth flow to store all tokens. */
export function saveCredentials(accessToken: string, refreshToken?: string, expiresIn?: number): void {
  persistAccessToken(accessToken, expiresIn ?? 3600);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

/** Legacy shim — some services still call this directly. */
export async function refreshGoogleToken(): Promise<{ googleToken: string | null }> {
  const token = await getValidToken();
  return { googleToken: token };
}

export function hasRequiredCredentials(): boolean {
  const { accessToken } = getCredentials();
  // channelId is optional — token alone is sufficient for most API calls
  return !!(accessToken);
}

export function hasYouTubeApiKey(): boolean {
  return false;
}
