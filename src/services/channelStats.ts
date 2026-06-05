import { getValidToken } from './credentialsService';

export interface ChannelStats {
  subscribers: string;
  totalViews: string;
  videoCount: string;
  channelTitle: string;
  thumbnail: string;
  country: string;
  error?: string;
}

export async function fetchChannelStats(channelId: string): Promise<ChannelStats> {
  const token = await getValidToken();

  if (!token) {
    return {
      subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A',
      channelTitle: 'N/A', thumbnail: '', country: 'N/A',
      error: 'Google token not available. Check credentials in App Settings.',
    };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 401) {
      localStorage.removeItem('niche-radar-token-expiry');
      const fresh = await getValidToken();
      if (!fresh) {
        return {
          subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A',
          channelTitle: 'N/A', thumbnail: '', country: 'N/A',
          error: 'Authentication expired. Could not refresh token.',
        };
      }
      return fetchChannelStats(channelId); // retry with fresh token
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A',
        channelTitle: 'N/A', thumbnail: '', country: 'N/A',
        error: 'Channel not found',
      };
    }

    const channel = data.items[0];
    const stats = channel.statistics;
    const snippet = channel.snippet;

    return {
      subscribers: formatNumber(stats.subscriberCount),
      totalViews: formatNumber(stats.viewCount),
      videoCount: formatNumber(stats.videoCount),
      channelTitle: snippet.title,
      thumbnail: snippet.thumbnails?.default?.url || '',
      country: snippet.country || 'N/A',
    };
  } catch (error) {
    return {
      subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A',
      channelTitle: 'N/A', thumbnail: '', country: 'N/A',
      error: error instanceof Error ? error.message : 'Failed',
    };
  }
}

function formatNumber(num: string | undefined): string {
  if (!num) return 'N/A';
  const n = parseInt(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}
