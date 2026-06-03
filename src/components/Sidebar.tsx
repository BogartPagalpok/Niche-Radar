import {
  TrendingUp,
  Search,
  Layers,
  Settings,
  BarChart3,
  BookMarked,
  Zap,
  Sun,
  Moon,
  Youtube,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ActiveView =
  | 'dashboard'
  | 'niche-search'
  | 'trend-analysis'
  | 'keyword-clusters'
  | 'competitor-scout'
  | 'saved-niches'
  | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

interface NavSection {
  label: string;
  items: { id: ActiveView; icon: React.ElementType; label: string; badge?: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Core Tools',
    items: [
      { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
      { id: 'niche-search', icon: Search, label: 'Niche Search', badge: 'New' },
      { id: 'trend-analysis', icon: TrendingUp, label: 'Trend Analysis' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'keyword-clusters', icon: Layers, label: 'Keyword Clusters' },
      { id: 'competitor-scout', icon: Zap, label: 'Competitor Scout' },
      { id: 'saved-niches', icon: BookMarked, label: 'Saved Niches' },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', icon: Settings, label: 'App Settings' }],
  },
];

export default function Sidebar({ activeView, onNavigate }: SidebarProps): React.ReactElement {
  const { isDark, toggleTheme } = useTheme();

  const allNavItems = NAV_SECTIONS.flatMap(section => section.items);

  return (
    <aside
      className="w-full h-16 lg:w-64 lg:h-full lg:flex-col flex flex-row flex-shrink-0 z-10 border-t lg:border-t-0 lg:border-r"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-subtle)',
        boxSizing: 'border-box',
        boxShadow: isDark
          ? 'inset -4px 0 20px rgba(0,0,0,0.2)'
          : 'inset -4px 0 16px rgba(0,0,0,0.02)',
      }}
    >
      {/* MOBILE BOTTOM NAV - Horizontal on small screens */}
      <div className="flex lg:hidden w-full h-16 flex-row items-center justify-between px-4 gap-0 overflow-x-auto box-border">
        {allNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-0 flex-shrink-0"
              style={{
                width: '48px',
                height: '48px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255,51,51,0.2), rgba(255,0,0,0.1))'
                  : 'transparent',
                borderRadius: '12px',
                border: isActive ? '1px solid rgba(255,51,51,0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                padding: '0px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                if (!isActive) {
                  el.style.background = 'var(--bg-surface)';
                  el.style.boxShadow = 'var(--shadow-clay-sm)';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                if (!isActive) {
                  el.style.background = 'transparent';
                  el.style.boxShadow = 'none';
                }
              }}
              title={item.label}
            >
              <Icon
                size={20}
                strokeWidth={2}
                color={isActive ? 'var(--yt-red)' : 'var(--text-tertiary)'}
                style={{
                  transition: 'all 200ms ease',
                }}
              />
            </button>
          );
        })}

        {/* Theme Toggle - Mobile */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = 'var(--shadow-clay-sm)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.boxShadow = 'none';
            }}
            title="Toggle theme"
          >
            {isDark ? (
              <Sun size={16} strokeWidth={2} color="var(--text-secondary)" />
            ) : (
              <Moon size={16} strokeWidth={2} color="var(--text-secondary)" />
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP SIDEBAR - Vertical on large screens */}
      <div className="hidden lg:flex flex-col h-full w-full" style={{ boxSizing: 'border-box' }}>
        {/* Logo Section */}
        <div
          className="flex items-center gap-3 flex-shrink-0"
          style={{
            padding: '1.5rem 1rem 1.5rem 1rem',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-red)',
            }}
          >
            <Youtube size={20} strokeWidth={2} color="#FFFFFF" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: '0px',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
              }}
            >
              Niche Radar
            </p>
            <p
              style={{
                margin: '0px',
                marginTop: '2px',
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                fontWeight: 500,
                lineHeight: '1.2',
              }}
            >
              YouTube Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav
          className="flex-1 overflow-y-auto"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%', boxSizing: 'border-box' }}>
              <p
                style={{
                  margin: '0px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  paddingLeft: '0.75rem',
                  marginBottom: '0.25rem',
                }}
              >
                {section.label}
              </p>

              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    style={{
                      width: '100%',
                      height: '40px',
                      minHeight: '40px',
                      boxSizing: 'border-box',
                      padding: '0rem 0.75rem',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(255,51,51,0.15), rgba(255,0,0,0.08))'
                        : 'transparent',
                      border: isActive ? '1px solid rgba(255,51,51,0.25)' : '1px solid transparent',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      transition: 'all 200ms ease',
                      color: isActive ? 'var(--yt-red)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!isActive) {
                        el.style.background = 'var(--bg-surface)';
                        el.style.boxShadow = 'var(--shadow-clay-sm)';
                      }
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!isActive) {
                        el.style.background = 'transparent';
                        el.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={2}
                      color={isActive ? 'var(--yt-red)' : 'var(--text-secondary)'}
                      style={{ flexShrink: 0 }}
                    />
                    <span 
                      style={{ 
                        flex: 1, 
                        textAlign: 'left', 
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          background: 'var(--yt-red)',
                          color: '#FFFFFF',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          lineHeight: '1',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight
                        size={14}
                        strokeWidth={2.5}
                        color="var(--yt-red)"
                        style={{
                          flexShrink: 0,
                          marginLeft: '2px',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Theme Toggle & Footer Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: '1rem 1rem 1.25rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              height: '40px',
              minHeight: '40px',
              boxSizing: 'border-box',
              padding: '0rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 200ms ease',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
              el.style.boxShadow = 'var(--shadow-clay-sm)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--bg-surface)';
              el.style.boxShadow = 'none';
            }}
          >
            {isDark ? (
              <>
                <Sun size={16} strokeWidth={2} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', lineHeight: '1' }}>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={16} strokeWidth={2} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'left', lineHeight: '1' }}>Dark Mode</span>
              </>
            )}
          </button>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              fontWeight: 500,
              paddingTop: '0.25rem',
              boxSizing: 'border-box',
              lineHeight: '1.3',
            }}
          >
            <p style={{ margin: '0px', marginBottom: '2px' }}>Niche Radar v1.0</p>
            <p style={{ margin: '0px', opacity: 0.7 }}>Powered by YouTube Intelligence</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
