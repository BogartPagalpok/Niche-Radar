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
      className="w-full h-full flex flex-row lg:flex-col relative border-none"
      style={{
        boxShadow: isDark
          ? 'inset 0 1px 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.5)'
          : 'inset 0 1px 0 rgba(255,255,255,1), 0 12px 30px rgba(0,0,0,0.05)',
      }}
    >
      {/* 3D Top highlight stripe */}
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

      {/* MOBILE BOTTOM NAV - Horizontal on small screens */}
      <div className="flex lg:hidden w-full h-16 flex-row items-center justify-between px-4 overflow-x-auto gap-1">
        {allNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center justify-center flex-shrink-0 transition-transform active:scale-95"
              style={{
                width: '44px',
                height: '44px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255,51,51,0.15), rgba(255,0,0,0.05))'
                  : 'transparent',
                borderRadius: '12px',
                border: isActive ? '1px solid rgba(255,51,51,0.2)' : '1px solid transparent',
                boxShadow: isActive ? 'var(--shadow-clay-sm)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={item.label}
            >
              <Icon
                size={18}
                strokeWidth={2.5}
                color={isActive ? 'var(--yt-red)' : 'var(--text-tertiary)'}
              />
            </button>
          );
        })}

        {/* Theme Toggle - Mobile */}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center flex-shrink-0 active:scale-95"
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--bg-surface)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-clay-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Toggle theme"
          >
            {isDark ? (
              <Sun size={15} strokeWidth={2.5} color="var(--text-secondary)" />
            ) : (
              <Moon size={15} strokeWidth={2.5} color="var(--text-secondary)" />
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP SIDEBAR - Vertical on large screens */}
      <div className="hidden lg:flex flex-col h-full w-full py-2">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-5 flex-shrink-0">
          <div
            className="flex items-center justify-center w-9 h-9 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(255,0,0,0.3)',
            }}
          >
            <Youtube size={18} strokeWidth={2} color="#FFFFFF" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)', margin: 0 }}>
              Niche Radar
            </p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)', margin: 0, marginTop: '1px' }}>
              YouTube Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Grid Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5 flex flex-col custom-scroll">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="flex flex-col gap-1">
              <p className="text-[9px] font-bold tracking-widest text-uppercase px-3 mb-1" style={{ color: 'var(--text-tertiary)' }}>
                {section.label}
              </p>

              <div className="flex flex-col gap-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.99] group text-left"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(255,51,51,0.15), rgba(255,0,0,0.08))'
                          : 'transparent',
                        border: isActive ? '1px solid rgba(255,51,51,0.25)' : '1px solid transparent',
                        boxShadow: isActive ? 'var(--shadow-clay-sm)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          size={16}
                          strokeWidth={isActive ? 2.5 : 2}
                          color={isActive ? 'var(--yt-red)' : 'var(--text-secondary)'}
                          className="transition-transform group-hover:scale-105"
                        />
                        <span
                          className="text-xs font-medium tracking-wide truncate"
                          style={{
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                      
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white px-1.5 py-0.5 rounded-md shadow-sm animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme Toggle - Desktop Footer */}
        <div className="p-3 mt-auto border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all active:scale-[0.98]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-clay-sm)',
              cursor: 'pointer',
            }}
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun size={15} strokeWidth={2} color="var(--text-secondary)" />
              ) : (
                <Moon size={15} strokeWidth={2} color="var(--text-secondary)" />
              )}
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            <div
              className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ${
                isDark ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-200 ${
                  isDark ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
