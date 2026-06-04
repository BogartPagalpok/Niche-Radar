import { createContext, useContext, useState } from 'react';
import { type ExtractedVideo } from '../services/youtubeScraper';

interface VideoContextValue {
  selectedVideo: ExtractedVideo | null;
  selectVideo: (video: ExtractedVideo) => void;
  clearSelection: () => void;
  searchedVideos: ExtractedVideo[];
  setSearchedVideos: (videos: ExtractedVideo[]) => void;
  savedNiches: ExtractedVideo[];
  saveVideoToNiches: (video: ExtractedVideo) => void;
  removeVideoFromNiches: (videoId: string) => void;
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
});

export function VideoProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [selectedVideo, setSelectedVideo] = useState<ExtractedVideo | null>(null);
  
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
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext(): VideoContextValue {
  return useContext(VideoContext);
}
