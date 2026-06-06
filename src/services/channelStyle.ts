// Fetches a channel's recent video titles + thumbnails so thumbnail-prompt
// generation can match the channel's actual style. Server-side, no OAuth/CORS.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export interface ChannelStyle {
  titles: string[];
  thumbnails: string[];
  error?: string;
}

export async function fetchChannelStyle(channelId: string): Promise<ChannelStyle> {
  if (!channelId) return { titles: [], thumbnails: [], error: 'No channel ID' };

  try {
    const res = await fetch(
      `${API_BASE}/api/channel-style?id=${encodeURIComponent(channelId)}`,
      { method: 'GET', signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return { titles: [], thumbnails: [], error: `HTTP ${res.status}` };

    const data = (await res.json()) as ChannelStyle;
    return {
      titles: data.titles ?? [],
      thumbnails: data.thumbnails ?? [],
    };
  } catch (e) {
    return {
      titles: [],
      thumbnails: [],
      error: e instanceof Error ? e.message : 'Failed to load channel style',
    };
  }
}
