import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { organizationService } from '@/services/organizations';
import { subscriptionService } from '@/services/subscription';
import type { DbUser, DbOrganization, DbMembership } from '@/types/database';
import type { DbSubscription } from '@/types/subscription';

// Minimal session shape — avoids importing Supabase Session type while
// still providing compile-time safety for the properties we actually use.
interface MinimalSession {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> };
  expires_at?: number;
  access_token?: string;
}

interface AuthState {
  session: MinimalSession | null;
  user: { id: string; email?: string } | null;
  profile: DbUser | null;
  organization: DbOrganization | null;
  membership: DbMembership | null;
  subscription: DbSubscription | null;
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
    subscription: null,
    isLoading: true,
    isAuthenticated: false,
    hasOrganization: false,
  });

  // Track whether INITIAL_SESSION has already been handled to prevent
  // the getSession() fallback from double-hydrating.
  const initialSessionHandled = useRef(false);
  // Track in-flight hydration to prevent concurrent calls.
  const hydrating = useRef(false);

  const loadProfile = useCallback(async (userId: string, session: MinimalSession | null): Promise<DbUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error) return (data as DbUser) || null;

      // Profile row missing (trigger may not have fired yet for OAuth users).
      // Create it now so downstream code always has a profile.
      if (error.code === 'PGRST116') {
        const meta = session?.user?.user_metadata || {};
        const { data: created, error: insErr } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: session?.user?.email || '',
            full_name: meta.full_name || meta.name || '',
            avatar_url: meta.avatar_url || meta.picture || '',
          }, { onConflict: 'id' })
          .select()
          .single();
        if (!insErr && created) return created as DbUser;
      }

      console.warn('[Sadeem] Profile load error:', error.message);
      return null;
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
    async (session: MinimalSession | null) => {
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
          subscription: null,
          isLoading: false,
          isAuthenticated: false,
          hasOrganization: false,
        });
        return;
      }

      try {
        // Phase 1: Load profile + org in parallel (org is now a single joined query)
        const [profile, orgData] = await Promise.all([
          loadProfile(session.user.id, session),
          loadOrganization(session.user.id),
        ]);

        // Phase 2: If org exists, pre-load subscription in parallel
        // This saves PlanProvider from having to wait and fetch it separately
        let sub: DbSubscription | null = null;
        if (orgData?.org) {
          try {
            sub = await subscriptionService.getByOrganization(orgData.org.id);
          } catch {
            // Non-critical — PlanProvider can retry
          }
        }

        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile,
          organization: orgData?.org || null,
          membership: orgData?.membership || null,
          subscription: sub,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: !!orgData?.org,
        });
      } catch (err) {
        console.error('[Sadeem] Auth hydrate failed:', err);
        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile: null,
          organization: null,
          membership: null,
          subscription: null,
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

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, rawSession) => {
      if (!mounted) return;
      // Cast Supabase Session to our minimal shape
      const session = rawSession as MinimalSession | null;

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
          subscription: null,
          isLoading: false,
          isAuthenticated: false,
          hasOrganization: false,
        });
      }
    });

    // Fallback: if INITIAL_SESSION doesn't fire within 300ms, call getSession()
    const fallback = setTimeout(() => {
      if (!initialSessionHandled.current && mounted) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && !initialSessionHandled.current) {
            hydrateAuth(session as MinimalSession | null);
          }
        });
      }
    }, 300);

    // PKCE race fallback for OAuth callback
    const hasPkceCode = typeof window !== 'undefined' && window.location.search.includes('code=');
    const pkceTimer = hasPkceCode ? setTimeout(() => {
      if (!mounted) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted && session?.user && !hydrating.current) {
          hydrateAuth(session as MinimalSession | null);
        }
      });
    }, 1000) : null;

    // Safety timeout: force isLoading=false after 4 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted && !initialSessionHandled.current) {
        initialSessionHandled.current = true;
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      clearTimeout(safetyTimer);
      if (pkceTimer) clearTimeout(pkceTimer);
      listener?.subscription.unsubscribe();
    };
  }, [hydrateAuth]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await loadProfile(state.user.id, state.session);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, state.session, loadProfile]);

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
        subscription: null,
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
