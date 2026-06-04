// Storage keys
export const STORAGE_KEY_TOKEN = 'niche-radar-google-token';
export const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';
export const STORAGE_KEY_CHANNEL_ID = 'niche-radar-channel-id';
export const STORAGE_KEY_YOUTUBE_API_KEY = 'niche-radar-youtube-api-key'; // new

export interface Credentials {
  googleToken: string | null;
  geminiKey: string | null;
  channelId: string | null;
  youtubeApiKey: string | null; // new
}

export function getCredentials(): Credentials {
  return {
    googleToken: localStorage.getItem(STORAGE_KEY_TOKEN),
    geminiKey: localStorage.getItem(STORAGE_KEY_GEMINI),
    channelId: localStorage.getItem(STORAGE_KEY_CHANNEL_ID),
    youtubeApiKey: localStorage.getItem(STORAGE_KEY_YOUTUBE_API_KEY),
  };
}

// Optional: for features that still require OAuth + channel ID
export function hasRequiredCredentials(): boolean {
  const { googleToken, channelId } = getCredentials();
  return !!(googleToken && channelId);
}

// New helper: check if YouTube API key is available
export function hasYouTubeApiKey(): boolean {
  const { youtubeApiKey } = getCredentials();
  return !!youtubeApiKey;
}
