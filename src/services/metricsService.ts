import { getCredentials, getValidToken } from './credentialsService';

export interface YouTubeMetrics {
  views: number;
  estimatedRevenue: number;
  cpm: number;
  cardClickThroughRate: number;
  netRpm: number;
}

export interface MetricsError {
  code: string;
  message: string;
}

export async function fetchYouTubeMetrics(videoId: string): Promise<YouTubeMetrics | MetricsError> {
  const { channelId } = getCredentials();

  if (!channelId) {
    return {
      code: 'MISSING_CREDENTIALS',
      message: 'YouTube Channel ID is required. Configure it in App Settings.',
    };
  }

  const token = await getValidToken();
  if (!token) {
    return {
      code: 'MISSING_CREDENTIALS',
      message: 'Could not obtain a valid Google token. Check Client ID, Secret, and Refresh Token in App Settings.',
    };
  }

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const buildUrl = () =>
    `https://youtubeanalytics.googleapis.com/v2/reports` +
    `?ids=channel==${channelId}` +
    `&metrics=views,cardClickThroughRate` +
    `&filters=video==${videoId}` +
    `&dimensions=day` +
    `&sort=-day` +
    `&startDate=${fmt(start)}` +
    `&endDate=${fmt(end)}` +
    `&maxResults=1`;

  const execute = (accessToken: string) =>
    fetch(buildUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

  try {
    let response = await execute(token);

    if (response.status === 401) {
      localStorage.removeItem('niche-radar-token-expiry');
      const freshToken = await getValidToken();
      if (freshToken) response = await execute(freshToken);
    }

    if (!response.ok) {
      if (response.status === 401) {
        return { code: 'INVALID_TOKEN', message: 'Google session expired. Re-authenticate or check credentials in App Settings.' };
      }
      if (response.status === 403) {
        return { code: 'INSUFFICIENT_PERMISSIONS', message: 'YouTube Analytics access restricted for this video.' };
      }
      return { code: 'API_ERROR', message: `YouTube Analytics API returned status ${response.status}.` };
    }

    const data: any = await response.json();

    if (!data.rows || data.rows.length === 0) {
      return { code: 'NO_DATA', message: 'No analytics data available for this video in the last 30 days.' };
    }

    const row = data.rows[0];
    // columnHeaders: day(0), views(1), cardClickThroughRate(2)
    return {
      views: row[1] ?? 0,
      cardClickThroughRate: row[2] ?? 0,
      estimatedRevenue: 0,
      cpm: 0,
      netRpm: 0,
    };
  } catch (error) {
    return {
      code: 'FETCH_ERROR',
      message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export function isMetricsError(result: YouTubeMetrics | MetricsError): result is MetricsError {
  return 'code' in result && 'message' in result && !('views' in result);
}
