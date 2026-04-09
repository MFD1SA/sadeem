import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo, type ReactNode,
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

const EMPTY_STATE: AuthState = {
  session: null, user: null, profile: null,
  organization: null, membership: null, subscription: null,
  isLoading: false, isAuthenticated: false, hasOrganization: false,
};

// ── SessionStorage key for org confirmation ──────────────────────────
const ORG_CONFIRMED_KEY = 'sadeem_org_confirmed';

// Timeout helper — prevents a hung DB query from blocking auth forever.
const raceTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

// Small delay helper
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ...EMPTY_STATE,
    isLoading: true,
  });

  const initialSessionHandled = useRef(false);
  const hydrating = useRef(false);
  const hydrationDone = useRef(false);
  const signingOut = useRef(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const loadProfile = useCallback(async (userId: string, session: MinimalSession | null): Promise<DbUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error) return (data as DbUser) || null;

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

      console.warn('[Senda] Profile load error:', error.message);
      return null;
    } catch (err) {
      console.warn('[Senda] Profile load failed:', err);
      return null;
    }
  }, []);

  const loadOrganization = useCallback(async (userId: string) => {
    try {
      return await organizationService.getUserOrganization(userId);
    } catch (err) {
      console.warn('[Senda] Organization load failed:', err);
      return null;
    }
  }, []);

  // ── Core hydration ─────────────────────────────────────────────────
  //
  // ★ Retry logic: If org is null on first attempt, retry ONCE after a
  //   short delay. This covers PKCE timing (JWT propagation delay).
  //   - If sessionStorage confirms org existed → 800ms delay (PKCE safe)
  //   - Otherwise → 300ms delay (quick check, covers edge cases)
  //   - Retry timeout is 3s (short — prevents long waits for new users)
  const hydrateAuth = useCallback(
    async (session: MinimalSession | null) => {
      if (hydrating.current) return;
      hydrating.current = true;

      if (!session?.user) {
        hydrating.current = false;
        hydrationDone.current = false;
        setState({ ...EMPTY_STATE });
        return;
      }

      try {
        // Phase 1: Load profile + org in parallel (fast path).
        const [profile, orgData] = await Promise.all([
          raceTimeout(loadProfile(session.user.id, session), 5000, null),
          raceTimeout(loadOrganization(session.user.id), 5000, null),
        ]);

        // ★ If org is null, retry once. Covers PKCE timing + transient failures.
        //   Short delay + short timeout to minimize impact on genuinely new users.
        let finalOrgData = orgData;
        if (!orgData?.org) {
          const wasConfirmed = sessionStorage.getItem(ORG_CONFIRMED_KEY);
          await delay(wasConfirmed ? 800 : 300);
          finalOrgData = await raceTimeout(loadOrganization(session.user.id), 3000, null);
        }

        // Phase 2: If org exists, pre-load subscription
        let sub: DbSubscription | null = null;
        if (finalOrgData?.org) {
          sessionStorage.setItem(ORG_CONFIRMED_KEY, session.user.id);
          try {
            sub = await raceTimeout(
              subscriptionService.getByOrganization(finalOrgData.org.id),
              3000,
              null,
            );
          } catch {
            // Non-critical — PlanProvider can retry
          }
        }

        hydrationDone.current = true;
        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile,
          organization: finalOrgData?.org || null,
          membership: finalOrgData?.membership || null,
          subscription: sub,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: !!finalOrgData?.org,
        });
      } catch (err) {
        console.error('[Senda] Auth hydrate failed:', err);
        const prev = stateRef.current;
        hydrationDone.current = true;
        setState({
          session,
          user: { id: session.user.id, email: session.user.email },
          profile: prev.profile,
          organization: prev.organization,
          membership: prev.membership,
          subscription: prev.subscription,
          isLoading: false,
          isAuthenticated: true,
          hasOrganization: prev.hasOrganization,
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
      if (signingOut.current && event !== 'SIGNED_OUT') return;

      const session = rawSession as MinimalSession | null;

      if (event === 'SIGNED_OUT') {
        initialSessionHandled.current = false;
        hydrationDone.current = false;
        sessionStorage.removeItem(ORG_CONFIRMED_KEY);
        setState({ ...EMPTY_STATE });
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setState(prev => ({ ...prev, session }));
        }
        return;
      }

      if (event === 'USER_UPDATED') {
        if (session?.user) {
          const profile = await raceTimeout(
            loadProfile(session.user.id, session),
            4000,
            stateRef.current.profile,
          );
          if (mounted) setState(prev => ({ ...prev, session, profile }));
        }
        return;
      }

      if (event === 'INITIAL_SESSION') {
        initialSessionHandled.current = true;
        await hydrateAuth(session);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        if (hydrationDone.current) {
          setState(prev => ({
            ...prev,
            session,
            user: { id: session.user.id, email: session.user.email },
            isAuthenticated: true,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          session,
          user: { id: session.user.id, email: session.user.email },
          isAuthenticated: true,
          isLoading: true,
        }));
        await hydrateAuth(session);
        return;
      }
    });

    const fallback = setTimeout(() => {
      if (!initialSessionHandled.current && mounted) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (mounted && !initialSessionHandled.current) {
            initialSessionHandled.current = true;
            hydrateAuth(session as MinimalSession | null);
          }
        });
      }
    }, 400);

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setState(prev => {
          if (prev.isLoading) {
            console.warn('[Senda] Safety timeout: forcing isLoading=false after 5s');
            return { ...prev, isLoading: false };
          }
          return prev;
        });
      }
    }, 5_000);

    return () => {
      mounted = false;
      clearTimeout(fallback);
      clearTimeout(safetyTimer);
      listener?.subscription.unsubscribe();
    };
  }, [hydrateAuth, loadProfile]);

  const refreshProfile = useCallback(async () => {
    const s = stateRef.current;
    if (!s.user) return;
    const profile = await loadProfile(s.user.id, s.session);
    setState(prev => ({ ...prev, profile }));
  }, [loadProfile]);

  const refreshOrganization = useCallback(async () => {
    const s = stateRef.current;
    if (!s.user) return;
    const orgData = await loadOrganization(s.user.id);
    if (orgData?.org) {
      sessionStorage.setItem(ORG_CONFIRMED_KEY, s.user.id);
    }
    setState(prev => ({
      ...prev,
      organization: orgData?.org || null,
      membership: orgData?.membership || null,
      hasOrganization: !!orgData?.org,
    }));
  }, [loadOrganization]);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    hydrationDone.current = false;
    sessionStorage.removeItem(ORG_CONFIRMED_KEY);
    setState({ ...EMPTY_STATE });
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Senda] Sign out cleanup failed:', err);
    } finally {
      signingOut.current = false;
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({ ...state, refreshProfile, refreshOrganization, signOut }),
    [state, refreshProfile, refreshOrganization, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
