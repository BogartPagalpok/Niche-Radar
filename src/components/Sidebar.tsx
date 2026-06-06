import {
  TrendingUp,
  Search,
  Layers,
  Settings,
  BarChart3,
  BookMarked,
  Zap,
  ChevronRight,
  FileText,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ActiveView =
  | 'dashboard'
  | 'niche-search'
  | 'trend-analysis'
  | 'keyword-clusters'
  | 'competitor-scout'
  | 'saved-niches'
  | 'generated-analyses'
  | 'settings';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onLogout?: () => void;
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
      { id: 'generated-analyses', icon: FileText, label: 'Generated Analyses' },
    ],
  },
  {
    label: 'System',
    items: [{ id: 'settings', icon: Settings, label: 'App Settings' }],
  },
];

const MOBILE_ITEMS: ActiveView[] = ['dashboard', 'niche-search', 'trend-analysis', 'competitor-scout', 'saved-niches'];

const ITEM_MAP = NAV_SECTIONS.flatMap(s => s.items).reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {} as Record<ActiveView, (typeof NAV_SECTIONS)[0]['items'][0]>);

export default function Sidebar({ activeView, onNavigate, onLogout }: SidebarProps): React.ReactElement {
  const { isDark, toggleTheme } = useTheme();

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <div className="flex lg:hidden w-full items-center justify-center p-0 fixed bottom-4 left-0 right-0 z-50 bg-transparent">
        <div 
          className="flex flex-row items-center justify-between w-[calc(100%-32px)] sm:w-[calc(100%-40px)] max-w-[420px]"
          style={{ 
            background: isDark ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '24px',
            padding: '6px',
            boxShadow: isDark 
              ? '0 12px 40px 0 rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
              : '0 12px 40px 0 rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
            transition: 'background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
          }}
        >
          {MOBILE_ITEMS.map(id => {
            const item = ITEM_MAP[id];
            if (!item) return null;
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-row items-center justify-center gap-2 flex-shrink-0 transition-all duration-300 ease-out"
                style={{
                  flex: isActive ? '1 0 auto' : '0 0 auto',
                  width: isActive ? 'auto' : '44px',
                  height: '44px',
                  padding: isActive ? '0 16px' : '0',
                  background: isActive 
                    ? isDark
                      ? 'linear-gradient(135deg, rgba(255,51,51,0.18) 0%, rgba(204,0,0,0.1) 100%)' 
                      : 'linear-gradient(135deg, rgba(255,51,51,0.12) 0%, rgba(255,0,0,0.06) 100%)'
                    : 'transparent',
                  border: isActive 
                    ? isDark 
                      ? '1px solid rgba(255,51,51,0.3)' 
                      : '1px solid rgba(255,51,51,0.2)' 
                    : '1px solid transparent',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
                title={item.label}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? 'var(--yt-red)' : isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  style={{ transition: 'color 200ms ease', flexShrink: 0 }}
                />
                {isActive && (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--yt-red)',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}

          {/* MOBILE INLINE TOGGLE PANEL ROW LINK */}
          <div 
            onClick={toggleTheme}
            style={{
              width: '42px',
              height: '24px',
              backgroundColor: isDark ? '#1D1F2C' : '#3D7EAE',
              borderRadius: '100px',
              position: 'relative',
              transition: 'all 0.3s ease',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              marginRight: '4px',
              flexShrink: 0,
            }}
          >
            <div 
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: isDark ? '#C4C9D1' : '#ECCA2F',
                position: 'absolute',
                top: '3px',
                left: isDark ? '21px' : '3px',
                transition: 'all 0.3s cubic-bezier(0, -0.02, 0.35, 1.17)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              {isDark && (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <div style={{ position: 'absolute', top: '4px', left: '2px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#959DB1' }} />
                  <div style={{ position: 'absolute', top: '10px', left: '9px', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#959DB1' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden lg:flex flex-col h-full w-full flex-shrink-0"
        style={{
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-subtle)',
          boxSizing: 'border-box',
        }}
      >
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
              borderRadius: '12px',
              boxShadow: 'var(--shadow-red)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/logo.png"
              alt="Niche Radar logo"
              width={40}
              height={40}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
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

        {/* Footer Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '0.75rem 1rem 1rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          {/* DESKTOP FOOTER FLUSH TOGGLE BLOCK */}
          <div
            onClick={toggleTheme}
            style={{
              width: '100%',
              height: '44px',
              boxSizing: 'border-box',
              padding: '0rem 0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: 'var(--shadow-clay-sm)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
            
            {/* INLINE SELF-CONTAINED TOGGLE INNER LAYOUT */}
            <div 
              style={{
                width: '54px',
                height: '26px',
                backgroundColor: isDark ? '#1D1F2C' : '#3D7EAE',
                borderRadius: '100px',
                position: 'relative',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              {/* Sliding Sun/Moon Core Element */}
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? '#C4C9D1' : '#ECCA2F',
                  position: 'absolute',
                  top: '3px',
                  left: isDark ? '31px' : '3px',
                  transition: 'all 0.3s cubic-bezier(0, -0.02, 0.35, 1.17)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  display: 'flex',
                  overflow: 'hidden',
                }}
              >
                {/* Moon Spots */}
                {isDark && (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <div style={{ position: 'absolute', top: '5px', left: '3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#959DB1' }} />
                    <div style={{ position: 'absolute', top: '11px', left: '10px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#959DB1' }} />
                    <div style={{ position: 'absolute', top: '3px', left: '11px', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#959DB1' }} />
                  </div>
                )}
              </div>

              {/* Decorative Cloud/Stars Layer */}
              {!isDark ? (
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '-4px', 
                    right: '4px', 
                    width: '24px', 
                    height: '10px', 
                    backgroundColor: '#F3FDFF', 
                    borderRadius: '10px',
                    opacity: 0.8
                  }} 
                />
              ) : (
                <div style={{ position: 'absolute', left: '6px', top: '6px', display: 'flex', gap: '4px', opacity: 0.6 }}>
                  <div style={{ width: '2px', height: '2px', backgroundColor: '#FFF', borderRadius: '50%' }} />
                  <div style={{ width: '3px', height: '3px', backgroundColor: '#FFF', borderRadius: '50%', transform: 'translateY(4px)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2"
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Log out (your API keys & settings are kept)"
            >
              <LogOut size={13} strokeWidth={2.5} />
              Log out
            </button>
          )}

          {/* Credits */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <p style={{ margin: '0px', fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              &copy; Illusive Studio
            </p>
            <p style={{ margin: '0px', marginTop: '1px', fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 400, opacity: 0.7 }}>
              Developed by: Ian Lester Eclevia
            </p>
          </div>

          {/* Version */}
          <p style={{ margin: '0px', fontSize: '0.58rem', color: 'var(--text-tertiary)', textAlign: 'center', opacity: 0.5 }}>
            Niche Radar v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
