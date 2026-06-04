export const STORAGE_KEY_TOKEN = 'niche-radar-google-token';
export const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';
export const STORAGE_KEY_CHANNEL_ID = 'niche-radar-channel-id';

export interface Credentials {
  googleToken: string | null;
  geminiKey: string | null;
  channelId: string | null;
}

export function getCredentials(): Credentials {
  return {
    googleToken: localStorage.getItem(STORAGE_KEY_TOKEN),
    geminiKey: localStorage.getItem(STORAGE_KEY_GEMINI),
    channelId: localStorage.getItem(STORAGE_KEY_CHANNEL_ID),
  };
}

export function hasRequiredCredentials(): boolean {
  const { googleToken, channelId } = getCredentials();
  return !!(googleToken && channelId);
}
