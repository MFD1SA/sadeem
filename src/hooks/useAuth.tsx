import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { organizationService } from '@/services/organizations';
import type { DbUser, DbOrganization, DbMembership } from '@/types/database';

// Maximum ms we wait for INITIAL_SESSION before forcing isLoading=false.
// This protects against Supabase BroadcastChannel lock contention (e.g. when
// the lock isn't released quickly enough) that would otherwise freeze the UI.
const AUTH_LOADING_TIMEOUT_MS = 3000;

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

  const hydrateAuth = useCallback(
    async (session: any | null) => {
      if (!session?.user) {
        setState({
          session: null,
          user: null,
          profile: null,
          organization: null,
          membership: null,
          isLoading: false,
          isAuthenticated: false,
          hasOrganization: false,
        });
        return;
      }

      try {
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
        console.error('[Sadeem] Auth hydrate failed:', err);
        setState({
          session: null,
          user: null,
          profile: null,
          organization: null,
          membership: null,
          isLoading: false,
          isAuthenticated: false,
          hasOrganization: false,
        });
      }
    },
    [loadProfile, loadOrganization]
  );

  useEffect(() => {
    let mounted = true;

    // Safety net: if INITIAL_SESSION hasn't resolved in AUTH_LOADING_TIMEOUT_MS
    // (e.g. due to orphaned Supabase lock from double-mount), force-end loading
    // so the user isn't shown a permanent spinner.
    const loadingTimeout = setTimeout(() => {
      if (!mounted) return;
      setState(prev => {
        if (prev.isLoading) {
          console.warn('[Sadeem] Auth loading timeout — forcing isLoading=false');
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, AUTH_LOADING_TIMEOUT_MS);

    // Use onAuthStateChange exclusively for session initialization.
    // The INITIAL_SESSION event fires immediately with the current session,
    // so there is no need for a separate getSession() call. Calling both
    // causes two concurrent hydrateAuth invocations (double-hydration race).
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        await hydrateAuth(session);
      }

      if (event === 'SIGNED_OUT') {
        setState({
          session: null,
          user: null,
          profile: null,
          organization: null,
          membership: null,
          isLoading: false,
          isAuthenticated: false,
          hasOrganization: false,
        });
      }
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      listener?.subscription?.unsubscribe();
    };
  }, [hydrateAuth]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, loadProfile]);

  const refreshOrganization = useCallback(async () => {
    if (!state.user) return;
    const orgData = await loadOrganization(state.user.id);
    setState((prev) => ({
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
      setState({
        session: null,
        user: null,
        profile: null,
        organization: null,
        membership: null,
        isLoading: false,
        isAuthenticated: false,
        hasOrganization: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        refreshProfile,
        refreshOrganization,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
