import { createContext, useContext, useState } from 'react';
import { type ExtractedVideo } from '../services/youtubeScraper';

export interface SavedAnalysisFolderItem {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  channel_name: string;
  analyzedAt: string;
  metrics: any | null;
  scriptPrompt: string;
  thumbnailPrompt: string;
}

interface VideoContextValue {
  selectedVideo: ExtractedVideo | null;
  selectVideo: (video: ExtractedVideo) => void;
  clearSelection: () => void;
  searchedVideos: ExtractedVideo[];
  setSearchedVideos: (videos: ExtractedVideo[]) => void;
  savedNiches: ExtractedVideo[];
  saveVideoToNiches: (video: ExtractedVideo) => void;
  removeVideoFromNiches: (videoId: string) => void;
  analysisFolder: Record<string, SavedAnalysisFolderItem>;
  saveAnalysisToFolder: (video: ExtractedVideo, metrics: any, scriptPrompt: string, thumbnailPrompt: string) => void;
}

const VideoContext = createContext<VideoContextValue>({
  selectedVideo: null,
  selectVideo: () => {},
  clearSelection: () => {},
  searchedVideos: [],
  setSearchedVideos: () => {},
  savedNiches: [],
  saveVideoToNiches: () => {},
  removeVideoFromNiches: () => {},
  analysisFolder: {},
  saveAnalysisToFolder: () => {},
});

export function VideoProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Restore the previously selected video so switching tabs / reloading does
  // not blank out the analysis panel.
  const [selectedVideo, setSelectedVideo] = useState<ExtractedVideo | null>(() => {
    try {
      const stored = localStorage.getItem('niche-radar-selected-video');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Load from localStorage on init
  const [searchedVideos, setSearchedVideosState] = useState<ExtractedVideo[]>(() => {
    try {
      const stored = localStorage.getItem('niche-radar-search-results');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Wrapper that also saves to localStorage
  const setSearchedVideos = (videos: ExtractedVideo[]) => {
    setSearchedVideosState(videos);
    try {
      localStorage.setItem('niche-radar-search-results', JSON.stringify(videos));
    } catch {
      // Storage full or unavailable
    }
  };

  const [savedNiches, setSavedNiches] = useState<ExtractedVideo[]>(() => {
    const stored = localStorage.getItem('niche-radar-saved-niches');
    try {
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [analysisFolder, setAnalysisFolder] = useState<Record<string, SavedAnalysisFolderItem>>(() => {
    try {
      const saved = localStorage.getItem('niche-radar-analysis-folder');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const selectVideo = (video: ExtractedVideo): void => {
    setSelectedVideo(video);
    // Also persist selected video
    try {
      localStorage.setItem('niche-radar-selected-video', JSON.stringify(video));
    } catch {}
  };

  const clearSelection = (): void => {
    setSelectedVideo(null);
    localStorage.removeItem('niche-radar-selected-video');
  };

  const saveVideoToNiches = (video: ExtractedVideo): void => {
    setSavedNiches(prev => {
      if (prev.some(v => v.video_id === video.video_id)) return prev;
      const updated = [...prev, video];
      localStorage.setItem('niche-radar-saved-niches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeVideoFromNiches = (videoId: string): void => {
    setSavedNiches(prev => {
      const updated = prev.filter(v => v.video_id !== videoId);
      localStorage.setItem('niche-radar-saved-niches', JSON.stringify(updated));
      return updated;
    });
  };

  const saveAnalysisToFolder = (video: ExtractedVideo, metrics: any, scriptPrompt: string, thumbnailPrompt: string): void => {
    setAnalysisFolder(prev => {
      const updated = {
        ...prev,
        [video.video_id]: {
          video_id: video.video_id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          channel_name: video.channel_name,
          analyzedAt: new Date().toLocaleString(),
          metrics,
          scriptPrompt,
          thumbnailPrompt,
        }
      };
      try {
        localStorage.setItem('niche-radar-analysis-folder', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <VideoContext.Provider
      value={{
        selectedVideo,
        selectVideo,
        clearSelection,
        searchedVideos,
        setSearchedVideos,
        savedNiches,
        saveVideoToNiches,
        removeVideoFromNiches,
        analysisFolder,
        saveAnalysisToFolder,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext(): VideoContextValue {
  return useContext(VideoContext);
}
