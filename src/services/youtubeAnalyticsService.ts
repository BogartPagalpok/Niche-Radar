import { getCredentials, getValidToken } from './credentialsService';

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

const formatDate = (d: Date) => d.toISOString().split('T')[0];

async function makeAnalyticsRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<any> {
  const token = await getValidToken();
  if (!token) {
    throw { code: 'MISSING_TOKEN', message: 'Google token not available' } as AnalyticsError;
  }

  const executeFetch = (accessToken: string) => {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
  };

  try {
    let response = await executeFetch(token);

    if (response.status === 401) {
      localStorage.removeItem('niche-radar-token-expiry');
      const fresh = await getValidToken();
      if (fresh) response = await executeFetch(fresh);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        code: `HTTP_${response.status}`,
        message: error.error?.message || `API request failed: ${response.status}`,
      } as AnalyticsError;
    }
    return await response.json();
  } catch (error: any) {
    throw error.code ? error : { code: 'NETWORK_ERROR', message: error.message };
  }
}

export async function getVideoMetrics(videoId: string): Promise<VideoMetrics | null> {
  try {
    const { channelId } = getCredentials();
    if (!channelId) return null;

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const response = await makeAnalyticsRequest(
      'https://youtubeanalytics.googleapis.com/v2/reports',
      {
        ids: `channel==${channelId}`,
        metrics: 'views,averageViewDuration,engagementRate,cardClickThroughRate',
        filters: `video==${videoId}`,
        startDate: formatDate(start),
        endDate: formatDate(end),
        dimensions: 'day',
        sort: '-day',
        maxResults: '1',
      }
    );

    if (!response.rows || response.rows.length === 0) return null;

    const row = response.rows[0];
    const headers = response.columnHeaders;
    const getVal = (name: string) => {
      const idx = headers.findIndex((h: any) => h.name === name);
      return idx >= 0 ? row[idx] : 0;
    };

    return {
      videoId,
      views: getVal('views') || 0,
      estimatedRevenue: 0,
      ctr: getVal('cardClickThroughRate') || 0,
      avgViewDuration: getVal('averageViewDuration') || 0,
      engagementRate: getVal('engagementRate') || 0,
      date: row[0] || formatDate(new Date()),
    };
  } catch (e) {
    console.error('Failed to get video metrics:', e);
    return null;
  }
}

export async function getChannelStats(): Promise<ChannelStats | null> {
  try {
    const { channelId, clientId } = getCredentials();
    if (!channelId || !clientId) return null;

    const token = await getValidToken();
    if (!token) return null;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    const stats = data.items?.[0]?.statistics;
    return stats ? {
      channelId,
      subscriberCount: parseInt(stats.subscriberCount, 10),
      viewCount: parseInt(stats.viewCount, 10),
      videoCount: parseInt(stats.videoCount, 10),
    } : null;
  } catch {
    return null;
  }
}

export async function getVideoStats(videoIds: string[]): Promise<Record<string, any>> {
  try {
    const token = await getValidToken();
    if (!token) return {};

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();
    const result: Record<string, any> = {};
    data.items?.forEach((item: any) => {
      result[item.id] = {
        viewCount: parseInt(item.statistics?.viewCount || 0, 10),
        likeCount: parseInt(item.statistics?.likeCount || 0, 10),
        commentCount: parseInt(item.statistics?.commentCount || 0, 10),
        duration: item.contentDetails?.duration || 'PT0S',
      };
    });
    return result;
  } catch {
    return {};
  }
}
