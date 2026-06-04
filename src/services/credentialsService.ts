// Storage keys
export const STORAGE_KEY_TOKEN = 'niche-radar-google-token';
export const STORAGE_KEY_REFRESH_TOKEN = 'niche-radar-refresh-token';
export const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';
export const STORAGE_KEY_CHANNEL_ID = 'niche-radar-channel-id';
export const STORAGE_KEY_YOUTUBE_API_KEY = 'niche-radar-youtube-api-key';

export interface Credentials {
  googleToken: string | null;
  refreshToken: string | null;
  geminiKey: string | null;
  channelId: string | null;
  youtubeApiKey: string | null;
}

export function getCredentials(): Credentials {
  return {
    googleToken: localStorage.getItem(STORAGE_KEY_TOKEN),
    refreshToken: localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN),
    geminiKey: localStorage.getItem(STORAGE_KEY_GEMINI),
    channelId: localStorage.getItem(STORAGE_KEY_CHANNEL_ID),
    youtubeApiKey: localStorage.getItem(STORAGE_KEY_YOUTUBE_API_KEY),
  };
}

export function saveCredentials(token: string, refreshToken?: string) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  }
}

// THIS IS THE MISSING PIECE TO FIX THE 401 ERROR
export async function refreshGoogleToken(): Promise<{ googleToken: string | null }> {
  const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
  if (!refreshToken) return { googleToken: null };

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your actual ID
        client_secret: 'YOUR_GOOGLE_CLIENT_SECRET', // NOTE: Ideally use a backend to hide this
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      saveCredentials(data.access_token);
      return { googleToken: data.access_token };
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
  return { googleToken: null };
}

export function hasRequiredCredentials(): boolean {
  const { googleToken, channelId } = getCredentials();
  return !!(googleToken && channelId);
}

export function hasYouTubeApiKey(): boolean {
  const { youtubeApiKey } = getCredentials();
  return !!youtubeApiKey;
}
