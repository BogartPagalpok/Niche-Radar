import { Youtube, TrendingUp, Search, Zap, Settings, Layers, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

interface LandingPageProps {
  onEnterApp: () => void;
  onGoogleLoginSuccess: (accessToken: string) => void;
}

export default function LandingPage({ onEnterApp, onGoogleLoginSuccess }: LandingPageProps): React.ReactElement {
  const { isDark } = useTheme();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    
    // Check if the global google object from the script tag is available
    if (typeof window !== 'undefined' && (window as any).google) {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Client ID
        scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
        callback: (response: any) => {
          setIsLoggingIn(false);
          if (response.access_token) {
            onGoogleLoginSuccess(response.access_token);
            onEnterApp(); // Automatically move into the app once authenticated
          }
        },
        error_callback: (err: any) => {
          setIsLoggingIn(false);
          console.error('Google Auth Error:', err);
        }
      });
      
      client.requestAccessToken();
    } else {
      setIsLoggingIn(false);
      alert('Google authentication library not loaded yet. Please refresh.');
    }
  };

  return (
    <div
      className="min-h-screen w-full overflow-y-auto custom-scroll flex items-center justify-center py-12 lg:py-0"
      style={{ background: 'var(--bg-root)' }}
    >
      <div className="w-full max-w-[1440px] flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-16 xl:px-24 gap-12 lg:gap-8">
        
        {/* LEFT — Hero */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center py-6">
          <div className="w-full" style={{ maxWidth: '680px' }}>
            <h1 style={{ fontSize: '72px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: '24px', lineHeight: '1.05' }} className="sm:text-[84px] lg:text-[76px] xl:text-[88px]">
              Discover Trending Niches.
              <br />
              <span style={{ 
                background: 'linear-gradient(135deg, #FF4D4D 0%, #FF0000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                marginTop: '8px'
              }}>
                Reverse-Engineer Success.
              </span>
            </h1>

            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '520px' }} className="lg:text-[19px]">
              Analyze YouTube's top-performing videos, extract winning formulas, and generate ready-to-use scripts and thumbnail prompts — powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl transition-all hover:scale-[1.02] border font-bold"
                style={{ 
                  background: isDark ? '#1a1a1a' : '#ffffff', 
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-clay-sm)',
                  fontSize: '16px'
                }}
                disabled={isLoggingIn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
              </button>

              <button
                onClick={onEnterApp}
                className="clay-btn-red flex items-center justify-center gap-2 px-8 py-4 transition-transform hover:scale-[1.02]"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Explore Sandbox
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Footer — balanced distance */}
            <div className="hidden lg:block" style={{ marginTop: '100px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                &copy; Illusive Studio
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.7, margin: 0 }}>
                Developed by: Ian Lester Eclevia
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Features + Steps */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center py-6">
          <div style={{ maxWidth: '500px', width: '100%' }} className="flex flex-col gap-4 mx-auto lg:mr-0">
            
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
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-clay-sm)' }}>
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
                { step: '1', title: 'Sign in with Google', desc: 'Authorize secure, direct access to view your YouTube analytics safely.', icon: Youtube },
                { step: '2', title: 'Search any niche', desc: 'Enter a topic. Get real YouTube results with channel data and trends.', icon: Search },
                { step: '3', title: 'Generate AI scripts', desc: 'Click a video. Get ready-to-record scripts and thumbnail prompts.', icon: Zap },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} style={{ display: 'flex', gap: '14px', padding: '18px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #FF3333, #CC0000)', color: '#FFF', fontSize: '0.8rem', fontWeight: 800, boxShadow: 'var(--shadow-red)' }}>
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
                🔑 <strong style={{ color: 'var(--text-primary)' }}>Secure Context.</strong> Tokens are kept exclusively inside your local browser storage context.{' '}
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
