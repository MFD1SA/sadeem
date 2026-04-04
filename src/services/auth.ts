import { supabase } from '@/lib/supabase';

function getOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://gandx.net';
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Direct confirmation link to /auth/callback so the token_hash is
        // processed there and the user lands directly on the dashboard.
        emailRedirectTo: `${getOrigin()}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect to /login — this URL is confirmed allowed in Supabase.
        // Supabase PKCE exchanges the code automatically on load.
        // RedirectIfAuthenticated shows a spinner (not the form) during exchange.
        redirectTo: `${getOrigin()}/login`,
        // Basic profile scopes only — no consent/permissions screen.
        // Google Business API access is requested separately in Integrations.
        scopes: 'openid email profile',
        queryParams: {
          access_type: 'online',
          prompt: 'select_account', // show account picker only, no extra permissions
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  onAuthStateChange(callback: (event: string, session: Record<string, unknown> | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
