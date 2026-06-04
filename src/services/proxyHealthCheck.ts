export async function checkProxyHealth(): Promise<{
  healthy: boolean;
  workingProxy: string | null;
  error?: string;
}> {
  const proxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];

  const testUrl = 'https://www.youtube.com/';

  for (const proxy of proxies) {
    try {
      const response = await fetch(proxy + encodeURIComponent(testUrl), {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        console.log(`Proxy health check passed: ${proxy}`);
        return {
          healthy: true,
          workingProxy: proxy,
        };
      }
    } catch (error) {
      console.warn(`Proxy failed: ${proxy}`, error);
    }
  }

  return {
    healthy: false,
    workingProxy: null,
    error: 'No proxies available',
  };
}
