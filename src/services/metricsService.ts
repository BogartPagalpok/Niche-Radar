import { hasRequiredCredentials, getCredentials, refreshGoogleToken } from './credentialsService';

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
  let { googleToken, channelId } = getCredentials();

  if (!googleToken || !channelId) {
    return {
      code: 'MISSING_CREDENTIALS',
      message: 'Google token and YouTube Channel ID are required. Configure them in App Settings.',
    };
  }

  // Helper inside the request block to execute with a specific token string
  const executeQuery = async (token: string) => {
    // 1. Calculate historical fallback dates required by the API
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30); // Grab last 30 days of data

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    // 2. FIXED QUERY STRING: Added required dates, removed revenue components restricted by video filters
    const url = `https://youtubeanalytics.googleapis.com/v2/reports` +
      `?ids=channel==${channelId}` +
      `&metrics=views,cardClickThroughRate` + 
      `&filters=video==${videoId}` +
      `&dimensions=day` +
      `&sort=-day` +
      `&startDate=${startDateStr}` +
      `&endDate=${endDateStr}` +
      `&maxResults=1`;

    return await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  };

  try {
    let response = await executeQuery(googleToken);

    // 3. AUTOMATED 401 RETRY: Hook directly into your background refresh utility
    if (response.status === 401) {
      console.warn('Access token expired during metrics fetch. Attempting silent refresh...');
      const refreshResult = await refreshGoogleToken();
      
      if (refreshResult.googleToken) {
        // Re-run the request sequence using the updated token string
        response = await executeQuery(refreshResult.googleToken);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        return {
          code: 'INVALID_TOKEN',
          message: 'Google session has fully expired. Please re-authenticate inside App Settings.',
        };
      }

      if (response.status === 403) {
        return {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Your YouTube Analytics API access may be restricted or lacks permissions for this video.',
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
        message: 'No analytics data available for this video inside this date range.',
      };
    }

    const row = data.rows[0];

    // Array position mapping based on our updated clean metric parameters string
    const views = row[0] ?? 0;
    const cardClickThroughRate = row[1] ?? 0;
    
    // Revenue models set to safe defaults since they are restricted for specific video endpoint queries
    const estimatedRevenue = 0;
    const cpm = 0;
    const netRpm = 0;

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
