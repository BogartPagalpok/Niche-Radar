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
    <div className="h-full flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div
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
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
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
    <div className="flex flex-col lg:flex-row min-h-screen w-full overflow-hidden" style={{ background: '#0F0F0F' }}>
      {/* SIDEBAR - Bottom nav on mobile, left sidebar on desktop */}
      <div className="w-full h-16 fixed bottom-0 left-0 z-50 flex lg:static lg:w-64 lg:h-screen lg:flex-col lg:z-auto lg:bottom-auto">
        <Sidebar activeView={activeView} onNavigate={setActiveView} />
      </div>

      {/* MAIN CONTENT WRAPPER - Responsive padding and gap */}
      <div className="flex flex-col lg:flex-row w-full flex-1 overflow-hidden gap-4 sm:gap-5 lg:gap-6 p-4 sm:p-5 lg:p-6 pb-20 lg:pb-6" style={{ background: '#0F0F0F' }}>
        {/* LEFT COLUMN — Mobile: full width, Desktop: 40% */}
        <div className="w-full lg:w-[40%] min-w-0 h-auto lg:h-screen lg:overflow-hidden flex flex-col pt-0 lg:pt-0">
          <div
            className="flex-1 overflow-hidden flex flex-col relative rounded-3xl"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
              border: 'none',
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
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                zIndex: 1,
              }}
            />

            {/* Bottom inset shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
                borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
                zIndex: 1,
              }}
            />

            <div
              className="custom-scroll flex-1 overflow-y-auto p-6 lg:p-8 relative"
              style={{
                padding: 'var(--spacing-6) var(--spacing-6)',
              }}
            >
              {renderLeftContent()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Mobile: full width (below left), Desktop: 60% */}
        <div className="w-full lg:w-[60%] min-w-0 h-auto lg:h-screen lg:overflow-hidden flex flex-col gap-3 lg:gap-4 pb-4 lg:pb-0">
          {/* Top strip — contextual info bar */}
          <div
            className="flex-shrink-0 rounded-3xl px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4 relative overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.5)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 16px rgba(0,0,0,0.04)',
              border: 'none',
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

            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-red)',
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

            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                }}
              >
                Processing Workspace
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-tertiary)',
                  marginLeft: '8px',
                }}
              >
                — Select any item to analyze
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span
                className="clay-tag-mint"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.65rem',
                }}
              >
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--mint-text)',
                    display: 'inline-block',
                  }}
                />
                Ready
              </span>
            </div>
          </div>

          {/* Main workspace */}
          <div
            className="flex-1 overflow-hidden relative rounded-3xl"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: isDark
                ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.7)'
                : 'inset 0 1px 0 rgba(255,255,255,1), 0 20px 40px rgba(0,0,0,0.06)',
              border: 'none',
            }}
          >
            {/* Bevel */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                zIndex: 1,
              }}
            />

            <div
              className="custom-scroll h-full overflow-y-auto p-6 lg:p-8"
              style={{
                padding: 'var(--spacing-6) var(--spacing-8)',
              }}
            >
              <RightPanelContent view={activeView} />
            </div>
          </div>

          {/* Bottom strip — mini stats row */}
          <div
            className="flex-shrink-0 hidden lg:grid grid-cols-4 gap-2 lg:gap-3"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
            }}
          >
            {[
              { label: 'API Status', value: 'Connected', color: '#22C55E' },
              { label: 'Cache', value: '2.4 MB', color: 'var(--text-secondary)' },
              { label: 'Requests', value: '1,284', color: 'var(--text-secondary)' },
              { label: 'Last Sync', value: '4m ago', color: '#F59E0B' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'var(--bg-panel)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-clay)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.75rem 0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <VideoProvider>
        <AppShell />
      </VideoProvider>
    </ThemeProvider>
  );
}
