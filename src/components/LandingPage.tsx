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
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full" style={{ maxWidth: '540px' }}>
            <h1 style={{ fontSize: 'clamp(2.8rem, 8.5vw, 4.2rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '24px', lineHeight: 1.02 }}>
              Discover Trending Niches.
              <br />
              <span style={{ 
                background: 'linear-gradient(135deg, #FF4D4D 0%, #FF0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Reverse-Engineer Success.
              </span>
            </h1>

            <p style={{ fontSize: 'clamp(1.05rem, 2.8vw, 1.15rem)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '480px' }}>
              Analyze YouTube's top-performing videos, extract winning formulas, and generate ready-to-use scripts and thumbnail prompts — powered by AI.
            </p>

            <button
              onClick={onEnterApp}
              className="clay-btn-red flex items-center justify-center lg:justify-start gap-2 px-8 py-4 w-full sm:w-auto transition-transform hover:scale-[1.02]"
              style={{ fontSize: '1rem', fontWeight: 700 }}
            >
              Launch App
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>

            {/* Footer — only on desktop left side */}
            <div className="hidden lg:block" style={{ marginTop: '80px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                &copy; Illusive Studio
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: 0 }}>
                Developed by: Ian Lester Eclevia
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Features + Steps */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div style={{ maxWidth: '520px', width: '100%' }} className="flex flex-col gap-4">
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { icon: Search, title: 'Niche Discovery', desc: 'Search any topic and see top-performing videos instantly.' },
                { icon: TrendingUp, title: 'Trend Analysis', desc: 'Track view velocity and emerging topics in real-time.' },
                { icon: Zap, title: 'AI Script Generator', desc: 'Reverse-engineer viral videos into ready-to-record scripts.' },
                { icon: Layers, title: 'Keyword Clusters', desc: 'Discover semantic keyword groups driving search traffic.' },
              ].map(feature => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="stat-card flex items-start gap-3.5 p-4 sm:p-4.5" style={{ cursor: 'default' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-clay-sm)' }}>
                      <Icon size={18} strokeWidth={2} color="var(--yt-red)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{feature.title}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{feature.desc}</p>
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
                  <div key={item.step} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF3333, #CC0000)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, boxShadow: 'var(--shadow-red)' }}>
                      {item.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                        <Icon size={14} strokeWidth={2} color="var(--yt-red)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BYOK */}
            <div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-clay)', border: '1px solid var(--border-subtle)', padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                🔑 <strong style={{ color: 'var(--text-primary)' }}>Bring Your Own Keys.</strong> Free and open-source. Keys stay in your browser.{' '}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--yt-red)', fontWeight: 600 }}>
                  Get a key →
                </a>
              </p>
            </div>

            {/* Footer — mobile only */}
            <div className="lg:hidden text-center" style={{ paddingTop: '12px', paddingBottom: '12px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>&copy; Illusive Studio</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', opacity: 0.7, margin: 0 }}>Developed by: Ian Lester Eclevia &nbsp;|&nbsp; v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
