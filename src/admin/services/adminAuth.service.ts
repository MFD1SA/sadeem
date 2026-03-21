// ============================================================================
// SADEEM Admin — Auth Service (Final Hardened)
//
// SECURITY MODEL:
// 1. signInWithPassword() FIRST → Supabase Auth verifies bcrypt server-side
// 2. RPC admin_get_current_user() → server checks auth.uid() ∈ admin_users
//    - auth_uid MUST be pre-set in admin_users during bootstrap
//    - NO auto-linking by email. NO admin_link_auth_uid.
// 3. If not active admin → signOut immediately
// 4. RPC admin_record_login() → safe, only updates own row via auth.uid()
// 5. RPC admin_get_my_permissions() → server-side, returns [] for non-admin
// 6. admin_sessions = optional tracking, NOT trust source
// 7. Trust source = Supabase Auth JWT + admin_users.auth_uid + RLS
//
// REMOVED:
// - admin_link_auth_uid (exploitable)
// - admin_record_failed_login (DoS vector)
// ============================================================================

import { adminSupabase } from './adminSupabase';
import { SESSION_CONFIG } from '../utils/constants';
import type { AdminUser, AdminLoginCredentials, AdminSessionData, ChangePasswordPayload } from '../types';

// --- Crypto helpers for optional session tracking ---

function generateToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

// --- Service ---

class AdminAuthService {
  private static instance: AdminAuthService;
  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  /**
   * LOGIN FLOW (final):
   *
   * 1. signInWithPassword → Supabase Auth (bcrypt, server-side)
   *    If fails → generic error, NO server-side failed attempt tracking
   *    (removed to prevent DoS — Supabase Auth has its own rate limiting)
   *
   * 2. RPC admin_get_current_user() → SECURITY DEFINER
   *    Checks auth.uid() against admin_users.auth_uid
   *    auth_uid must be pre-set during bootstrap — no auto-link
   *    Returns NULL if not admin → signOut + reject
   *
   * 3. Check status + locked_until → signOut if not active
   *
   * 4. RPC admin_record_login() → safe, WHERE auth_uid = auth.uid()
   *
   * 5. RPC admin_get_my_permissions() → server-side permission array
   *
   * 6. RPC admin_create_session() → optional tracking
   *
   * 7. RPC admin_write_audit_log() → audit trail
   */
  async login(credentials: AdminLoginCredentials): Promise<AdminSessionData> {
    const email = credentials.email.toLowerCase().trim();

    // ── STEP 1: Supabase Auth FIRST ──
    // Password verified server-side. No pre-auth queries.
    const { data: authData, error: authErr } = await adminSupabase.auth.signInWithPassword({
      email,
      password: credentials.password,
    });

    if (authErr || !authData.user) {
      // No RPC call here — removed admin_record_failed_login to prevent DoS.
      // Supabase Auth has built-in rate limiting on signInWithPassword.
      throw new Error('بيانات الدخول غير صحيحة');
    }

    // ── STEP 2: Verify admin via RPC ──
    // admin_get_current_user uses auth.uid() internally.
    // auth_uid must already be set in admin_users — no auto-linking.
    const { data: adminUserJson, error: rpcErr } = await adminSupabase.rpc('admin_get_current_user');

    if (rpcErr || !adminUserJson) {
      // Authenticated in Supabase Auth but NOT an admin → sign out
      await adminSupabase.auth.signOut();
      throw new Error('ليس لديك صلاحية الوصول لهذا النظام');
    }

    const adminUser = adminUserJson as AdminUser;

    // ── STEP 3: Check lock / status ──
    if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
      await adminSupabase.auth.signOut();
      throw new Error('الحساب مقفل مؤقتاً. حاول مرة أخرى لاحقاً');
    }

    if (adminUser.status !== 'active') {
      await adminSupabase.auth.signOut();
      throw new Error('الحساب غير نشط. تواصل مع المدير العام');
    }

    // ── STEP 4: Record successful login ──
    try {
      await adminSupabase.rpc('admin_record_login');
    } catch { /* non-critical */ }

    // ── STEP 5: Permissions ──
    let permissions: string[] = [];
    try {
      const { data: perms } = await adminSupabase.rpc('admin_get_my_permissions');
      permissions = (perms as string[]) ?? [];
    } catch { /* empty permissions fallback */ }

    // ── STEP 6: Optional tracking session ──
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(
      Date.now() + SESSION_CONFIG.SESSION_DURATION_HOURS * 60 * 60 * 1000
    ).toISOString();

    try {
      await adminSupabase.rpc('admin_create_session', {
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
      });
      localStorage.setItem(SESSION_CONFIG.TOKEN_KEY, token);
    } catch { /* tracking is optional */ }

    // ── STEP 7: Audit log ──
    try {
      await adminSupabase.rpc('admin_write_audit_log', {
        p_action: 'auth.login',
        p_module: 'auth',
        p_severity: 'info',
        p_details: { method: 'password' },
      });
    } catch { /* best-effort */ }

    return { adminUser, permissions, expiresAt };
  }

  /**
   * VALIDATE SESSION:
   * 1. Supabase Auth getSession() → JWT must be valid
   * 2. RPC admin_get_current_user() → auth.uid() must be active admin
   */
  async validateSession(): Promise<AdminSessionData | null> {
    try {
      const { data: { session }, error: sessErr } = await adminSupabase.auth.getSession();
      if (sessErr || !session) {
        this.clearLocal();
        return null;
      }

      const { data: adminUserJson, error: rpcErr } = await adminSupabase.rpc('admin_get_current_user');
      if (rpcErr || !adminUserJson) {
        this.clearLocal();
        await adminSupabase.auth.signOut();
        return null;
      }

      const adminUser = adminUserJson as AdminUser;
      if (adminUser.status !== 'active' || adminUser.deleted_at) {
        this.clearLocal();
        await adminSupabase.auth.signOut();
        return null;
      }

      let permissions: string[] = [];
      try {
        const { data: perms } = await adminSupabase.rpc('admin_get_my_permissions');
        permissions = (perms as string[]) ?? [];
      } catch { /* empty */ }

      const expiresAt = session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

      return { adminUser, permissions, expiresAt };
    } catch {
      this.clearLocal();
      return null;
    }
  }

  /** LOGOUT */
  async logout(): Promise<void> {
    const token = localStorage.getItem(SESSION_CONFIG.TOKEN_KEY);
    if (token) {
      try {
        const tokenHash = await hashToken(token);
        // RLS: admin_sessions_update_own allows updating own sessions
        await adminSupabase
          .from('admin_sessions')
          .update({ is_active: false })
          .eq('token_hash', tokenHash);
      } catch { /* best-effort */ }
    }
    this.clearLocal();
    await adminSupabase.auth.signOut();
  }

  /**
   * CHANGE PASSWORD:
   * Re-authenticates with current password via signInWithPassword FIRST.
   * Supabase Auth's updateUser requires a session but does NOT verify old password,
   * so we verify manually.
   */
  async changePassword(adminId: string, payload: ChangePasswordPayload): Promise<void> {
    if (payload.new_password !== payload.confirm_password) {
      throw new Error('كلمة المرور الجديدة غير متطابقة');
    }
    if (payload.new_password.length < 8) {
      throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }

    // ── Re-authenticate with current password ──
    const { data: { user } } = await adminSupabase.auth.getUser();
    if (!user?.email) throw new Error('جلسة غير صالحة');

    const { error: verifyErr } = await adminSupabase.auth.signInWithPassword({
      email: user.email,
      password: payload.current_password,
    });
    if (verifyErr) throw new Error('كلمة المرور الحالية غير صحيحة');

    // ── Update password ──
    const { error: updateErr } = await adminSupabase.auth.updateUser({
      password: payload.new_password,
    });
    if (updateErr) throw new Error('فشل تغيير كلمة المرور: ' + updateErr.message);

    // ── Update admin record (self-update allowed by RLS) ──
    await adminSupabase
      .from('admin_users')
      .update({ password_changed_at: new Date().toISOString(), force_password_reset: false })
      .eq('id', adminId);

    // ── Audit ──
    try {
      await adminSupabase.rpc('admin_write_audit_log', {
        p_action: 'auth.password_change',
        p_module: 'auth',
        p_severity: 'warning',
      });
    } catch { /* best-effort */ }
  }

  private clearLocal(): void {
    localStorage.removeItem(SESSION_CONFIG.TOKEN_KEY);
  }
}

export const adminAuthService = AdminAuthService.getInstance();
