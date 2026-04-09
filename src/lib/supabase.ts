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
    // Replace the Web Locks API with a simple Promise-based queue.
    // The default lock uses navigator.locks which can get stuck for 5 000 ms
    // when a lock holder dies (e.g. StrictMode double-mount orphans).
    // A full bypass (fn => fn()) caused a different bug: SIGNED_IN fires
    // before the session is written, so authenticated queries fail.
    // This queue serialises operations WITHOUT the Web Locks timeout issue.
    lock: (() => {
      let q: Promise<unknown> = Promise.resolve();
      return <R>(_name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
        const run = (): Promise<R> =>
          Promise.race([
            fn(),
            new Promise<R>((_, rej) =>
              setTimeout(() => rej(new Error('Auth lock timeout')), Math.max(acquireTimeout, 3000))
            ),
          ]);
        const next = q.then(run, run);
        q = next.then(() => {}, () => {});
        return next;
      };
    })(),
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
