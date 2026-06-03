import {
  Radio,
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
      className="w-full h-16 lg:w-64 lg:h-full lg:flex-col flex flex-row"
      style={{
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '0px',
        borderBottom: '0px',
        boxShadow: isDark
          ? 'inset 0 4px 20px rgba(0,0,0,0.4)'
          : 'inset 0 4px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* MOBILE BOTTOM NAV - Horizontal on small screens */}
      <div className="flex lg:hidden w-full h-16 flex-row items-center justify-between px-2 gap-0 overflow-x-auto">
        {allNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center gap-0 flex-shrink-0"
              style={{
                width: '56px',
                height: '56px',
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
        <div style={{ marginLeft: 'auto' }}>
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
      <div className="hidden lg:flex flex-col h-full">
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 pt-6 pb-5 flex-shrink-0"
          style={{
            padding: '1.5rem 1.25rem 1.25rem 1.25rem',
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
              }}
            >
              YouTube Intelligence
            </p>
          </div>
        </div>

        {/* Navigation sections */}
        <nav
          className="flex-1 overflow-y-auto px-3 space-y-6"
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {NAV_SECTIONS.map(section => (
            <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p
                style={{
                  margin: '0px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  paddingLeft: '0.75rem',
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
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.75rem',
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
                    <span style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
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
                          marginLeft: '4px',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Theme toggle and footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
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
                <Sun size={16} strokeWidth={2} color="var(--text-secondary)" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon size={16} strokeWidth={2} color="var(--text-secondary)" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              fontWeight: 500,
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
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
