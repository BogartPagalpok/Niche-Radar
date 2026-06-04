import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { VideoProvider, useVideoContext } from './context/VideoContext';
import { LoadingProvider } from './context/LoadingContext';
import { checkProxyHealth } from './services/proxyHealthCheck';
import { ErrorBoundary } from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import Sidebar, { type ActiveView } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NicheSearch from './components/NicheSearch';
import TrendAnalysis from './components/TrendAnalysis';
import KeywordClusters from './components/KeywordClusters';
import CompetitorScout from './components/CompetitorScout';
import SavedNiches from './components/SavedNiches';
import AppSettings from './components/AppSettings';
import { VideoDetailView } from './components/VideoDetailView';
import { X } from 'lucide-react';

function RightPanelContent({ view, onClose }: { view: ActiveView; onClose?: () => void }): React.ReactElement {
  const { selectedVideo } = useVideoContext();

  if (selectedVideo) {
    return (
      <div className="relative h-full">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-black/50 text-white lg:hidden"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <X size={18} />
          </button>
        )}
        <VideoDetailView video={selectedVideo} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 py-12">
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-clay-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
            border: '1.5px solid rgba(34,197,94,0.3)',
            boxShadow: 'var(--shadow-clay-sm)',
          }}
        />
      </div>
      <div style={{ textAlign: 'center' }} className="px-4">
        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Select a Video
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: 1.6 }}>
          Click any video from the left panel to view full details, AI script analysis, and thumbnail prompts
        </p>
      </div>
    </div>
  );
}

function AppShell(): React.ReactElement {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [proxyReady, setProxyReady] = useState(false);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showLanding, setShowLanding] = useState(() => {
    return localStorage.getItem('niche-radar-landing-seen') !== 'true';
  });
  const { isDark } = useTheme();
  const { searchedVideos, selectVideo, selectedVideo, clearSelection } = useVideoContext();

  useEffect(() => {
    (async () => {
      const health = await checkProxyHealth();
      if (health.healthy) {
        setProxyReady(true);
        console.log('YouTube proxy is ready');
      } else {
        setProxyError(health.error || 'Proxy connection failed');
        console.warn('YouTube proxy failed:', health.error);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedVideo && window.innerWidth < 1024) {
      setShowMobileDetail(true);
    }
  }, [selectedVideo]);

  const handleSelectVideo = (video: typeof selectedVideo) => {
    if (video) {
      selectVideo(video);
    }
  };

  const handleCloseMobileDetail = () => {
    setShowMobileDetail(false);
  };

  const handleEnterApp = () => {
    localStorage.setItem('niche-radar-landing-seen', 'true');
    setShowLanding(false);
  };

  const renderLeftContent = (): React.ReactElement => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'niche-search':
        return <NicheSearch />;
      case 'trend-analysis':
        return <TrendAnalysis />;
      case 'keyword-clusters':
        return <KeywordClusters />;
      case 'competitor-scout':
        return <CompetitorScout videos={searchedVideos} onSelectVideo={handleSelectVideo} />;
      case 'saved-niches':
        return <SavedNiches />;
      case 'settings':
        return <AppSettings />;
      default:
        return <Dashboard />;
    }
  };

  // Show landing page on first visit
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-hidden" style={{ background: isDark ? '#070707' : '#EAEAEA' }}>
      <div className="w-full pointer-events-none fixed bottom-0 left-0 z-50 flex lg:sticky lg:top-0 lg:w-64 lg:h-screen lg:flex-col p-4 lg:p-6 lg:pr-0 box-border">
        <div className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden hidden lg:block lg:shadow-xl" style={{ background: 'var(--bg-panel)', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
        </div>
        <div className="lg:hidden w-full pointer-events-auto">
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full flex-1 min-w-0 gap-4 lg:gap-6 p-4 lg:p-6 pb-24 lg:pb-6 lg:h-screen box-border">
        <div className={`w-full lg:w-[40%] min-w-0 h-auto lg:h-full flex flex-col box-border ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          <div
            className="flex-1 flex flex-col relative rounded-3xl overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
                zIndex: 1,
              }}
            />
            <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
              {renderLeftContent()}
            </div>
          </div>
        </div>

        <div className={`w-full lg:w-[60%] min-w-0 h-auto lg:h-full flex flex-col gap-4 lg:gap-6 box-border ${showMobileDetail ? 'flex' : 'hidden lg:flex'}`}>
          {showMobileDetail && (
            <button
              onClick={handleCloseMobileDetail}
              className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold"
              style={{
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-clay)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <X size={16} />
              Back to results
            </button>
          )}

          <div
            className="flex-shrink-0 rounded-3xl px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between relative overflow-hidden hidden lg:flex"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.5)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1.5px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              }}
            />
            <div className="flex items-center gap-3 lg:gap-4">
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255,0,0,0.4)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '1px',
                    background: 'rgba(255,255,255,0.9)',
                  }}
                />
              </div>
              <span className="text-xs lg:text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
                Processing Workspace
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-green-500">Ready</span>
            </div>
          </div>

          <div
            className="flex-1 rounded-3xl relative overflow-hidden flex flex-col"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
            }}
          >
            <div className="custom-scroll flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
              <RightPanelContent view={activeView} onClose={handleCloseMobileDetail} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <VideoProvider>
          <LoadingProvider>
            <AppShell />
          </LoadingProvider>
        </VideoProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
