import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storageKey: 'sadeem-auth',
    // Bypass the Web Locks API (navigator.locks) entirely.
    // The default lock mechanism serialises every getSession() / token-refresh
    // call through a named lock ("lock:sadeem-auth"). In some browser/network
    // conditions the lock takes 5 000 ms to forcefully acquire, causing the
    // login page and every subscriber page to show a stuck "جاري التحميل..."
    // spinner. This SPA is single-tab — cross-tab coordination isn't needed.
    lock: <R>(_name: string, _timeout: number, fn: () => Promise<R>) => fn(),
  },
};

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Sadeem] Supabase environment variables not configured. Auth features will not work.');
  }

  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'sb_publishable_placeholder',
    clientOptions
  );
} catch (err) {
  console.error('[Sadeem] Failed to initialize Supabase client:', err);

  supabase = createClient(
    'https://placeholder.supabase.co',
    'sb_publishable_placeholder',
    clientOptions
  );
}

export { supabase };
