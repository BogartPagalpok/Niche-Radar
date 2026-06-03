import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { VideoProvider, useVideoContext } from './context/VideoContext';
import Sidebar, { type ActiveView } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NicheSearch from './components/NicheSearch';
import TrendAnalysis from './components/TrendAnalysis';
import KeywordClusters from './components/KeywordClusters';
import CompetitorScout from './components/CompetitorScout';
import SavedNiches from './components/SavedNiches';
import AppSettings from './components/AppSettings';
import { VideoDetailView } from './components/VideoDetailView';

function RightPanelContent({ view }: { view: ActiveView }): React.ReactElement {
  const { selectedVideo } = useVideoContext();

  if (view === 'niche-search' && selectedVideo) {
    return <VideoDetailView video={selectedVideo} />;
  }

  const labels: Record<ActiveView, string> = {
    dashboard: 'Data Overview',
    'niche-search': 'Video Details',
    'trend-analysis': 'Deep Trend View',
    'keyword-clusters': 'Cluster Explorer',
    'competitor-scout': 'Channel Deep Dive',
    'saved-niches': 'Niche Brief',
    settings: 'API Configuration',
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 animate-fade-in py-12">
      <div
        className="transition-transform duration-300 hover:scale-105"
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '22px',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-clay-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(255,0,0,0.15), rgba(255,0,0,0.05))',
            border: '1.5px solid rgba(255,0,0,0.2)',
            boxShadow: 'var(--shadow-clay-sm)',
          }}
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
          {labels[view]}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', maxWidth: '260px', lineHeight: 1.6 }}>
          Select an item from the left panel to load detailed analysis here.
        </p>
      </div>
      <div className="flex gap-2">
        {[40, 24, 32].map((w, i) => (
          <div
            key={i}
            style={{
              height: '6px',
              width: `${w}px`,
              borderRadius: '999px',
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-inset)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AppShell(): React.ReactElement {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { isDark } = useTheme();

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
        return <CompetitorScout />;
      case 'saved-niches':
        return <SavedNiches />;
      case 'settings':
        return <AppSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-x-hidden" style={{ background: isDark ? '#070707' : '#EAEAEA' }}>
      {/* SIDEBAR - Standing alone as its own floating card with a wrapper to force gutters */}
      <div className="w-full h-16 fixed bottom-0 left-0 z-50 flex lg:sticky lg:top-0 lg:w-64 lg:h-screen lg:flex-col p-2 lg:p-4">
        <div className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl" style={{ background: 'var(--bg-panel)', boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)' }}>
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
        </div>
      </div>

      {/* MAIN CONTENT WRAPPER - Restructures scrolling and spaces panels out correctly */}
      <div className="flex flex-col lg:flex-row w-full flex-1 overflow-x-hidden gap-4 sm:gap-5 lg:gap-6 p-4 sm:p-5 lg:p-6 pb-24 lg:pb-6">
        
        {/* LEFT COLUMN (40% Width) — Houses your search parameters inside scrollable rounded glass */}
        <div className="w-full lg:w-[40%] min-w-0 h-auto lg:h-[calc(100vh-3rem)] flex flex-col">
          <div
            className="flex-1 flex flex-col relative rounded-3xl overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
            }}
          >
            {/* Top bevel highlight */}
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

            {/* Main scrollable section inside left panel */}
            <div className="custom-scroll flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
              {renderLeftContent()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (60% Width) — Formats processing layout panel components perfectly */}
        <div className="w-full lg:w-[60%] min-w-0 h-auto lg:h-[calc(100vh-3rem)] flex flex-col gap-4">
          
          {/* Header Strip component inside right workspace console */}
          <div
            className="flex-shrink-0 rounded-3xl px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between relative overflow-hidden"
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

          {/* Core Analysis Area — Wraps your terminal generators and charts in a 3D glass card */}
          <div
            className="flex-1 rounded-3xl relative overflow-hidden flex flex-col"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
            }}
          >
            <div className="custom-scroll flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8">
              <RightPanelContent view={activeView} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <VideoProvider>
        <AppShell />
      </VideoProvider>
    </ThemeProvider>
  );
}
