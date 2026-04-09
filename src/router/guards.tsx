// ============================================================================
// SENDA — Subscriber Route Guards (with RBAC)
//
// ★ IMPORTANT ARCHITECTURE NOTE:
//   RequireAuth wraps /onboarding ONLY.
//   RequireOrganization wraps /dashboard/* INDEPENDENTLY (NOT inside RequireAuth).
//   Therefore RequireOrganization MUST handle isLoading itself.
//
//   Guard hierarchy for /dashboard/*:
//     RequireOrganization → SubscriberLayout → PlanProvider → SubscriptionGate
//
//   Guard hierarchy for /onboarding:
//     RequireAuth → Onboarding
// ============================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { LoadingState } from '@/components/ui/LoadingState';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_CACHE_KEY = 'sadeem_admin_check';
const ADMIN_CHECK_TIMEOUT_MS = 1500;
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Hook: check if current auth.uid() is an admin.
 * Waits for useAuth to fully resolve before starting (avoids lock contention).
 */
function useAdminCheck() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function check() {
      try {
        if (!isAuthenticated || !userId) {
          if (!cancelled) { setIsAdmin(false); setChecking(false); }
          return;
        }

        try {
          const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as { uid: string; value: boolean; ts?: number };
            const age = cached.ts ? Date.now() - cached.ts : Infinity;
            if (cached.uid === userId && age < ADMIN_CACHE_TTL_MS) {
              if (!cancelled) { setIsAdmin(cached.value); setChecking(false); }
              return;
            }
          }
        } catch {
          sessionStorage.removeItem(ADMIN_CACHE_KEY);
        }

        const rpcPromise = supabase.rpc('check_is_admin').then(({ data }) => data === true);
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), ADMIN_CHECK_TIMEOUT_MS)
        );
        const result = await Promise.race([rpcPromise, timeoutPromise]);

        sessionStorage.setItem(
          ADMIN_CACHE_KEY,
          JSON.stringify({ uid: userId, value: result, ts: Date.now() })
        );
        if (!cancelled) { setIsAdmin(result); setChecking(false); }
      } catch {
        if (!cancelled) { setIsAdmin(false); setChecking(false); }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, userId]);

  return { isAdmin, checking };
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * Redirects admin users to /admin/dashboard.
 *
 * Used for: /onboarding
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin, checking } = useAdminCheck();

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * Requires authentication + completed onboarding (organization exists).
 * Redirects to /login if not authenticated, /onboarding if no organization.
 *
 * Used for: /dashboard/* (NOT nested inside RequireAuth — handles auth independently)
 *
 * ★ PERF: Shows ONE spinner while auth is loading. No admin RPC check here
 *   (admin check only needed for /onboarding redirect, not for dashboard access).
 *   No retry state — orgConfirmed ref prevents false redirects silently.
 */
export function RequireOrganization() {
  const { hasOrganization, isLoading, isAuthenticated, refreshOrganization } = useAuth();

  // Initialize from sessionStorage — survives page reloads and tab switches.
  const orgConfirmed = useRef(
    (() => {
      try { return !!sessionStorage.getItem('sadeem_org_confirmed'); }
      catch { return false; }
    })()
  );

  // Once org is confirmed, remember it for the component lifetime
  if (hasOrganization) orgConfirmed.current = true;

  // ★ MUST check isLoading — this guard is NOT inside RequireAuth.
  //   Without this, isAuthenticated=false during initial load would
  //   cause a flash redirect to /login before auth resolves.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasOrganization) {
    // If org was previously confirmed, don't redirect — trigger silent refresh.
    if (orgConfirmed.current) {
      refreshOrganization().catch(() => {});
      return <Outlet />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/**
 * Subscription gate — rendered inside SubscriberLayout (inside PlanProvider).
 */
export function SubscriptionGate() {
  const { trial, isLoading } = usePlan();
  const location = useLocation();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <LoadingState />
    </div>
  );

  if (location.pathname === '/dashboard/billing') return <Outlet />;

  if (trial.isExpired) {
    return <Navigate to="/dashboard/billing" replace />;
  }

  return <Outlet />;
}

/**
 * Redirect authenticated users away from login/signup pages.
 */
export function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdmin } = useAdminCheck();

  if (isLoading) return <Outlet />;

  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
