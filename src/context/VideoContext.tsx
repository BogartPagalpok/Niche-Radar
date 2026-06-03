import { createContext, useContext, useState } from 'react';
import { type ExtractedVideo } from '../services/youtubeScraper';

interface VideoContextValue {
  selectedVideo: ExtractedVideo | null;
  selectVideo: (video: ExtractedVideo) => void;
  clearSelection: () => void;
}

const VideoContext = createContext<VideoContextValue>({
  selectedVideo: null,
  selectVideo: () => {},
  clearSelection: () => {},
});

export function VideoProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [selectedVideo, setSelectedVideo] = useState<ExtractedVideo | null>(null);

  const selectVideo = (video: ExtractedVideo): void => {
    setSelectedVideo(video);
  };

  const clearSelection = (): void => {
    setSelectedVideo(null);
  };

  return (
    <VideoContext.Provider value={{ selectedVideo, selectVideo, clearSelection }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext(): VideoContextValue {
  return useContext(VideoContext);
}
