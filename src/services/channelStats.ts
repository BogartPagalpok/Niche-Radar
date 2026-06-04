export interface ChannelStats {
  subscribers: string;
  totalViews: string;
  videoCount: string;
  channelTitle: string;
  thumbnail: string;
  country: string;
  error?: string;
}

function getStoredYouTubeKey(): string | null {
  return localStorage.getItem('niche-radar-youtube-key');
}

export async function fetchChannelStats(channelId: string): Promise<ChannelStats> {
  const apiKey = getStoredYouTubeKey();

  if (!apiKey) {
    return {
      subscribers: 'N/A', totalViews: 'N/A', videoCount: 'N/A',
      channelTitle: 'N/A', thumbnail: '', country: 'N/A',
      error: 'YouTube API key not configured',
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
    const response = await fetch(url);
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
