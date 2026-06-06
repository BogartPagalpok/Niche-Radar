// Channel stats now come from our own Cloudflare Function at /api/channel-stats.
// This works WITHOUT Google login and has no CORS issues (server-side scrape).
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export interface ChannelStats {
  subscribers: string;
  totalViews: string;
  videoCount: string;
  channelTitle: string;
  thumbnail: string;
  country: string;
  error?: string;
}

const EMPTY: Omit<ChannelStats, 'error'> = {
  subscribers: 'N/A',
  totalViews: 'N/A',
  videoCount: 'N/A',
  channelTitle: 'N/A',
  thumbnail: '',
  country: 'N/A',
};

export async function fetchChannelStats(channelId: string): Promise<ChannelStats> {
  if (!channelId) {
    return { ...EMPTY, error: 'No channel ID available for this video.' };
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/channel-stats?id=${encodeURIComponent(channelId)}`,
      { method: 'GET', signal: AbortSignal.timeout(15000) },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ...EMPTY, error: body.error || `Failed (HTTP ${res.status})` };
    }

    const data = (await res.json()) as ChannelStats & { error?: string };
    if (data.error) return { ...EMPTY, error: data.error };

    return {
      subscribers: data.subscribers || 'N/A',
      totalViews: data.totalViews || 'N/A',
      videoCount: data.videoCount || 'N/A',
      channelTitle: data.channelTitle || 'N/A',
      thumbnail: data.thumbnail || '',
      country: data.country || 'N/A',
    };
  } catch (error) {
    return {
      ...EMPTY,
      error: error instanceof Error ? error.message : 'Failed to load channel stats',
    };
  }
}
