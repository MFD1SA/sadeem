import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storageKey: 'sadeem-auth',
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
