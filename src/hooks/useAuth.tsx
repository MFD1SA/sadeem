import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react';
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

  // Track whether INITIAL_SESSION has already been handled to prevent
  // the getSession() fallback from double-hydrating.
  const initialSessionHandled = useRef(false);
  // Track in-flight hydration to prevent concurrent calls.
  const hydrating = useRef(false);

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
      // Prevent concurrent hydrations
      if (hydrating.current) return;
      hydrating.current = true;

      if (!session?.user) {
        hydrating.current = false;
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
        const [profile, orgData] = await Promise.all([
          loadProfile(session.user.id),
          loadOrganization(session.user.id),
        ]);

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
        // IMPORTANT: keep the session alive even if profile/org queries fail.
        // The session token is still valid — don't log the user out on DB error.
        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile: null,
          organization: null,
          membership: null,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: false,
        });
      } finally {
        hydrating.current = false;
      }
    },
    [loadProfile, loadOrganization]
  );

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        initialSessionHandled.current = true;
      }

      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        await hydrateAuth(session);
      }

      if (event === 'SIGNED_OUT') {
        initialSessionHandled.current = false;
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

    // Fallback: if INITIAL_SESSION doesn't fire within 400 ms (lock contention),
    // call getSession() ourselves. Only runs if INITIAL_SESSION hasn't fired yet.
    const fallback = setTimeout(() => {
      if (!initialSessionHandled.current && mounted) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && !initialSessionHandled.current) {
            hydrateAuth(session);
          }
        });
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(fallback);
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
      value={{ ...state, refreshProfile, refreshOrganization, signOut }}
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
