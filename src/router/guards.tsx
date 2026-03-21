import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/LoadingState';

/**
 * Requires authentication. Redirects to /login if not authenticated.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

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

  return <Outlet />;
}

/**
 * Requires completed onboarding. Redirects to /onboarding if no organization.
 */
export function RequireOrganization() {
  const { hasOrganization, isLoading, isAuthenticated } = useAuth();

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
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

/**
 * Redirect authenticated users away from login/signup pages.
 */
export function RedirectIfAuthenticated() {
  const { isAuthenticated, hasOrganization, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (isAuthenticated && hasOrganization) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !hasOrganization) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
