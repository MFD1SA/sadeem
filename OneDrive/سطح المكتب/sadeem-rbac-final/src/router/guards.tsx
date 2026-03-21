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

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/LoadingState';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook: check if current auth.uid() is an admin.
 * Uses the subscriber Supabase client (same auth JWT).
 * Returns { isAdmin, checking }.
 */
function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setChecking(false); return; }

        const { data } = await supabase.rpc('check_is_admin');
        if (!cancelled) setIsAdmin(data === true);
      } catch {
        // If RPC doesn't exist yet (migration not run), treat as non-admin
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

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
 * Redirect authenticated users away from login/signup pages.
 * Admin users → /admin/dashboard.
 * Subscriber users → /dashboard or /onboarding.
 */
export function RedirectIfAuthenticated() {
  const { isAuthenticated, hasOrganization, isLoading } = useAuth();
  const { isAdmin, checking } = useAdminCheck();

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
