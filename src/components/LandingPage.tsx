import { Youtube, TrendingUp, Search, Zap, BarChart3, Layers, ArrowRight, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps): React.ReactElement {
  const { isDark } = useTheme();

  return (
    <div
      className="min-h-screen w-full overflow-y-auto"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #0a0a0a 0%, #111111 30%, #0a0a0a 100%)'
          : 'linear-gradient(180deg, #f5f5f5 0%, #ffffff 30%, #f5f5f5 100%)',
      }}
    >
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Logo */}
        <div
          className="flex items-center justify-center w-16 h-16 mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
            borderRadius: '18px',
            boxShadow: '0 8px 30px rgba(255,0,0,0.3)',
          }}
        >
          <Youtube size={32} strokeWidth={2} color="#FFFFFF" />
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: isDark ? 'rgba(255,51,51,0.1)' : 'rgba(255,51,51,0.08)',
            border: '1px solid rgba(255,51,51,0.2)',
          }}
        >
          <Star size={14} fill="#FF0000" color="#FF0000" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF3333' }}>
            YouTube Intelligence Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            marginBottom: '20px',
          }}
        >
          Discover Trending Niches.
          <br />
          <span style={{ color: 'var(--yt-red)' }}>Reverse-Engineer Success.</span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Niche Radar analyzes YouTube's top-performing videos, extracts their winning formulas,
          and generates ready-to-use scripts and thumbnail prompts — powered by AI.
        </p>

        {/* CTA Button */}
        <button
          onClick={onEnterApp}
          className="flex items-center gap-2 mx-auto px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #FF3333, #CC0000)',
            boxShadow: '0 8px 30px rgba(255,0,0,0.35)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(255,0,0,0.45)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(255,0,0,0.35)';
          }}
        >
          Launch App
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Features Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Search,
              title: 'Niche Discovery',
              description: 'Search any topic and instantly see the top-performing videos in that niche.',
              color: '#FF0000',
            },
            {
              icon: TrendingUp,
              title: 'Trend Analysis',
              description: 'Track view velocity, channel dominance, and emerging topics in real-time.',
              color: '#3B82F6',
            },
            {
              icon: Zap,
              title: 'AI Script Generator',
              description: 'Reverse-engineer viral videos into ready-to-record scripts with Gemini AI.',
              color: '#F59E0B',
            },
            {
              icon: Layers,
              title: 'Keyword Clusters',
              description: 'Discover semantic keyword groups that drive search traffic to your niche.',
              color: '#10B981',
            },
          ].map(feature => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                style={{
                  background: 'var(--bg-panel)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.04)',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark
                    ? '0 12px 30px rgba(0,0,0,0.5)'
                    : '0 12px 30px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 20px rgba(0,0,0,0.04)';
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `${feature.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <Icon size={20} strokeWidth={2} color={feature.color} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '40px',
            letterSpacing: '-0.02em',
          }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Search a Niche', description: 'Enter any topic or keyword to find the most viewed videos in that space.' },
            { step: '02', title: 'Analyze Performance', description: 'View detailed metrics, channel stats, and keyword clusters from real data.' },
            { step: '03', title: 'Generate Content', description: 'Get AI-written scripts and thumbnail prompts modeled after top performers.' },
          ].map(item => (
            <div key={item.step} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FF3333, #CC0000)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  margin: '0 auto 16px',
                  boxShadow: '0 6px 20px rgba(255,0,0,0.3)',
                }}
              >
                {item.step}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="text-center py-10 px-6"
        style={{
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
          &copy; Illusive Studio
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: '0 0 12px' }}>
          Developed by: Ian Lester Eclevia
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Add your legal links here */}
          <button
            onClick={onEnterApp}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: 'var(--yt-red)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Enter App
          </button>
        </div>
      </div>
    </div>
  );
}
