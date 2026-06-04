import { getCredentials } from './credentialsService';

export interface VideoMetrics {
  videoId: string;
  views: number;
  estimatedRevenue: number;
  ctr: number;
  avgViewDuration: number;
  engagementRate: number;
  date?: string;
}

export interface ChannelStats {
  channelId: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface AnalyticsError {
  code: string;
  message: string;
}

async function makeYouTubeAnalyticsRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const { googleToken } = getCredentials();

  if (!googleToken) {
    throw {
      code: 'MISSING_TOKEN',
      message: 'Google token not configured',
    } as AnalyticsError;
  }

  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${googleToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        code: `HTTP_${response.status}`,
        message: error.error?.message || `API request failed: ${response.status}`,
      } as AnalyticsError;
    }

    return await response.json();
  } catch (error: any) {
    if (error.code && error.message) {
      throw error;
    }
    throw {
      code: 'NETWORK_ERROR',
      message: error.message || 'Failed to reach YouTube API',
    } as AnalyticsError;
  }
}

export async function getVideoMetrics(videoId: string): Promise<VideoMetrics | null> {
  try {
    const { channelId } = getCredentials();
    if (!channelId) return null;

    const response = await makeYouTubeAnalyticsRequest(
      'https://youtubeanalytics.googleapis.com/v2/reports',
      {
        ids: `channel==${channelId}`,
        metrics: 'views,estimatedRevenue,averageViewDuration,engagementRate',
        filters: `video==${videoId}`,
        dimensions: 'day',
        sort: '-day',
        maxResults: '1',
      }
    );

    if (!response.rows || response.rows.length === 0) {
      return null;
    }

    const row = response.rows[0];
    const columnHeaders = response.columnHeaders;

    const getValueByHeader = (headerName: string) => {
      const index = columnHeaders.findIndex((h: any) => h.name === headerName);
      return index >= 0 ? row[index] : 0;
    };

    return {
      videoId,
      views: getValueByHeader('views') || 0,
      estimatedRevenue: getValueByHeader('estimatedRevenue') || 0,
      ctr: getValueByHeader('cardClickThroughRate') || 0,
      avgViewDuration: getValueByHeader('averageViewDuration') || 0,
      engagementRate: getValueByHeader('engagementRate') || 0,
      date: response.rows[0]?.[0] || new Date().toISOString().split('T')[0],
    };
  } catch (error: any) {
    console.error('Failed to get video metrics:', error);
    return null;
  }
}

export async function getChannelStats(): Promise<ChannelStats | null> {
  try {
    const { googleToken, channelId } = getCredentials();
    if (!googleToken || !channelId) return null;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${googleToken}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch channel stats:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const stats = data.items[0].statistics;

    return {
      channelId,
      subscriberCount: parseInt(stats.subscriberCount || 0, 10),
      viewCount: parseInt(stats.viewCount || 0, 10),
      videoCount: parseInt(stats.videoCount || 0, 10),
    };
  } catch (error: any) {
    console.error('Failed to get channel stats:', error);
    return null;
  }
}

export async function getVideoStats(videoIds: string[]): Promise<Record<string, any>> {
  try {
    const { googleToken } = getCredentials();
    if (!googleToken) return {};

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${googleToken}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    const result: Record<string, any> = {};

    if (data.items) {
      data.items.forEach((item: any) => {
        result[item.id] = {
          viewCount: parseInt(item.statistics?.viewCount || 0, 10),
          likeCount: parseInt(item.statistics?.likeCount || 0, 10),
          commentCount: parseInt(item.statistics?.commentCount || 0, 10),
          duration: item.contentDetails?.duration || 'PT0S',
        };
      });
    }

    return result;
  } catch (error: any) {
    console.error('Failed to get video stats:', error);
    return {};
  }
}
