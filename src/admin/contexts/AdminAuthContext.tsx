// ============================================================================
// SADEEM Admin — Auth Context
// Independent from subscriber AuthProvider (src/hooks/useAuth.tsx).
// This provider wraps only admin routes via AdminLayout, NOT the whole app.
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { adminAuthService } from '../services/adminAuth.service';
import { adminSupabase } from '../services/adminSupabase';
import type {
  AdminUser,
  AdminLoginCredentials,
  AdminAuthState,
  ChangePasswordPayload,
  UpdateAdminProfilePayload,
  PermissionKey,
} from '../types';

interface AdminAuthContextType extends AdminAuthState {
  login: (credentials: AdminLoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (key: PermissionKey) => boolean;
  hasAnyPermission: (keys: PermissionKey[]) => boolean;
  hasAllPermissions: (keys: PermissionKey[]) => boolean;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  updateProfile: (payload: UpdateAdminProfilePayload) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    permissions: [],
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Guard against concurrent validateSession() calls (e.g., rapid navigation)
  const validatingRef = useRef(false);

  // Validate session on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (validatingRef.current) return;
      validatingRef.current = true;
      try {
        const session = await adminAuthService.validateSession();
        if (cancelled) return;

        if (session) {
          setState({
            user: session.adminUser,
            permissions: session.permissions,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            user: null,
            permissions: [],
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } finally {
        validatingRef.current = false;
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials: AdminLoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const session = await adminAuthService.login(credentials);
      setState({
        user: session.adminUser,
        permissions: session.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await adminAuthService.logout();
    setState({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const hasPermission = useCallback(
    (key: PermissionKey): boolean => {
      if (!state.user) return false;
      if (state.user.is_super_admin) return true;
      return state.permissions.includes(key);
    },
    [state.user, state.permissions]
  );

  const hasAnyPermission = useCallback(
    (keys: PermissionKey[]): boolean => keys.some((k) => hasPermission(k)),
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (keys: PermissionKey[]): boolean => keys.every((k) => hasPermission(k)),
    [hasPermission]
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      if (!state.user) throw new Error('غير مصرّح');
      await adminAuthService.changePassword(state.user.id, payload);
    },
    [state.user]
  );

  const updateProfile = useCallback(
    async (payload: UpdateAdminProfilePayload) => {
      if (!state.user) throw new Error('غير مصرّح');
      const { data, error } = await adminSupabase
        .from('admin_users')
        .update(payload)
        .eq('id', state.user.id)
        .select('*, role:admin_roles(*)')
        .single();

      if (error) throw new Error('فشل تحديث الملف الشخصي');
      setState((prev) => ({ ...prev, user: data as AdminUser }));
    },
    [state.user]
  );

  const refreshUser = useCallback(async () => {
    if (validatingRef.current) return;
    validatingRef.current = true;
    try {
      const session = await adminAuthService.validateSession();
      if (session) {
        setState((prev) => ({
          ...prev,
          user: session.adminUser,
          permissions: session.permissions,
        }));
      }
    } finally {
      validatingRef.current = false;
    }
  }, []);

  // Refresh permissions when the admin tab regains focus.
  // This keeps cached permissions from going stale if the admin's role
  // is changed by a super-admin while this session is open.
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshUser();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isAuthenticated, refreshUser]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      changePassword,
      updateProfile,
      refreshUser,
    }),
    [state, login, logout, hasPermission, hasAnyPermission, hasAllPermissions, changePassword, updateProfile, refreshUser]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
