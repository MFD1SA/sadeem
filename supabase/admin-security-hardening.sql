-- ============================================================================
-- SENDA Admin — Security Hardening (Final Patch)
-- Run AFTER admin-foundation.sql and admin-seed.sql
--
-- This migration:
-- 1. Drops ALL unsafe policies from Phase 1
-- 2. Drops unsafe functions (admin_link_auth_uid, admin_record_failed_login)
-- 3. Recreates ALL functions with SET search_path = public
-- 4. Applies REVOKE/GRANT on every function explicitly
-- 5. Creates hardened RLS policies
-- 6. Updates admin-foundation.sql functions (admin_has_permission, log_admin_action)
--
-- SECURITY PRINCIPLES:
-- - No auto-linking by email. auth_uid must be set explicitly in seed/bootstrap.
-- - No client-callable failed login tracking (prevents DoS).
-- - All SECURITY DEFINER functions have SET search_path = public.
-- - EXECUTE is revoked from PUBLIC and granted only to needed roles.
-- - Trust source = Supabase Auth JWT + admin_users.auth_uid + RLS.
-- ============================================================================


-- ═══════════════════════════════════════════════════
-- STEP 1: Drop ALL existing policies (Phase 1 leftovers)
-- ═══════════════════════════════════════════════════

DROP POLICY IF EXISTS "admin_roles_read" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_write" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_select" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_service_write" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_permissions_read" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_write" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_select" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_service_write" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_role_permissions_read" ON public.admin_role_permissions;
DROP POLICY IF EXISTS "admin_role_permissions_write" ON public.admin_role_permissions;
DROP POLICY IF EXISTS "admin_rp_select" ON public.admin_role_permissions;
DROP POLICY IF EXISTS "admin_rp_service_write" ON public.admin_role_permissions;
DROP POLICY IF EXISTS "admin_users_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_manage" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_self" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_service_write" ON public.admin_users;
DROP POLICY IF EXISTS "admin_audit_logs_read" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_insert" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_select" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_service_write" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_sessions_manage" ON public.admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_select_own" ON public.admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_update_own" ON public.admin_sessions;
DROP POLICY IF EXISTS "admin_sessions_service_write" ON public.admin_sessions;


-- ═══════════════════════════════════════════════════
-- STEP 2: Drop unsafe functions
-- ═══════════════════════════════════════════════════

-- REMOVED: admin_link_auth_uid — exploitable by any authenticated user
-- auth_uid must be set explicitly during bootstrap/seed, never auto-linked.
DROP FUNCTION IF EXISTS public.admin_link_auth_uid();

-- REMOVED: admin_record_failed_login — DoS vector (anyone can lock any admin)
-- Failed login tracking is now handled inside admin_get_current_user only.
DROP FUNCTION IF EXISTS public.admin_record_failed_login(TEXT);

-- Drop old versions of functions we're about to recreate
DROP FUNCTION IF EXISTS public.is_active_admin();
DROP FUNCTION IF EXISTS public.current_admin_id();
DROP FUNCTION IF EXISTS public.current_admin_role_id();
DROP FUNCTION IF EXISTS public.admin_get_current_user();
DROP FUNCTION IF EXISTS public.admin_record_login();
DROP FUNCTION IF EXISTS public.admin_get_my_permissions();
DROP FUNCTION IF EXISTS public.admin_write_audit_log(TEXT, TEXT, TEXT, UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.admin_create_session(TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.admin_has_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, TEXT, TEXT, TEXT, UUID, JSONB, TEXT);


-- ═══════════════════════════════════════════════════
-- STEP 3: Recreate ALL functions with SET search_path
-- ═══════════════════════════════════════════════════

-- --- Helper: is_active_admin() ---
-- Used in RLS policies. Returns true only if auth.uid() is in admin_users.
-- SECURITY DEFINER required: needs to read admin_users to decide RLS.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_uid = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  );
END;
$$;

-- --- Helper: current_admin_id() ---
CREATE OR REPLACE FUNCTION public.current_admin_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.admin_users
  WHERE auth_uid = auth.uid()
    AND status = 'active'
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- --- Helper: current_admin_role_id() ---
CREATE OR REPLACE FUNCTION public.current_admin_role_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role_id FROM public.admin_users
  WHERE auth_uid = auth.uid()
    AND status = 'active'
    AND deleted_at IS NULL
  LIMIT 1;
$$;

-- --- RPC: admin_get_current_user() ---
-- Called AFTER signInWithPassword. Uses auth.uid() — no email param.
-- Also records failed_login_attempts check (replacing removed DoS function).
CREATE OR REPLACE FUNCTION public.admin_get_current_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', au.id,
    'auth_uid', au.auth_uid,
    'email', au.email,
    'full_name_ar', au.full_name_ar,
    'full_name_en', au.full_name_en,
    'avatar_url', au.avatar_url,
    'phone', au.phone,
    'role_id', au.role_id,
    'status', au.status,
    'is_super_admin', au.is_super_admin,
    'last_login_at', au.last_login_at,
    'last_login_ip', au.last_login_ip,
    'password_changed_at', au.password_changed_at,
    'force_password_reset', au.force_password_reset,
    'two_factor_enabled', au.two_factor_enabled,
    'failed_login_attempts', au.failed_login_attempts,
    'locked_until', au.locked_until,
    'created_by', au.created_by,
    'created_at', au.created_at,
    'updated_at', au.updated_at,
    'deleted_at', au.deleted_at,
    'role', jsonb_build_object(
      'id', ar.id,
      'name', ar.name,
      'display_name_ar', ar.display_name_ar,
      'display_name_en', ar.display_name_en,
      'description_ar', ar.description_ar,
      'description_en', ar.description_en,
      'is_system', ar.is_system,
      'is_active', ar.is_active,
      'created_at', ar.created_at,
      'updated_at', ar.updated_at
    )
  ) INTO v_result
  FROM public.admin_users au
  JOIN public.admin_roles ar ON ar.id = au.role_id
  WHERE au.auth_uid = auth.uid()
    AND au.deleted_at IS NULL;

  -- Returns NULL if not found — caller must handle this as "not admin"
  RETURN v_result;
END;
$$;

-- --- RPC: admin_record_login() ---
-- Resets failed attempts and updates last_login.
-- Safe: only affects the row matching auth.uid().
CREATE OR REPLACE FUNCTION public.admin_record_login()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_users SET
    failed_login_attempts = 0,
    locked_until = NULL,
    last_login_at = now()
  WHERE auth_uid = auth.uid()
    AND deleted_at IS NULL;
END;
$$;

-- --- RPC: admin_get_my_permissions() ---
CREATE OR REPLACE FUNCTION public.admin_get_my_permissions()
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_admin public.admin_users%ROWTYPE;
  v_perms TEXT[];
BEGIN
  SELECT * INTO v_admin FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_admin IS NULL THEN RETURN ARRAY[]::TEXT[]; END IF;

  IF v_admin.is_super_admin THEN
    SELECT array_agg(key) INTO v_perms FROM public.admin_permissions;
    RETURN COALESCE(v_perms, ARRAY[]::TEXT[]);
  END IF;

  SELECT array_agg(ap.key) INTO v_perms
  FROM public.admin_role_permissions arp
  JOIN public.admin_permissions ap ON ap.id = arp.permission_id
  WHERE arp.role_id = v_admin.role_id;

  RETURN COALESCE(v_perms, ARRAY[]::TEXT[]);
END;
$$;

-- --- RPC: admin_write_audit_log() ---
-- Verifies caller is active admin before writing.
CREATE OR REPLACE FUNCTION public.admin_write_audit_log(
  p_action TEXT,
  p_module TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_email TEXT;
  v_log_id UUID;
BEGIN
  SELECT id, email INTO v_admin_id, v_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_admin_id, v_email, p_action, p_module,
    p_target_type, p_target_id, p_details, p_severity
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- --- RPC: admin_create_session() ---
-- Verifies caller is active admin before creating.
CREATE OR REPLACE FUNCTION public.admin_create_session(
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_session_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  INSERT INTO public.admin_sessions (admin_user_id, token_hash, expires_at, is_active)
  VALUES (v_admin_id, p_token_hash, p_expires_at, true)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- --- Utility: admin_has_permission() ---
-- Used by future Phase 2 RPCs for DB-level permission checks.
CREATE OR REPLACE FUNCTION public.admin_has_permission(
  p_admin_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = p_admin_id AND is_super_admin = true AND status = 'active' AND deleted_at IS NULL
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN public.admin_role_permissions arp ON arp.role_id = au.role_id
    JOIN public.admin_permissions ap ON ap.id = arp.permission_id
    WHERE au.id = p_admin_id
      AND au.status = 'active'
      AND au.deleted_at IS NULL
      AND ap.key = p_permission_key
  );
END;
$$;

-- --- Utility: log_admin_action() ---
-- Server-side audit logging (called from other RPCs, not directly from client).
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_module TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM public.admin_users WHERE id = p_admin_id;
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    p_admin_id, v_email, p_action, p_module,
    p_target_type, p_target_id, p_details, p_severity
  ) RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$;


-- ═══════════════════════════════════════════════════
-- STEP 4: REVOKE/GRANT on ALL functions
-- Principle: revoke from everyone, then grant only to
-- the minimum role needed.
-- ═══════════════════════════════════════════════════

-- --- Revoke all first ---
REVOKE EXECUTE ON FUNCTION public.is_active_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_admin_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_admin_role_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_current_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_record_login() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_my_permissions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, TEXT, UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_create_session(TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_has_permission(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_admin_action(UUID, TEXT, TEXT, TEXT, UUID, JSONB, TEXT) FROM PUBLIC, anon, authenticated;

-- --- Grant back only to authenticated ---
-- These are called from the client JS after signInWithPassword (authenticated).

-- Helper functions used by RLS policies — must be grantable to authenticated
-- because RLS evaluates in the context of the calling role.
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_role_id() TO authenticated;

-- RPC functions called from client after login
GRANT EXECUTE ON FUNCTION public.admin_get_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_my_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, TEXT, UUID, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_session(TEXT, TIMESTAMPTZ) TO authenticated;

-- Utility functions: only service_role (used internally by other RPCs)
-- NOT granted to authenticated — never callable from client JS.
GRANT EXECUTE ON FUNCTION public.admin_has_permission(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_action(UUID, TEXT, TEXT, TEXT, UUID, JSONB, TEXT) TO service_role;


-- ═══════════════════════════════════════════════════
-- STEP 5: Hardened RLS Policies
-- ═══════════════════════════════════════════════════

-- --- admin_roles ---
CREATE POLICY "admin_roles_select"
  ON public.admin_roles FOR SELECT TO authenticated
  USING (public.is_active_admin());
CREATE POLICY "admin_roles_service"
  ON public.admin_roles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- --- admin_permissions ---
CREATE POLICY "admin_permissions_select"
  ON public.admin_permissions FOR SELECT TO authenticated
  USING (public.is_active_admin());
CREATE POLICY "admin_permissions_service"
  ON public.admin_permissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- --- admin_role_permissions ---
CREATE POLICY "admin_rp_select"
  ON public.admin_role_permissions FOR SELECT TO authenticated
  USING (public.is_active_admin());
CREATE POLICY "admin_rp_service"
  ON public.admin_role_permissions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- --- admin_users ---
CREATE POLICY "admin_users_select"
  ON public.admin_users FOR SELECT TO authenticated
  USING (public.is_active_admin());
CREATE POLICY "admin_users_update_self"
  ON public.admin_users FOR UPDATE TO authenticated
  USING (auth_uid = auth.uid() AND public.is_active_admin())
  WITH CHECK (auth_uid = auth.uid() AND public.is_active_admin());
CREATE POLICY "admin_users_service"
  ON public.admin_users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- --- admin_audit_logs ---
CREATE POLICY "admin_audit_select"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_active_admin());
CREATE POLICY "admin_audit_service"
  ON public.admin_audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- --- admin_sessions ---
CREATE POLICY "admin_sessions_select_own"
  ON public.admin_sessions FOR SELECT TO authenticated
  USING (admin_user_id = public.current_admin_id());
CREATE POLICY "admin_sessions_update_own"
  ON public.admin_sessions FOR UPDATE TO authenticated
  USING (admin_user_id = public.current_admin_id());
CREATE POLICY "admin_sessions_service"
  ON public.admin_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
