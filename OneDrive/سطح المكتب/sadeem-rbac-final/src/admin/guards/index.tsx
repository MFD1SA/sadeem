// ============================================================================
// SADEEM Admin — Route Guards
// Independent from subscriber guards (src/router/guards.tsx).
// ============================================================================

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { ADMIN_ROUTES } from '../utils/constants';
import type { PermissionKey } from '../types';

// --- Loading state ---

function AdminGuardLoading() {
  return (
    <div className="admin-guard-loading">
      <div className="admin-guard-loading-inner">
        <div className="admin-spinner" />
        <span className="text-sm text-slate-400 tracking-wide mt-4">جاري التحقق...</span>
      </div>
    </div>
  );
}

// --- Unauthorized page ---

function AdminUnauthorized() {
  const { logout } = useAdminAuth();
  return (
    <div className="admin-guard-loading" dir="rtl">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">غير مصرّح بالوصول</h1>
        <p className="text-slate-400 text-sm mb-8">
          ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href={ADMIN_ROUTES.DASHBOARD}
            className="px-5 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            العودة للوحة التحكم
          </a>
          <button
            onClick={() => logout()}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

// --- RequireAdminAuth ---

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) return <AdminGuardLoading />;
  if (!isAuthenticated) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// --- RequireAdminPermission ---

export function RequireAdminPermission({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
}: {
  children: ReactNode;
  permission?: PermissionKey;
  permissions?: PermissionKey[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useAdminAuth();

  if (isLoading) return <AdminGuardLoading />;

  let hasAccess = true;
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : <AdminUnauthorized />;
  }
  return <>{children}</>;
}

// --- RedirectIfAdminAuthenticated ---

export function RedirectIfAdminAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) return <AdminGuardLoading />;
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ADMIN_ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }
  return <>{children}</>;
}

// --- PermissionGate (inline, for hiding UI elements) ---

export function PermissionGate({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode;
  permission: PermissionKey;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useAdminAuth();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
