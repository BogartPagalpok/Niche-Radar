import { useState, useEffect } from 'react';
import { KeyRound, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, RefreshCw, Trash2, RefreshCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  STORAGE_KEY_REFRESH_TOKEN,
  STORAGE_KEY_GEMINI,
  STORAGE_KEY_CHANNEL_ID,
  STORAGE_KEY_CLIENT_ID,
  STORAGE_KEY_CLIENT_SECRET,
  STORAGE_KEY_ACCESS_TOKEN,
  STORAGE_KEY_TOKEN_EXPIRY,
  getValidToken,
} from '../services/credentialsService';

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
      <div className="flex items-center justify-between mb-1.5">
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

      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '6px', lineHeight: 1.5 }}>
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
            paddingTop: '11px',
            paddingBottom: '11px',
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
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  const [savedClientId, setSavedClientId] = useState(false);
  const [savedClientSecret, setSavedClientSecret] = useState(false);
  const [savedRefreshToken, setSavedRefreshToken] = useState(false);
  const [savedChannelId, setSavedChannelId] = useState(false);
  const [savedGemini, setSavedGemini] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    const cid = localStorage.getItem(STORAGE_KEY_CLIENT_ID) ?? '';
    const cs = localStorage.getItem(STORAGE_KEY_CLIENT_SECRET) ?? '';
    const rt = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN) ?? '';
    const ch = localStorage.getItem(STORAGE_KEY_CHANNEL_ID) ?? '';
    const gk = localStorage.getItem(STORAGE_KEY_GEMINI) ?? '';

    setClientId(cid);
    setClientSecret(cs);
    setRefreshToken(rt);
    setChannelId(ch);
    setGeminiKey(gk);

    setSavedClientId(!!cid);
    setSavedClientSecret(!!cs);
    setSavedRefreshToken(!!rt);
    setSavedChannelId(!!ch);
    setSavedGemini(!!gk);
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');

    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
    localStorage.setItem(STORAGE_KEY_CLIENT_SECRET, clientSecret.trim());
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, refreshToken.trim());
    localStorage.setItem(STORAGE_KEY_CHANNEL_ID, channelId.trim());
    localStorage.setItem(STORAGE_KEY_GEMINI, geminiKey.trim());

    // Clear cached access token so it gets refreshed on next use
    localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);

    setSavedClientId(!!clientId.trim());
    setSavedClientSecret(!!clientSecret.trim());
    setSavedRefreshToken(!!refreshToken.trim());
    setSavedChannelId(!!channelId.trim());
    setSavedGemini(!!geminiKey.trim());

    setTimeout(() => setSaveStatus('saved'), 350);
    setTimeout(() => setSaveStatus('idle'), 2200);
  };

  const handleClear = () => {
    [STORAGE_KEY_CLIENT_ID, STORAGE_KEY_CLIENT_SECRET, STORAGE_KEY_REFRESH_TOKEN,
      STORAGE_KEY_CHANNEL_ID, STORAGE_KEY_GEMINI, STORAGE_KEY_ACCESS_TOKEN, STORAGE_KEY_TOKEN_EXPIRY]
      .forEach(k => localStorage.removeItem(k));

    setClientId(''); setClientSecret(''); setRefreshToken(''); setChannelId(''); setGeminiKey('');
    setSavedClientId(false); setSavedClientSecret(false); setSavedRefreshToken(false);
    setSavedChannelId(false); setSavedGemini(false);
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMsg('');
    try {
      const token = await getValidToken();
      if (token) {
        setTestStatus('ok');
        setTestMsg('Token retrieved successfully. API connection is active.');
      } else {
        setTestStatus('fail');
        setTestMsg('Could not obtain a valid token. Check Client ID, Secret, and Refresh Token.');
      }
    } catch {
      setTestStatus('fail');
      setTestMsg('Connection test failed. Check your credentials.');
    }
    setTimeout(() => setTestStatus('idle'), 5000);
  };

  const anyFilled = clientId || clientSecret || refreshToken || channelId || geminiKey;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          App Settings
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Configure credentials once — the app handles token refresh automatically.
        </p>
      </div>

      {/* Security notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'linear-gradient(135deg, rgba(34,199,138,0.08), rgba(34,199,138,0.04))',
          border: '1px solid rgba(34,199,138,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
        }}
      >
        <ShieldCheck size={14} strokeWidth={2.5} color="var(--mint-text)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--mint-text)', lineHeight: 1.6, fontWeight: 500 }}>
          All keys are stored in <strong>localStorage</strong> only — nothing leaves your browser.
          Access tokens refresh automatically using your Refresh Token.
        </p>
      </div>

      {/* Credential fields */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-clay-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CredentialField
            id="client-id"
            label="Google Client ID"
            hint="From Google Cloud Console → OAuth 2.0 Client IDs."
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
            hint="Paired with the Client ID above."
            placeholder="GOCSPX-..."
            icon={KeyRound}
            value={clientSecret}
            onChange={setClientSecret}
            saved={savedClientSecret}
          />
          <div className="clay-divider" />
          <CredentialField
            id="refresh-token"
            label="Google Refresh Token"
            hint="Long-lived token used to auto-generate Access Tokens. Obtain via the Sign-in flow."
            placeholder="1//0g..."
            icon={RefreshCcw}
            value={refreshToken}
            onChange={setRefreshToken}
            saved={savedRefreshToken}
          />
          <div className="clay-divider" />
          <CredentialField
            id="channel-id"
            label="YouTube Channel ID"
            hint="Your channel ID for analytics. Starts with UC…"
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
            hint="Powers AI script & thumbnail prompt generation via Google AI Studio."
            placeholder="AIzaSy···"
            icon={Cpu}
            value={geminiKey}
            onChange={setGeminiKey}
            saved={savedGemini}
          />
        </div>
      </div>

      {/* Action buttons */}
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

      {/* Test connection */}
      <button
        onClick={handleTestConnection}
        disabled={testStatus === 'testing'}
        className="clay-btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 w-full"
        style={{ fontSize: '0.8rem' }}
      >
        {testStatus === 'testing' ? (
          <RefreshCw size={13} strokeWidth={2.5} style={{ animation: 'spin 0.6s linear infinite' }} />
        ) : (
          <RefreshCcw size={13} strokeWidth={2.5} />
        )}
        {testStatus === 'testing' ? 'Testing…' : 'Test Token / Force Refresh'}
      </button>

      {testMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: testStatus === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${testStatus === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            fontSize: '0.75rem',
            color: testStatus === 'ok' ? '#15803D' : '#991B1B',
            lineHeight: 1.5,
          }}
        >
          {testMsg}
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Client ID', stored: savedClientId },
          { label: 'Client Secret', stored: savedClientSecret },
          { label: 'Refresh Token', stored: savedRefreshToken },
          { label: 'Channel ID', stored: savedChannelId },
          { label: 'Gemini Key', stored: savedGemini },
        ].map(({ label, stored }) => (
          <div key={label} className="clay-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: stored ? '#22C55E' : 'var(--border-strong)',
              boxShadow: stored ? '0 0 5px rgba(34,197,94,0.5)' : 'none',
            }} />
            <span>{label}: {stored ? 'Set' : 'Not Set'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
