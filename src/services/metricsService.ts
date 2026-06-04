import { hasRequiredCredentials, getCredentials } from './credentialsService';

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
  const { googleToken, channelId } = getCredentials();

  if (!googleToken || !channelId) {
    return {
      code: 'MISSING_CREDENTIALS',
      message: 'Google token and YouTube Channel ID are required. Configure them in App Settings.',
    };
  }

  try {
    const response = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&metrics=views,estimatedRevenue,cpm,cardClickThroughRate&filters=video==${videoId}&dimensions=day&sort=-day&maxResults=1`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          code: 'INVALID_TOKEN',
          message: 'Google token is invalid or expired. Please update in App Settings.',
        };
      }

      if (response.status === 403) {
        return {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Your YouTube Analytics API access may be restricted. Check your Google Cloud project permissions.',
        };
      }

      return {
        code: 'API_ERROR',
        message: `YouTube Analytics API returned status ${response.status}.`,
      };
    }

    const data: any = await response.json();

    if (!data.rows || data.rows.length === 0) {
      return {
        code: 'NO_DATA',
        message: 'No analytics data available for this video. It may be too new or not monetized.',
      };
    }

    const row = data.rows[0];
    const columnHeaders = data.columnHeaders || [];

    const getValueByIndex = (index: number) => {
      return row[index] ?? 0;
    };

    const views = getValueByIndex(0) || 0;
    const estimatedRevenue = getValueByIndex(1) || 0;
    const cpm = getValueByIndex(2) || 0;
    const cardClickThroughRate = getValueByIndex(3) || 0;
    const netRpm = views > 0 ? (estimatedRevenue / views) * 1000 : 0;

    return {
      views,
      estimatedRevenue,
      cpm,
      cardClickThroughRate,
      netRpm,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch YouTube metrics';

    return {
      code: 'FETCH_ERROR',
      message: `Network error: ${errorMessage}`,
    };
  }
}

export function isMetricsError(result: YouTubeMetrics | MetricsError): result is MetricsError {
  return 'code' in result && 'message' in result && !('views' in result);
}
