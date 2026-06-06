// Health check now pings our own Cloudflare Pages Function instead of public
// CORS proxies. If the Function responds, search will work.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export async function checkProxyHealth(): Promise<{
  healthy: boolean;
  workingProxy: string | null;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}/api/youtube-search?q=test`,
      { method: 'GET', signal: AbortSignal.timeout(8000) },
    );

    if (response.ok) {
      console.log('Backend search Function is healthy.');
      return { healthy: true, workingProxy: `${API_BASE}/api/youtube-search` };
    }

    return {
      healthy: false,
      workingProxy: null,
      error: `Function returned ${response.status}`,
    };
  } catch (error) {
    console.warn('Backend search Function health check failed:', error);
    return {
      healthy: false,
      workingProxy: null,
      error: 'Search backend unavailable',
    };
  }
}
