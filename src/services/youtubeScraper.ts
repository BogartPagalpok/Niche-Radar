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

interface YouTubeVideoRenderer {
  videoId: string;
  title?: {
    runs?: Array<{
      text: string;
    }>;
  };
  viewCountText?: {
    simpleText?: string;
    runs?: Array<{
      text: string;
    }>;
  };
  publishedTimeText?: {
    simpleText?: string;
  };
  descriptionSnippet?: {
    runs?: Array<{
      text: string;
    }>;
  };
  lengthText?: {
    simpleText?: string;
  };
  thumbnail?: {
    thumbnails?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
  longBylineText?: {
    simpleText?: string;
    runs?: Array<{
      text: string;
    }>;
  };
  channelId?: string;
}

interface YouTubeInitialData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: Array<{
            itemSectionRenderer?: {
              contents?: Array<{
                videoRenderer?: YouTubeVideoRenderer;
              }>;
            };
          }>;
          continuations?: Array<{
            nextContinuationData?: {
              continuation?: string;
            };
          }>;
        };
      };
    };
  };
  onResponseReceivedCommands?: Array<{
    appendContinuationItemsAction?: {
      continuationItems?: Array<{
        videoRenderer?: YouTubeVideoRenderer;
        continuationItemRenderer?: {
          continuationEndpoint?: {
            continuationCommand?: {
              token?: string;
            };
          };
        };
      }>;
    };
  }>;
}

function extractViewCount(viewCountText: string | undefined): string {
  if (!viewCountText) return '0';

  const match = viewCountText.match(/[\d.,]+/);
  if (match) {
    return match[0];
  }

  return '0';
}

function parseDuration(durationText: string | undefined): string {
  if (!durationText) return '0:00';

  const timePattern = /(\d+):(\d+):(\d+)|(\d+):(\d+)/;
  const match = durationText.match(timePattern);

  if (match) {
    if (match[1]) {
      return `${match[1]}:${match[2]}:${match[3]}`;
    } else {
      return `${match[4]}:${match[5]}`;
    }
  }

  return durationText;
}

function parsePublishDate(publishedTimeText: string | undefined): string {
  if (!publishedTimeText) return 'Unknown';

  const lowerText = publishedTimeText.toLowerCase();

  if (lowerText.includes('just now') || lowerText.includes('now')) return 'just now';
  if (lowerText.includes('second')) return lowerText.split(' ')[0] + 's ago';
  if (lowerText.includes('minute')) return lowerText.split(' ')[0] + 'm ago';
  if (lowerText.includes('hour')) return lowerText.split(' ')[0] + 'h ago';
  if (lowerText.includes('day')) return lowerText.split(' ')[0] + 'd ago';
  if (lowerText.includes('week')) return lowerText.split(' ')[0] + 'w ago';
  if (lowerText.includes('month')) return lowerText.split(' ')[0] + 'mo ago';
  if (lowerText.includes('year')) return lowerText.split(' ')[0] + 'y ago';

  return publishedTimeText;
}

function getThumbnailUrl(thumbnails: Array<{ url: string; width: number; height: number }> | undefined): string {
  if (!thumbnails || thumbnails.length === 0) return '';

  const highestQuality = thumbnails.reduce((prev, current) => {
    const prevPixels = prev.width * prev.height;
    const currentPixels = current.width * current.height;
    return currentPixels > prevPixels ? current : prev;
  });

  return highestQuality.url;
}

function getTextFromRuns(runs: Array<{ text: string }> | undefined): string {
  if (!runs || !Array.isArray(runs)) return '';
  return runs.map((run: { text: string }) => run.text).join('');
}

function extractVideoFromRenderer(renderer: YouTubeVideoRenderer): ExtractedVideo | null {
  try {
    const videoId = renderer.videoId;
    if (!videoId) return null;

    const title = getTextFromRuns(renderer.title?.runs) || 'Untitled';

    let viewCountText = '';
    if (renderer.viewCountText?.simpleText) {
      viewCountText = renderer.viewCountText.simpleText;
    } else if (renderer.viewCountText?.runs) {
      viewCountText = getTextFromRuns(renderer.viewCountText.runs);
    }
    const viewCount = extractViewCount(viewCountText);

    const description = getTextFromRuns(renderer.descriptionSnippet?.runs) || '';

    const durationText = renderer.lengthText?.simpleText;
    const duration = parseDuration(durationText);

    const publishedTimeText = renderer.publishedTimeText?.simpleText || '';
    const uploadDate = parsePublishDate(publishedTimeText);

    const thumbnailUrl = getThumbnailUrl(renderer.thumbnail?.thumbnails);

    let channelName = '';
    if (renderer.longBylineText?.simpleText) {
      channelName = renderer.longBylineText.simpleText;
    } else if (renderer.longBylineText?.runs) {
      channelName = getTextFromRuns(renderer.longBylineText.runs);
    }

    const channelId = renderer.channelId || '';

    return {
      video_id: videoId,
      title: title,
      view_count: viewCount,
      description: description,
      duration: duration,
      upload_date: uploadDate,
      thumbnail_url: thumbnailUrl,
      channel_name: channelName,
      channel_id: channelId,
    };
  } catch {
    return null;
  }
}

function extractVideosFromInitialData(data: YouTubeInitialData): { videos: ExtractedVideo[]; continuation: string | null } {
  const videos: ExtractedVideo[] = [];
  let continuation: string | null = null;

  try {
    const primaryContents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer;

    if (primaryContents?.contents) {
      for (const section of primaryContents.contents) {
        if (section.itemSectionRenderer?.contents) {
          for (const item of section.itemSectionRenderer.contents) {
            if (item.videoRenderer) {
              const extracted = extractVideoFromRenderer(item.videoRenderer);
              if (extracted) {
                videos.push(extracted);
              }
            }
          }
        }
      }
    }

    if (primaryContents?.continuations) {
      continuation = primaryContents.continuations[0]?.nextContinuationData?.continuation || null;
    }
  } catch {
    // Continue with any videos already extracted
  }

  return { videos, continuation };
}

function extractVideosFromContinuation(data: YouTubeInitialData): { videos: ExtractedVideo[]; continuation: string | null } {
  const videos: ExtractedVideo[] = [];
  let continuation: string | null = null;

  try {
    if (data.onResponseReceivedCommands) {
      for (const command of data.onResponseReceivedCommands) {
        if (command.appendContinuationItemsAction?.continuationItems) {
          for (const item of command.appendContinuationItemsAction.continuationItems) {
            if (item.videoRenderer) {
              const extracted = extractVideoFromRenderer(item.videoRenderer);
              if (extracted) {
                videos.push(extracted);
              }
            } else if (item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
              continuation = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            }
          }
        }
      }
    }
  } catch {
    // Continue with any videos already extracted
  }

  return { videos, continuation };
}

async function fetchWithProxy(url: string): Promise<string> {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Proxy returned status ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Proxy fetch error:', error);
    throw error;
  }
}

export async function searchYouTubeVideos(query: string, continuation: string | null = null): Promise<SearchResult> {
  try {
    let htmlContent: string;

    if (!continuation) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;

      htmlContent = await fetchWithProxy(searchUrl);

      const match = htmlContent.match(/var ytInitialData\s*=\s*({.*?})/);
      if (!match || !match[1]) {
        return {
          videos: [],
          continuation: null,
        };
      }

      try {
        const jsonStr = match[1];
        const data: YouTubeInitialData = JSON.parse(jsonStr);
        const result = extractVideosFromInitialData(data);

        return {
          videos: result.videos,
          continuation: result.continuation,
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          videos: [],
          continuation: null,
        };
      }
    } else {
      const continuationUrl = `https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO90d0o_cE2DFOXJB8jJy9Z8V5iveSx_E`;

      const requestBody = {
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.01.00',
          },
        },
        continuation: continuation,
      };

      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(continuationUrl)}`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return {
          videos: [],
          continuation: null,
        };
      }

      const data: YouTubeInitialData = await response.json();
      const result = extractVideosFromContinuation(data);

      return {
        videos: result.videos,
        continuation: result.continuation,
      };
    }
  } catch (error) {
    console.error('YouTube search error:', error);
    return {
      videos: [],
      continuation: null,
    };
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
