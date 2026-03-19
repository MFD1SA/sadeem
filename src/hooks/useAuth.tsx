import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { organizationService } from '@/services/organizations';
import type { DbUser, DbOrganization, DbMembership } from '@/types/database';

interface AuthState {
  session: unknown;
  user: { id: string; email?: string } | null;
  profile: DbUser | null;
  organization: DbOrganization | null;
  membership: DbMembership | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOrganization: boolean;
}

interface AuthContextType extends AuthState {
  refreshProfile: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    organization: null,
    membership: null,
    isLoading: true,
    isAuthenticated: false,
    hasOrganization: false,
  });

  const initialized = useRef(false);

  const loadProfile = useCallback(async (userId: string): Promise<DbUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[Sadeem] Profile load error:', error.message);
        return null;
      }
      return (data as DbUser) || null;
    } catch (err) {
      console.warn('[Sadeem] Profile load failed:', err);
      return null;
    }
  }, []);

  const loadOrganization = useCallback(async (userId: string) => {
    try {
      return await organizationService.getUserOrganization(userId);
    } catch (err) {
      console.warn('[Sadeem] Organization load failed:', err);
      return null;
    }
  }, []);

  // Initialize auth once on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data?.session?.user) {
          setState((prev: AuthState) => ({ ...prev, isLoading: false, isAuthenticated: false }));
          return;
        }

        const session = data.session;
        const profile = await loadProfile(session.user.id);
        const orgData = await loadOrganization(session.user.id);

        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile,
          organization: orgData?.org || null,
          membership: orgData?.membership || null,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: !!orgData?.org,
        });
      } catch (err) {
        console.error('[Sadeem] Auth init failed:', err);
        setState((prev: AuthState) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      }
    };

    // Safety timeout: if auth takes more than 5 seconds, stop loading
    const timeout = setTimeout(() => {
      setState((prev: AuthState) => {
        if (prev.isLoading) {
          console.warn('[Sadeem] Auth timeout - forcing loading to false');
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, 5000);

    init().finally(() => clearTimeout(timeout));

    // Listen for auth changes — handle sign-in and sign-out
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Update state for email login, signup, or OAuth callback
        const profile = await loadProfile(session.user.id);
        const orgData = await loadOrganization(session.user.id);
        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile,
          organization: orgData?.org || null,
          membership: orgData?.membership || null,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: !!orgData?.org,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          session: null, user: null, profile: null,
          organization: null, membership: null,
          isLoading: false, isAuthenticated: false, hasOrganization: false,
        });
      }
      // TOKEN_REFRESHED, USER_UPDATED: do nothing — avoid unnecessary re-renders
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile, loadOrganization]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((prev: AuthState) => ({ ...prev, profile }));
  }, [state.user, loadProfile]);

  const refreshOrganization = useCallback(async () => {
    if (!state.user) return;
    const orgData = await loadOrganization(state.user.id);
    setState((prev: AuthState) => ({
      ...prev,
      organization: orgData?.org || null,
      membership: orgData?.membership || null,
      hasOrganization: !!orgData?.org,
    }));
  }, [state.user, loadOrganization]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Sadeem] Sign out failed:', err);
      // Force clear state even if signOut API fails
      setState({
        session: null, user: null, profile: null,
        organization: null, membership: null,
        isLoading: false, isAuthenticated: false, hasOrganization: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile, refreshOrganization, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
