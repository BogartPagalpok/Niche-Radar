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

// --- Revenue estimation (works on ANY public video, no OAuth needed) ---
// Net RPM = revenue the creator actually keeps per 1,000 views, after YouTube's
// ~45% cut. Typical niches range $0.50 (gaming) to $8+ (finance). 2.0 is a
// reasonable default; the user can override it in Settings.
const STORAGE_KEY_RPM = 'niche-radar-assumed-rpm';
const DEFAULT_NET_RPM = 2.0;

function getAssumedRpm(): number {
  const raw = localStorage.getItem(STORAGE_KEY_RPM);
  const n = raw ? parseFloat(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_NET_RPM;
}

/**
 * Estimate earnings from a public view count.
 * No credentials required — uses an assumed Net RPM.
 */
export function estimateRevenueFromViews(views: number): YouTubeMetrics {
  const netRpm = getAssumedRpm();
  const estimatedRevenue = (views / 1000) * netRpm;
  return {
    views,
    estimatedRevenue,
    cpm: netRpm / (1 - 0.45), // rough gross CPM back-calc from net
    cardClickThroughRate: 0,  // unknown for public videos
    netRpm,
  };
}

/** Parse YouTube view-count strings like "1.2M", "890K", "2,500" into a number. */
export function parseViewCount(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  if (!raw) return 0;
  const s = String(raw).trim().toUpperCase().replace(/,/g, '');
  const m = s.match(/([\d.]+)\s*([KMB])?/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const mult = m[2] === 'B' ? 1e9 : m[2] === 'M' ? 1e6 : m[2] === 'K' ? 1e3 : 1;
  return Math.round(num * mult);
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
