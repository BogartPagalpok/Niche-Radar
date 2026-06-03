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

function getStoredToken(): string | null {
  return localStorage.getItem('niche-radar-google-token');
}

export async function fetchYouTubeMetrics(videoId: string): Promise<YouTubeMetrics | MetricsError> {
  const token = getStoredToken();

  if (!token) {
    return {
      code: 'NO_TOKEN',
      message: 'Google API token not configured. Please add your token in App Settings.',
    };
  }

  try {
    const metricsQuery = `
      SELECT
        views,
        estimatedRevenue,
        cpm,
        cardClickThroughRate
      FROM
        youtubeAnalytics.report_basic_user_owned_content
      WHERE
        video = '${videoId}'
    `;

    const encodedQuery = encodeURIComponent(metricsQuery);
    const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&metrics=${encodedQuery}&dimensions=video&filters=video==${videoId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          code: 'INVALID_TOKEN',
          message: 'Google API token is invalid or expired. Please update in App Settings.',
        };
      }

      return {
        code: 'API_ERROR',
        message: `YouTube Analytics API returned status ${response.status}. Ensure the video is owned by your channel.`,
      };
    }

    const data: any = await response.json();

    if (!data.rows || data.rows.length === 0) {
      return {
        code: 'NO_DATA',
        message: 'No analytics data found for this video. Ensure it is owned by your channel.',
      };
    }

    const row = data.rows[0];
    const views = row[0] || 0;
    const estimatedRevenue = row[1] || 0;
    const cpm = row[2] || 0;
    const cardClickThroughRate = row[3] || 0;
    const netRpm = views > 0 ? (estimatedRevenue / views) * 1000 : 0;

    return {
      views: views,
      estimatedRevenue: estimatedRevenue,
      cpm: cpm,
      cardClickThroughRate: cardClickThroughRate,
      netRpm: netRpm,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch YouTube metrics';

    return {
      code: 'FETCH_ERROR',
      message: errorMessage,
    };
  }
}

export function isMetricsError(result: YouTubeMetrics | MetricsError): result is MetricsError {
  return 'code' in result && 'message' in result && !('views' in result);
}
