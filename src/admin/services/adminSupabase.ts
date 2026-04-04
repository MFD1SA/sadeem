// ============================================================================
// SENDA Admin — Supabase Client
// Separate from subscriber client (src/lib/supabase.ts) to avoid session conflicts.
// Uses a different storageKey so admin and subscriber sessions never overlap.
// ============================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (_adminClient) return _adminClient;

  _adminClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'sb_publishable_placeholder',
    {
      auth: {
        storageKey: 'sadeem-admin-auth',   // Different from subscriber 'sadeem-auth'
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,          // Admin doesn't use OAuth callback
      },
    }
  );

  return _adminClient;
}

export const adminSupabase = getAdminSupabase();
