import { useState, useEffect } from 'react';
import { KeyRound, Cpu, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, RefreshCw, Trash2, RefreshCcw, Database, Github, Zap } from 'lucide-react';
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

// These constants are defined locally here to ensure the build succeeds 
// without needing to modify your existing credentialsService.ts file.
const STORAGE_KEY_RPM = 'niche-radar-assumed-rpm';

// Niche RPM presets (Net RPM = $ kept per 1,000 views after YouTube's cut).
const RPM_PRESETS = [
  { label: 'Gaming / Entertainment', value: 1 },
  { label: 'Vlogs / Lifestyle', value: 2 },
  { label: 'Tech / Reviews', value: 4 },
  { label: 'Education / How-to', value: 6 },
  { label: 'Business / Marketing', value: 9 },
  { label: 'Finance / Crypto', value: 14 },
];

const STORAGE_KEY_CEREBRAS = 'niche_radar_cerebras_key';
const STORAGE_KEY_GROQ = 'niche_radar_groq_key';
const STORAGE_KEY_GITHUB = 'niche_radar_github_token';
const STORAGE_KEY_SUPADATA = 'niche_radar_supadata_key';
const STORAGE_KEY_APIFY = 'niche_radar_apify_key';

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
  
  // AI Keys
  const [geminiKey, setGeminiKey] = useState('');
  const [cerebrasKey, setCerebrasKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  
  // Data Keys
  const [supadataKey, setSupadataKey] = useState('');
  const [apifyKey, setApifyKey] = useState('');
  const [assumedRpm, setAssumedRpm] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_RPM);
    const n = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 2;
  });

  const handleRpmChange = (value: number): void => {
    setAssumedRpm(value);
    localStorage.setItem(STORAGE_KEY_RPM, String(value));
  };

  const [saved, setSaved] = useState({
    clientId: false, clientSecret: false, refreshToken: false, channelId: false,
    gemini: false, cerebras: false, groq: false, github: false, supadata: false, apify: false
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    const keys = [
      { key: STORAGE_KEY_CLIENT_ID, setter: setClientId, field: 'clientId' },
      { key: STORAGE_KEY_CLIENT_SECRET, setter: setClientSecret, field: 'clientSecret' },
      { key: STORAGE_KEY_REFRESH_TOKEN, setter: setRefreshToken, field: 'refreshToken' },
      { key: STORAGE_KEY_CHANNEL_ID, setter: setChannelId, field: 'channelId' },
      { key: STORAGE_KEY_GEMINI, setter: setGeminiKey, field: 'gemini' },
      { key: STORAGE_KEY_CEREBRAS, setter: setCerebrasKey, field: 'cerebras' },
      { key: STORAGE_KEY_GROQ, setter: setGroqKey, field: 'groq' },
      { key: STORAGE_KEY_GITHUB, setter: setGithubToken, field: 'github' },
      { key: STORAGE_KEY_SUPADATA, setter: setSupadataKey, field: 'supadata' },
      { key: STORAGE_KEY_APIFY, setter: setApifyKey, field: 'apify' },
    ];
    let newSavedState = { ...saved };
    keys.forEach(({ key, setter, field }) => {
      const val = localStorage.getItem(key) ?? '';
      setter(val);
      newSavedState[field as keyof typeof saved] = !!val;
    });
    setSaved(newSavedState);
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    const data = [
      { k: STORAGE_KEY_CLIENT_ID, v: clientId, f: 'clientId' },
      { k: STORAGE_KEY_CLIENT_SECRET, v: clientSecret, f: 'clientSecret' },
      { k: STORAGE_KEY_REFRESH_TOKEN, v: refreshToken, f: 'refreshToken' },
      { k: STORAGE_KEY_CHANNEL_ID, v: channelId, f: 'channelId' },
      { k: STORAGE_KEY_GEMINI, v: geminiKey, f: 'gemini' },
      { k: STORAGE_KEY_CEREBRAS, v: cerebrasKey, f: 'cerebras' },
      { k: STORAGE_KEY_GROQ, v: groqKey, f: 'groq' },
      { k: STORAGE_KEY_GITHUB, v: githubToken, f: 'github' },
      { k: STORAGE_KEY_SUPADATA, v: supadataKey, f: 'supadata' },
      { k: STORAGE_KEY_APIFY, v: apifyKey, f: 'apify' },
    ];
    let newSavedState = { ...saved };
    data.forEach(item => {
      localStorage.setItem(item.k, item.v.trim());
      newSavedState[item.f as keyof typeof saved] = !!item.v.trim();
    });
    localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
    setSaved(newSavedState);
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 350);
  };

  const handleClear = () => {
    [STORAGE_KEY_CLIENT_ID, STORAGE_KEY_CLIENT_SECRET, STORAGE_KEY_REFRESH_TOKEN,
      STORAGE_KEY_CHANNEL_ID, STORAGE_KEY_GEMINI, STORAGE_KEY_CEREBRAS, STORAGE_KEY_GROQ,
      STORAGE_KEY_GITHUB, STORAGE_KEY_SUPADATA, STORAGE_KEY_APIFY, 
      STORAGE_KEY_ACCESS_TOKEN, STORAGE_KEY_TOKEN_EXPIRY]
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
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
        setTestMsg('Could not obtain a valid token.');
      }
    } catch {
      setTestStatus('fail');
      setTestMsg('Connection test failed.');
    }
    setTimeout(() => setTestStatus('idle'), 5000);
  };

  const anyFilled = clientId || clientSecret || refreshToken || channelId || geminiKey || cerebrasKey || groqKey || githubToken || supadataKey || apifyKey;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          App Settings
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Configure credentials once — the app handles storage and fallback logic automatically.
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
          padding: '10px 14px',
        }}
      >
        <ShieldCheck size={14} strokeWidth={2.5} color="var(--mint-text)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--mint-text)', lineHeight: 1.6, fontWeight: 500 }}>
          All keys are stored in <strong>localStorage</strong> only — nothing leaves your browser.
        </p>
      </div>

      {/* AI Fallback Chain Section */}
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
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
           <Zap size={16} color="var(--yt-red)"/> AI Generation Providers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CredentialField
            id="cerebras-key" label="Cerebras API Key (Primary Text)" hint="Powers unlimited script generation. Free tier: 1M tokens/day."
            placeholder="csk-..." icon={Cpu} value={cerebrasKey} onChange={setCerebrasKey} saved={saved.cerebras}
          />
          <div className="clay-divider" />
          <CredentialField
            id="groq-key" label="Groq API Key (Fallback Text)" hint="High-speed fallback. Free tier: 14,400 requests/day."
            placeholder="gsk_..." icon={Cpu} value={groqKey} onChange={setGroqKey} saved={saved.groq}
          />
          <div className="clay-divider" />
          <CredentialField
            id="github-token" label="GitHub Token (Primary Vision)" hint="Powers thumbnail analysis via GPT-4o."
            placeholder="github_pat_..." icon={Github} value={githubToken} onChange={setGithubToken} saved={saved.github}
          />
          <div className="clay-divider" />
          <CredentialField
            id="gemini-key" label="Gemini API Key (Fallback Vision)" hint="Backup vision and legacy tool operations."
            placeholder="AIzaSy···" icon={Cpu} value={geminiKey} onChange={setGeminiKey} saved={saved.gemini}
          />
        </div>
      </div>

      {/* Revenue Estimation Section */}
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
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="#22C55E" /> Revenue Estimation
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Pick the niche closest to your content. This sets the Net RPM used to
          estimate earnings from a video's public view count.
        </p>

        <label htmlFor="rpm-preset" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Niche (Net RPM)
        </label>
        <select
          id="rpm-preset"
          value={RPM_PRESETS.some(p => p.value === assumedRpm) ? assumedRpm : 'custom'}
          onChange={(e) => {
            if (e.target.value !== 'custom') handleRpmChange(Number(e.target.value));
          }}
          className="clay-input"
          style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', borderRadius: '12px', marginBottom: '12px' }}
        >
          {RPM_PRESETS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label} — ${p.value.toFixed(2)} RPM
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>

        <label htmlFor="rpm-custom" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Or set exact Net RPM ($ per 1,000 views)
        </label>
        <input
          id="rpm-custom"
          type="number"
          min="0"
          step="0.1"
          value={assumedRpm}
          onChange={(e) => handleRpmChange(Math.max(0, Number(e.target.value)))}
          className="clay-input"
          style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', borderRadius: '12px' }}
        />
        <p style={{ fontSize: '0.7rem', color: '#22C55E', margin: '10px 0 0 0', fontWeight: 600 }}>
          Example: a 1,000,000-view video ≈ ${((1_000_000 / 1000) * assumedRpm).toLocaleString()} estimated.
        </p>
      </div>

      {/* Data Scrapers Section */}
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
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
           <Database size={16} color="#3B82F6"/> Data & Scraping Proxies
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CredentialField
            id="supadata-key" label="Supadata API Key" hint="Used for bypassing YouTube limits to extract transcripts and metadata."
            placeholder="sd_..." icon={Database} value={supadataKey} onChange={setSupadataKey} saved={saved.supadata}
          />
          <div className="clay-divider" />
          <CredentialField
            id="apify-key" label="Apify API Token" hint="Used for bulk channel scraping and deep analytics."
            placeholder="apify_api_..." icon={Database} value={apifyKey} onChange={setApifyKey} saved={saved.apify}
          />
        </div>
      </div>

      {/* Google Auth Section */}
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
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
           <KeyRound size={16} color="#EAB308"/> Google OAuth (Analytics)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CredentialField
            id="client-id" label="Google Client ID" hint="From Google Cloud Console → OAuth 2.0 Client IDs."
            placeholder="your-id.apps.googleusercontent.com" icon={KeyRound} value={clientId} onChange={setClientId} saved={saved.clientId}
          />
          <div className="clay-divider" />
          <CredentialField
            id="client-secret" label="Google Client Secret" hint="Paired with the Client ID above."
            placeholder="GOCSPX-..." icon={KeyRound} value={clientSecret} onChange={setClientSecret} saved={saved.clientSecret}
          />
          <div className="clay-divider" />
          <CredentialField
            id="refresh-token" label="Google Refresh Token" hint="Long-lived token used to auto-generate Access Tokens."
            placeholder="1//0g..." icon={RefreshCcw} value={refreshToken} onChange={setRefreshToken} saved={saved.refreshToken}
          />
          <div className="clay-divider" />
          <CredentialField
            id="channel-id" label="YouTube Channel ID" hint="Your channel ID for analytics. Starts with UC…"
            placeholder="UCxxx···" icon={KeyRound} value={channelId} onChange={setChannelId} saved={saved.channelId}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="clay-btn-red flex items-center gap-2 px-5 py-3 flex-1" style={{ justifyContent: 'center' }}>
          {saveStatus === 'saving' ? (
            <RefreshCw size={14} strokeWidth={2.5} style={{ animation: 'spin 0.6s linear infinite' }} />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 size={14} strokeWidth={2.5} />
          ) : (
            <Save size={14} strokeWidth={2.5} />
          )}
          <span>{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save Credentials'}</span>
        </button>

        {anyFilled && (
          <button onClick={handleClear} className="clay-btn-secondary flex items-center gap-2 px-4 py-3" title="Clear all stored credentials">
            <Trash2 size={14} strokeWidth={2} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Clear</span>
          </button>
        )}
      </div>

      <button onClick={handleTestConnection} disabled={testStatus === 'testing'} className="clay-btn-secondary flex items-center justify-center gap-2 px-4 py-2.5 w-full" style={{ fontSize: '0.8rem' }}>
        {testStatus === 'testing' ? <RefreshCw size={13} strokeWidth={2.5} style={{ animation: 'spin 0.6s linear infinite' }} /> : <RefreshCcw size={13} strokeWidth={2.5} />}
        {testStatus === 'testing' ? 'Testing…' : 'Test Token / Force Refresh'}
      </button>

      {testMsg && (
        <div style={{
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          background: testStatus === 'ok' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${testStatus === 'ok' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.75rem', color: testStatus === 'ok' ? '#15803D' : '#991B1B', lineHeight: 1.5,
        }}>
          {testMsg}
        </div>
      )}
    </div>
  );
}
