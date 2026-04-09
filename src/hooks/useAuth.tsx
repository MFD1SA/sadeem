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
// Survives React re-renders, navigation, and strict-mode remounts.
// Cleared on sign-out.
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

  // Track whether INITIAL_SESSION has already been handled to prevent
  // the getSession() fallback from double-hydrating.
  const initialSessionHandled = useRef(false);
  // Track in-flight hydration to prevent concurrent calls.
  const hydrating = useRef(false);
  // Track whether a full hydration has completed successfully (with a user).
  // This ref is updated synchronously in hydrateAuth, so concurrent event
  // handlers can reliably check it without waiting for React re-render.
  const hydrationDone = useRef(false);
  // Guard: while signing out, ignore auth events that would re-hydrate.
  const signingOut = useRef(false);

  // ── Stable refs for callbacks that need current state without
  //    invalidating their memoization ──────────────────────────────
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

  // ── Core hydration: loads profile + org + subscription ──────────
  //
  // ★ KEY FIX: If org fails to load on first attempt (common after PKCE
  //   exchange because the JWT may not have fully propagated), retry once
  //   after 1 second. This eliminates the false onboarding redirect.
  const hydrateAuth = useCallback(
    async (session: MinimalSession | null) => {
      // Prevent concurrent hydrations — but DON'T silently return.
      // If someone calls us while we're running, the caller already set
      // isLoading=true. The current hydration will finish and set isLoading=false,
      // so the state is self-healing. We just skip the duplicate work.
      if (hydrating.current) return;
      hydrating.current = true;

      if (!session?.user) {
        hydrating.current = false;
        hydrationDone.current = false;
        setState({ ...EMPTY_STATE });
        return;
      }

      try {
        // Phase 1: Load profile + org in parallel.
        const [profile, orgData] = await Promise.all([
          raceTimeout(loadProfile(session.user.id, session), 6000, null),
          raceTimeout(loadOrganization(session.user.id), 6000, null),
        ]);

        // ★ FIX: If org is null but we expect one (e.g. existing user after
        // OAuth PKCE exchange), retry once. The JWT might not have propagated
        // on the first attempt.
        let finalOrgData = orgData;
        if (!orgData?.org) {
          // Check sessionStorage — if org was confirmed before, it likely exists
          const wasConfirmed = sessionStorage.getItem(ORG_CONFIRMED_KEY);
          if (wasConfirmed) {
            await delay(1000);
            finalOrgData = await raceTimeout(loadOrganization(session.user.id), 6000, null);
          }
        }

        // Phase 2: If org exists, pre-load subscription in parallel
        let sub: DbSubscription | null = null;
        if (finalOrgData?.org) {
          // Persist org confirmation for future sessions / tab returns
          sessionStorage.setItem(ORG_CONFIRMED_KEY, session.user.id);
          try {
            sub = await raceTimeout(
              subscriptionService.getByOrganization(finalOrgData.org.id),
              4000,
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
        // ★ FIX: PRESERVE existing org/profile data on failure.
        //   Previously this cleared everything → user redirected to onboarding.
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

      // ── SIGNED_OUT ─────────────────────────────────────────────
      if (event === 'SIGNED_OUT') {
        initialSessionHandled.current = false;
        hydrationDone.current = false;
        // Clear org confirmation on sign-out
        sessionStorage.removeItem(ORG_CONFIRMED_KEY);
        setState({ ...EMPTY_STATE });
        return;
      }

      // ── TOKEN_REFRESHED ────────────────────────────────────────
      // Only update session token. Do NOT reload profile/org.
      // Do NOT touch isLoading — this must be transparent.
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setState(prev => ({ ...prev, session }));
        }
        return;
      }

      // ── USER_UPDATED ───────────────────────────────────────────
      // Only refresh profile (e.g. after password change). No org reload.
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

      // ── INITIAL_SESSION ────────────────────────────────────────
      if (event === 'INITIAL_SESSION') {
        initialSessionHandled.current = true;
        await hydrateAuth(session);
        return;
      }

      // ── SIGNED_IN ──────────────────────────────────────────────
      if (event === 'SIGNED_IN' && session?.user) {
        // ★ FIX: If already hydrated (INITIAL_SESSION ran first, or
        //   returning to a tab), just update session — do NOT set
        //   isLoading=true, do NOT reload org/profile.
        if (hydrationDone.current) {
          setState(prev => ({
            ...prev,
            session,
            user: { id: session.user.id, email: session.user.email },
            isAuthenticated: true,
            // ★ CRITICAL: never set isLoading=true here — this is what
            //   caused "جاري التحميل" to appear on tab return.
          }));
          return;
        }

        // Fresh login: mark authenticated immediately so
        // RedirectIfAuthenticated redirects without waiting.
        // ★ FIX: Only set isLoading=true if hydration will actually run.
        //   If hydrateAuth is blocked (hydrating.current=true), the
        //   in-flight hydration from INITIAL_SESSION will finish and
        //   set isLoading=false.
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

    // Fallback: if INITIAL_SESSION doesn't fire within 400ms, call getSession()
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

    // ★ Global safety timeout — force isLoading=false after 5 seconds
    //   no matter what. Prevents infinite loading in ALL edge cases.
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

  // ── Stable callbacks: use refs so the function identity never changes ──
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

  // ── Memoized context value: only changes when state actually changes ──
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
