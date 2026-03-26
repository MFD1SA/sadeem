import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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

    // onAuthStateChange fires INITIAL_SESSION reliably (Supabase v2) — no need for
    // a separate getSession() call which would cause a double-hydration race.
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
