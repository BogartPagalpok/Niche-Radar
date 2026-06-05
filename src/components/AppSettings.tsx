import { useState, useEffect } from 'react';
import { KeyRound, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, RefreshCw, Trash2, Youtube } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Storage keys – match those in credentials.ts
const STORAGE_KEY_TOKEN = 'niche-radar-google-token';
const STORAGE_KEY_GEMINI = 'niche-radar-gemini-key';
const STORAGE_KEY_CHANNEL_ID = 'niche-radar-channel-id';
const STORAGE_KEY_YOUTUBE_API_KEY = 'niche-radar-youtube-api-key';
const STORAGE_KEY_CLIENT_ID = 'niche-radar-client-id'; // NEW
const STORAGE_KEY_CLIENT_SECRET = 'niche-radar-client-secret'; // NEW

interface CredentialFieldProps {
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  saved: boolean;
}

function CredentialField({ id, label, hint, placeholder, icon: Icon, value, onChange, saved }: CredentialFieldProps) {
  const [visible, setVisible] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {label}
        </label>
        {saved && (
          <span className="flex items-center gap-1" style={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 600 }}>
            <CheckCircle2 size={11} strokeWidth={2.5} />
            Stored
          </span>
        )}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '8px', lineHeight: 1.5 }}>
        {hint}
      </p>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: saved
              ? 'linear-gradient(135deg, #C6F6E4, #9AEFD0)'
              : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.04)',
            boxShadow: 'var(--shadow-clay-sm)',
          }}
        >
          <Icon
            size={13}
            strokeWidth={2.5}
            color={saved ? '#0D7A54' : 'var(--text-secondary)'}
          />
        </div>

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="clay-input w-full"
          style={{
            paddingLeft: '54px',
            paddingRight: '48px',
            paddingTop: '13px',
            paddingBottom: '13px',
            fontSize: '0.82rem',
            fontFamily: value && !visible ? '"JetBrains Mono", monospace' : '"Inter", sans-serif',
            letterSpacing: value && !visible ? '0.08em' : '0',
          }}
        />

        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

export default function AppSettings() {
  const [googleToken, setGoogleToken] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [channelId, setChannelId] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [clientId, setClientId] = useState(''); // NEW
  const [clientSecret, setClientSecret] = useState(''); // NEW
  
  const [savedToken, setSavedToken] = useState(false);
  const [savedGemini, setSavedGemini] = useState(false);
  const [savedChannelId, setSavedChannelId] = useState(false);
  const [savedYoutubeApiKey, setSavedYoutubeApiKey] = useState(false);
  const [savedClientId, setSavedClientId] = useState(false); // NEW
  const [savedClientSecret, setSavedClientSecret] = useState(false); // NEW
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const t = localStorage.getItem(STORAGE_KEY_TOKEN) ?? '';
    const g = localStorage.getItem(STORAGE_KEY_GEMINI) ?? '';
    const c = localStorage.getItem(STORAGE_KEY_CHANNEL_ID) ?? '';
    const y = localStorage.getItem(STORAGE_KEY_YOUTUBE_API_KEY) ?? '';
    const cid = localStorage.getItem(STORAGE_KEY_CLIENT_ID) ?? '';
    const cs = localStorage.getItem(STORAGE_KEY_CLIENT_SECRET) ?? '';
    
    setGoogleToken(t);
    setGeminiKey(g);
    setChannelId(c);
    setYoutubeApiKey(y);
    setClientId(cid);
    setClientSecret(cs);
    
    setSavedToken(!!t);
    setSavedGemini(!!g);
    setSavedChannelId(!!c);
    setSavedYoutubeApiKey(!!y);
    setSavedClientId(!!cid);
    setSavedClientSecret(!!cs);
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    localStorage.setItem(STORAGE_KEY_TOKEN, googleToken.trim());
    localStorage.setItem(STORAGE_KEY_GEMINI, geminiKey.trim());
    localStorage.setItem(STORAGE_KEY_CHANNEL_ID, channelId.trim());
    localStorage.setItem(STORAGE_KEY_YOUTUBE_API_KEY, youtubeApiKey.trim());
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim()); // NEW
    localStorage.setItem(STORAGE_KEY_CLIENT_SECRET, clientSecret.trim()); // NEW
    
    setSavedToken(!!googleToken.trim());
    setSavedGemini(!!geminiKey.trim());
    setSavedChannelId(!!channelId.trim());
    setSavedYoutubeApiKey(!!youtubeApiKey.trim());
    setSavedClientId(!!clientId.trim());
    setSavedClientSecret(!!clientSecret.trim());
    
    setTimeout(() => setSaveStatus('saved'), 350);
    setTimeout(() => setSaveStatus('idle'), 2200);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_GEMINI);
    localStorage.removeItem(STORAGE_KEY_CHANNEL_ID);
    localStorage.removeItem(STORAGE_KEY_YOUTUBE_API_KEY);
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    localStorage.removeItem(STORAGE_KEY_CLIENT_SECRET);
    
    setGoogleToken('');
    setGeminiKey('');
    setChannelId('');
    setYoutubeApiKey('');
    setClientId('');
    setClientSecret('');
    
    setSavedToken(false);
    setSavedGemini(false);
    setSavedChannelId(false);
    setSavedYoutubeApiKey(false);
    setSavedClientId(false);
    setSavedClientSecret(false);
  };

  const anyFilled = googleToken.trim() || geminiKey.trim() || channelId.trim() || youtubeApiKey.trim() || clientId.trim() || clientSecret.trim();

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          App Settings
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Configure your API credentials. All keys are stored locally in your browser and never transmitted to any server.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'linear-gradient(135deg, rgba(34,199,138,0.08), rgba(34,199,138,0.04))',
          border: '1px solid rgba(34,199,138,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          boxShadow: 'var(--shadow-clay-sm)',
        }}
      >
        <ShieldCheck size={15} strokeWidth={2.5} color="var(--mint-text)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '0.73rem', color: 'var(--mint-text)', lineHeight: 1.6, fontWeight: 500 }}>
          Keys are stored exclusively in <strong>localStorage</strong> on your device. No data leaves your browser.
          Clear your browser data to remove stored credentials.
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
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
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          }}
        />

        <div className="space-y-6">
          <CredentialField
            id="google-token"
            label="Google Client Access Token"
            hint="Required for authenticated YouTube Data API v3 requests."
            placeholder="ya29.A0A···"
            icon={KeyRound}
            value={googleToken}
            onChange={setGoogleToken}
            saved={savedToken}
          />
          <div className="clay-divider" />
          <CredentialField
            id="client-id"
            label="Google Client ID"
            hint="Required for automatic token refreshing."
            placeholder="your-id.apps.googleusercontent.com"
            icon={KeyRound}
            value={clientId}
            onChange={setClientId}
            saved={savedClientId}
          />
          <div className="clay-divider" />
          <CredentialField
            id="client-secret"
            label="Google Client Secret"
            hint="Required for automatic token refreshing."
            placeholder="GOCSPX-..."
            icon={KeyRound}
            value={clientSecret}
            onChange={setClientSecret}
            saved={savedClientSecret}
          />
          <div className="clay-divider" />
          <CredentialField
            id="youtube-api-key"
            label="YouTube Data API Key (optional)"
            hint="Simple API key for public channel stats."
            placeholder="AIzaSy···"
            icon={Youtube}
            value={youtubeApiKey}
            onChange={setYoutubeApiKey}
            saved={savedYoutubeApiKey}
          />
          <div className="clay-divider" />
          <CredentialField
            id="channel-id"
            label="YouTube Channel ID"
            hint="Required for analytics."
            placeholder="UCxxx···"
            icon={KeyRound}
            value={channelId}
            onChange={setChannelId}
            saved={savedChannelId}
          />
          <div className="clay-divider" />
          <CredentialField
            id="gemini-key"
            label="Gemini API Key"
            hint="Powers AI-based niche analysis."
            placeholder="AIzaSy···"
            icon={Cpu}
            value={geminiKey}
            onChange={setGeminiKey}
            saved={savedGemini}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="clay-btn-red flex items-center gap-2 px-5 py-3 flex-1"
          style={{ justifyContent: 'center' }}
        >
          {saveStatus === 'saving' ? (
            <RefreshCw size={14} strokeWidth={2.5} style={{ animation: 'spin 0.6s linear infinite' }} />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 size={14} strokeWidth={2.5} />
          ) : (
            <Save size={14} strokeWidth={2.5} />
          )}
          <span>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save Credentials'}
          </span>
        </button>

        {anyFilled && (
          <button
            onClick={handleClear}
            className="clay-btn-secondary flex items-center gap-2 px-4 py-3"
            title="Clear all stored credentials"
          >
            <Trash2 size={14} strokeWidth={2} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Clear</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: savedToken ? '#22C55E' : 'var(--border-strong)', boxShadow: savedToken ? '0 0 5px rgba(34,197,94,0.5)' : 'none' }} />
          <span>Google Token: {savedToken ? 'Set' : 'Not Set'}</span>
        </div>
        <div className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: savedYoutubeApiKey ? '#22C55E' : 'var(--border-strong)', boxShadow: savedYoutubeApiKey ? '0 0 5px rgba(34,197,94,0.5)' : 'none' }} />
          <span>YouTube API Key: {savedYoutubeApiKey ? 'Set' : 'Not Set'}</span>
        </div>
        <div className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: savedChannelId ? '#22C55E' : 'var(--border-strong)', boxShadow: savedChannelId ? '0 0 5px rgba(34,197,94,0.5)' : 'none' }} />
          <span>Channel ID: {savedChannelId ? 'Set' : 'Not Set'}</span>
        </div>
        <div className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: savedGemini ? '#22C55E' : 'var(--border-strong)', boxShadow: savedGemini ? '0 0 5px rgba(34,197,94,0.5)' : 'none' }} />
          <span>Gemini Key: {savedGemini ? 'Set' : 'Not Set'}</span>
        </div>
      </div>
    </div>
  );
}
