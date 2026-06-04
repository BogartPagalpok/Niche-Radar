import { Youtube, TrendingUp, Search, Zap, BarChart3, Layers, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps): React.ReactElement {
  const { isDark } = useTheme();

  return (
    <div
      className="min-h-screen w-full overflow-y-auto"
      style={{ background: isDark ? '#070707' : '#EAEAEA' }}
    >
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
        
        {/* Logo + Brand */}
        <div className="text-center mb-10">
          <div
            className="flex items-center justify-center w-14 h-14 mx-auto mb-5"
            style={{
              background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-red)',
            }}
          >
            <Youtube size={28} strokeWidth={2} color="#FFFFFF" />
          </div>
          
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Niche Radar
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            YouTube Intelligence Platform
          </p>
        </div>

        {/* Hero Card */}
        <div
          style={{
            background: 'var(--bg-panel)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-clay-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '32px 24px',
            textAlign: 'center',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
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
                ? 'linear-gradient(90deg, transparent, rgba(255,51,51,0.3), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,51,51,0.5), transparent)',
            }}
          />
          
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '12px', position: 'relative' }}>
            Discover Trending Niches.
            <br />
            <span style={{ color: 'var(--yt-red)' }}>Reverse-Engineer Success.</span>
          </h2>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6, position: 'relative' }}>
            Analyze YouTube's top-performing videos, extract winning formulas, and generate ready-to-use scripts and thumbnail prompts — powered by AI.
          </p>

          <button
            onClick={onEnterApp}
            className="clay-btn-red flex items-center gap-2 mx-auto px-6 py-3"
            style={{ fontSize: '0.9rem', fontWeight: 700, position: 'relative' }}
          >
            Launch App
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-24">
          {[
            { icon: Search, title: 'Niche Discovery', desc: 'Search any topic and see top-performing videos instantly.' },
            { icon: TrendingUp, title: 'Trend Analysis', desc: 'Track view velocity and emerging topics in real-time.' },
            { icon: Zap, title: 'AI Script Generator', desc: 'Reverse-engineer viral videos into ready-to-record scripts.' },
            { icon: Layers, title: 'Keyword Clusters', desc: 'Discover semantic keyword groups driving search traffic.' },
          ].map(feature => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="stat-card flex items-start gap-3"
                style={{ cursor: 'default' }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-clay-sm)',
                  }}
                >
                  <Icon size={16} strokeWidth={2} color="var(--yt-red)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '0 0 2px', fontWeight: 500 }}>
            &copy; Illusive Studio
          </p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: '0 0 10px' }}>
            Developed by: Ian Lester Eclevia
          </p>
          
          {/* Legal Links Placeholder */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {/* Add links later:
            <a href="/privacy" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms</a>
            */}
          </div>

          <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', opacity: 0.5, margin: 0 }}>
            Niche Radar v1.0
          </p>
        </div>

      </div>
    </div>
  );
}
