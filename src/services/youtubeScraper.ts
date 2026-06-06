export interface ExtractedVideo {
  video_id: string;
  title: string;
  view_count: string;
  description: string;
  duration: string;
  upload_date: string;
  thumbnail_url: string;
  channel_name: string;
  channel_id: string;
}

export interface SearchResult {
  videos: ExtractedVideo[];
  continuation: string | null;
}

// All scraping now happens server-side in the Cloudflare Pages Function at
// /api/youtube-search. The browser just calls our own same-origin endpoint,
// so there is NO CORS issue and NO dependency on flaky public proxies.
//
// In local dev (vite alone) /api/* won't exist — run the app with
//   npx wrangler pages dev -- npm run dev
// (or build + `wrangler pages dev dist`) so the Function is served too,
// OR set VITE_API_BASE to your deployed *.pages.dev origin in a .env file.
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export async function searchYouTubeVideos(
  query: string,
  continuation: string | null = null,
): Promise<SearchResult> {
  try {
    let response: Response;

    if (!continuation) {
      // First page — GET with the query.
      response = await fetch(
        `${API_BASE}/api/youtube-search?q=${encodeURIComponent(query)}`,
        { method: 'GET', signal: AbortSignal.timeout(20000) },
      );
    } else {
      // Next page — POST the continuation token for infinite scroll.
      response = await fetch(`${API_BASE}/api/youtube-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ continuation }),
        signal: AbortSignal.timeout(20000),
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error(`[YouTube] API ${response.status}:`, text);
      return { videos: [], continuation: null };
    }

    const data = (await response.json()) as SearchResult & { error?: string };
    if (data.error) console.warn('[YouTube] API reported:', data.error);

    return {
      videos: data.videos ?? [],
      continuation: data.continuation ?? null,
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    return { videos: [], continuation: null };
  }
}

export function generateMockSearchResults(query: string): ExtractedVideo[] {
  const mockVideos: ExtractedVideo[] = [
    {
      video_id: 'dQw4w9WgXcQ',
      title: `${query} - High-Quality Guide Tutorial`,
      view_count: '2.5M',
      description: `Learn everything about ${query} in this comprehensive guide. Perfect for beginners and advanced users.`,
      duration: '12:34',
      upload_date: '2 days ago',
      thumbnail_url: 'https://images.pexels.com/photos/3823157/pexels-photo-3823157.jpeg?auto=compress&cs=tinysrgb&w=600',
      channel_name: 'Tech Mastery Channel',
      channel_id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    },
    {
      video_id: 'jNQXAC9IVRw',
      title: `${query} Explained - What You Need to Know`,
      view_count: '1.8M',
      description: `Breaking down the key concepts of ${query}. Easy to understand explanations.`,
      duration: '8:45',
      upload_date: '1 week ago',
      thumbnail_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600',
      channel_name: 'Learning Hub Pro',
      channel_id: 'UCeJfTbLKlYKvQqUr2jqg-bg',
    },
    {
      video_id: '9bZkp7q19f0',
      title: `${query} Advanced Techniques - Pro Tips`,
      view_count: '890K',
      description: `Master advanced techniques in ${query}. For experienced practitioners only.`,
      duration: '15:20',
      upload_date: '3 days ago',
      thumbnail_url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600',
      channel_name: 'Expert Academy',
      channel_id: 'UCt-nK2uP5NWOJHSXVN9nAQA',
    },
    {
      video_id: 'LaFIKL9bXzQ',
      title: `${query} for Beginners - Step by Step`,
      view_count: '3.2M',
      description: `Complete beginner's guide to ${query}. Start from zero knowledge and build up.`,
      duration: '20:15',
      upload_date: '5 days ago',
      thumbnail_url: 'https://images.pexels.com/photos/3834215/pexels-photo-3834215.jpeg?auto=compress&cs=tinysrgb&w=600',
      channel_name: 'Skill Builder',
      channel_id: 'UCWr1QX02OJk-SkJUbysKa7Q',
    },
    {
      video_id: 'wixzV8I8zBs',
      title: `Why ${query} is Important in 2024`,
      view_count: '1.2M',
      description: `Understanding why ${query} matters now more than ever. Trends and predictions.`,
      duration: '9:30',
      upload_date: '1 day ago',
      thumbnail_url: 'https://images.pexels.com/photos/3945657/pexels-photo-3945657.jpeg?auto=compress&cs=tinysrgb&w=600',
      channel_name: 'Trends & Insights',
      channel_id: 'UCFKDEp9si4RmHvPf5kK17Qw',
    },
  ];
  return mockVideos;
}
