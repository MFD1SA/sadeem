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
    // Bypass the Web Locks API entirely.  The default lock uses
    // navigator.locks which can get stuck for 5 000 ms when a lock
    // holder dies (e.g. StrictMode double-mount orphans).
    // A serialising queue also deadlocks because Supabase internally
    // nests lock calls (PKCE → _saveSession → _useSession → lock).
    // The bypass is safe because we explicitly verify the session in
    // hydrateAuth before running any authenticated queries.
    lock: <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => fn(),
  },
};

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Senda] Supabase environment variables not configured. Auth features will not work.');
  }

  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'sb_publishable_placeholder',
    clientOptions
  );
} catch (err) {
  console.error('[Senda] Failed to initialize Supabase client:', err);

  supabase = createClient(
    'https://placeholder.supabase.co',
    'sb_publishable_placeholder',
    clientOptions
  );
}

export { supabase };
