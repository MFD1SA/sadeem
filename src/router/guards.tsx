// ============================================================================
// SADEEM — Subscriber Route Guards (with RBAC)
//
// These guards protect subscriber routes (/dashboard/*, /onboarding, /login).
// Admin routes (/admin/*) are protected separately by AdminAuthProvider.
//
// RBAC additions:
// - If authenticated user is an admin → redirect to /admin/dashboard
//   (prevents admin from accidentally using subscriber dashboard)
// - check_is_admin() RPC is a lightweight server check
// ============================================================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { LoadingState } from '@/components/ui/LoadingState';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ADMIN_CACHE_KEY = 'sadeem_admin_check';
const ADMIN_CHECK_TIMEOUT_MS = 5000;

/**
 * Hook: check if current auth.uid() is an admin.
 *
 * CRITICAL: waits for useAuth to fully resolve before starting — this avoids
 * Supabase lock contention. Previously this hook called getSession() on mount,
 * which competed for the "lock:sadeem-auth" BroadcastChannel lock that
 * onAuthStateChange (inside AuthProvider) also holds during INITIAL_SESSION.
 * The result was a 5-second delay before the login page appeared.
 *
 * Now we only start the admin check AFTER useAuth signals it's done
 * (authLoading = false), at which point the lock is already free.
 */
function useAdminCheck() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Don't start until auth is fully resolved — avoids lock contention
    if (authLoading) return;

    let cancelled = false;

    async function check() {
      try {
        // Not authenticated → no admin check needed, resolve immediately
        if (!isAuthenticated || !user) {
          if (!cancelled) { setIsAdmin(false); setChecking(false); }
          return;
        }

        // Serve from cache if it belongs to the current user
        try {
          const raw = sessionStorage.getItem(ADMIN_CACHE_KEY);
          if (raw) {
            const cached = JSON.parse(raw) as { uid: string; value: boolean };
            if (cached.uid === user.id) {
              if (!cancelled) { setIsAdmin(cached.value); setChecking(false); }
              return;
            }
          }
        } catch {
          sessionStorage.removeItem(ADMIN_CACHE_KEY);
        }

        // Fresh RPC check — race against a 5-second timeout so the
        // guard never blocks the UI indefinitely on network failure.
        const rpcPromise = supabase.rpc('check_is_admin').then(({ data }) => data === true);
        const timeoutPromise = new Promise<boolean>((resolve) =>
          setTimeout(() => resolve(false), ADMIN_CHECK_TIMEOUT_MS)
        );
        const result = await Promise.race([rpcPromise, timeoutPromise]);

        sessionStorage.setItem(
          ADMIN_CACHE_KEY,
          JSON.stringify({ uid: user.id, value: result })
        );
        if (!cancelled) { setIsAdmin(result); setChecking(false); }
      } catch {
        if (!cancelled) { setIsAdmin(false); setChecking(false); }
      }
    }

    check();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, user]);

  return { isAdmin, checking };
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * Redirects admin users to /admin/dashboard.
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

  // Admin user trying to access subscriber area → redirect to admin
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * Requires completed onboarding. Redirects to /onboarding if no organization.
 * Redirects admin users to /admin/dashboard.
 */
export function RequireOrganization() {
  const { hasOrganization, isLoading, isAuthenticated } = useAuth();
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

  // Admin user → redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!hasOrganization) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/**
 * Subscription gate — MUST be rendered inside PlanProvider.
 * Place this component as the content outlet inside SubscriberLayout so that
 * expired subscribers (including those with no subscription row) are redirected
 * to the billing page before any protected page renders.
 *
 * The billing page itself is always accessible so users can renew.
 * All other /dashboard/* routes require a non-expired subscription.
 */
export function SubscriptionGate() {
  const { trial, isLoading } = usePlan();
  const location = useLocation();

  // While subscription data is loading, render nothing in the content area.
  // The surrounding layout (sidebar, topbar) remains visible.
  if (isLoading) return null;

  // Billing page is always accessible — prevent redirect loop.
  if (location.pathname === '/dashboard/billing') return <Outlet />;

  // Expired or missing subscription → force to billing.
  if (trial.isExpired) {
    return <Navigate to="/dashboard/billing" replace />;
  }

  return <Outlet />;
}

/**
 * Redirect authenticated users away from login/signup pages.
 * Admin users → /admin/dashboard.
 * Subscriber users → /dashboard or /onboarding.
 */
export function RedirectIfAuthenticated() {
  const { isAuthenticated, hasOrganization, isLoading } = useAuth();
  const { isAdmin, checking } = useAdminCheck();

  // Show spinner only while auth is loading, OR while admin-check runs
  // (admin-check only runs for authenticated users, so unauthenticated
  // visitors reach the login form as soon as useAuth resolves — no extra wait)
  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (isAuthenticated) {
    // Admin → admin dashboard
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Subscriber → dashboard or onboarding
    if (hasOrganization) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
