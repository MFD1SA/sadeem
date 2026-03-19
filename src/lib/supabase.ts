import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe initialization - prevent crash if env vars are missing
let supabase: SupabaseClient;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Sadeem] Supabase environment variables not configured. Auth features will not work.');
  }
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  );
} catch (err) {
  console.error('[Sadeem] Failed to initialize Supabase client:', err);
  // Create a minimal dummy client that won't crash the app
  supabase = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'
  );
}

export { supabase };
