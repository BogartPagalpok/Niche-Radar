import { Youtube, TrendingUp, Search, Zap, Settings, Layers, ArrowRight, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps): React.ReactElement {
  const { isDark } = useTheme();

  return (
    <div
      className="min-h-screen w-full overflow-y-auto custom-scroll"
      style={{ background: 'var(--bg-root)' }}
    >
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        
        {/* LEFT — Hero */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-0">
          <div style={{ maxWidth: '420px' }}>
            {/* Logo */}
            <div
              className="flex items-center justify-center w-12 h-12 mb-6"
              style={{
                background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-red)',
              }}
            >
              <Youtube size={24} strokeWidth={2} color="#FFFFFF" />
            </div>

            <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '12px', lineHeight: 1.15 }}>
              Discover Trending Niches.
              <br />
              <span style={{ color: 'var(--yt-red)' }}>Reverse-Engineer Success.</span>
            </h1>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Analyze YouTube's top-performing videos, extract winning formulas, and generate ready-to-use scripts and thumbnail prompts — powered by AI.
            </p>

            <button
              onClick={onEnterApp}
              className="clay-btn-red flex items-center gap-2 px-6 py-3"
              style={{ fontSize: '0.9rem', fontWeight: 700 }}
            >
              Launch App
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>

            {/* Footer — only on desktop left side */}
            <div className="hidden lg:block" style={{ marginTop: '48px' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>
                &copy; Illusive Studio
              </p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: 0 }}>
                Developed by: Ian Lester Eclevia
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Features + Steps */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-0">
          <div style={{ maxWidth: '480px', width: '100%' }} className="flex flex-col gap-3">
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Search, title: 'Niche Discovery', desc: 'Search any topic and see top-performing videos instantly.' },
                { icon: TrendingUp, title: 'Trend Analysis', desc: 'Track view velocity and emerging topics in real-time.' },
                { icon: Zap, title: 'AI Script Generator', desc: 'Reverse-engineer viral videos into ready-to-record scripts.' },
                { icon: Layers, title: 'Keyword Clusters', desc: 'Discover semantic keyword groups driving search traffic.' },
              ].map(feature => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="stat-card flex items-start gap-3" style={{ cursor: 'default' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-clay-sm)' }}>
                      <Icon size={15} strokeWidth={2} color="var(--yt-red)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{feature.title}</h3>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Steps */}
            <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-clay-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              {[
                { step: '1', title: 'Add your Gemini API key', desc: 'Get a free key at aistudio.google.com, paste it in App Settings. No credit card.', icon: Settings },
                { step: '2', title: 'Search any niche', desc: 'Enter a topic. Get real YouTube results with channel data and trends.', icon: Search },
                { step: '3', title: 'Generate AI scripts', desc: 'Click a video. Get ready-to-record scripts and thumbnail prompts.', icon: Zap },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} style={{ display: 'flex', gap: '12px', padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF3333, #CC0000)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0, boxShadow: 'var(--shadow-red)' }}>
                      {item.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                        <Icon size={13} strokeWidth={2} color="var(--yt-red)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BYOK */}
            <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-clay)', border: '1px solid var(--border-subtle)', padding: '14px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                🔑 <strong style={{ color: 'var(--text-primary)' }}>Bring Your Own Keys.</strong> Free and open-source. Keys stay in your browser.{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yt-red)', fontWeight: 600 }}>
                  Get a key →
                </a>
              </p>
            </div>

            {/* Footer — mobile only */}
            <div className="lg:hidden text-center" style={{ paddingTop: '4px' }}>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: '0 0 2px' }}>&copy; Illusive Studio</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: 0 }}>Developed by: Ian Lester Eclevia &nbsp;|&nbsp; v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
