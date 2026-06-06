import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Fail loudly in the console if the env vars are missing — otherwise Google
// login silently does nothing (createClient receives undefined).
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    '[Supabase] Missing env vars. Google login will NOT work.\n' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Cloudflare Pages ' +
      'project (Settings → Environment variables) AND in a local .env file for dev.\n' +
      `Current: VITE_SUPABASE_URL=${supabaseUrl ? 'set' : 'MISSING'}, ` +
      `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? 'set' : 'MISSING'}`,
  );
}

// Use safe fallbacks so createClient doesn't throw on load; calls will still
// fail, but the app renders and the console explains why.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
);
