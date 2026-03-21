-- ============================================================================
-- SADEEM Admin — Phase 2: User Management RPCs
-- Run AFTER admin-security-hardening.sql
--
-- Creates SECURITY DEFINER RPCs for all admin_users write operations.
-- Each RPC:
--   1. Verifies caller is active admin via auth.uid()
--   2. Checks specific permission via admin_has_permission()
--   3. Performs the operation
--   4. Writes audit log
--   5. Returns result
--
-- NO direct writes from the client are possible — RLS blocks them.
-- All writes go through these RPCs which enforce permissions in the DB.
-- ============================================================================


-- ─── 1. CREATE ADMIN USER ───
-- Required permission: admin_users.create
-- Creates auth.users entry + admin_users row.
-- NOTE: auth.users creation requires service_role internally,
-- which is available to SECURITY DEFINER functions owned by postgres.

CREATE OR REPLACE FUNCTION public.admin_manage_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name_ar TEXT,
  p_full_name_en TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_new_auth_uid UUID;
  v_new_admin_id UUID;
  v_target_role_id UUID;
BEGIN
  -- Verify caller is active admin
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  -- Check permission
  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.create') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.create';
  END IF;

  -- Validate email
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Check email not already used
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE email = lower(trim(p_email)) AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email already exists in admin_users';
  END IF;

  -- Resolve role_id: use provided or default to readonly_admin
  IF p_role_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND is_active = true) THEN
      RAISE EXCEPTION 'Invalid role_id';
    END IF;
    v_target_role_id := p_role_id;
  ELSE
    SELECT id INTO v_target_role_id FROM public.admin_roles WHERE name = 'readonly_admin';
  END IF;

  -- Prevent creating super_admin via RPC (must be done via seed)
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE id = v_target_role_id AND name = 'super_admin') THEN
    RAISE EXCEPTION 'Cannot assign super_admin role via this function';
  END IF;

  -- Create auth user via Supabase internal API
  -- This works because SECURITY DEFINER runs as the function owner (postgres)
  v_new_auth_uid := extensions.uuid_generate_v4();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) VALUES (
    v_new_auth_uid,
    '00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 12)),
    now(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    jsonb_build_object('full_name', p_full_name_ar),
    'authenticated',
    'authenticated',
    now(),
    now()
  );

  -- Also insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_new_auth_uid,
    v_new_auth_uid,
    jsonb_build_object('sub', v_new_auth_uid::TEXT, 'email', lower(trim(p_email))),
    'email',
    lower(trim(p_email)),
    now(),
    now(),
    now()
  );

  -- Create admin_users row
  INSERT INTO public.admin_users (
    auth_uid, email, full_name_ar, full_name_en, phone,
    role_id, status, is_super_admin, force_password_reset, created_by
  ) VALUES (
    v_new_auth_uid,
    lower(trim(p_email)),
    p_full_name_ar,
    p_full_name_en,
    p_phone,
    v_target_role_id,
    p_status,
    false,
    true,
    v_caller_id
  ) RETURNING id INTO v_new_admin_id;

  -- Audit log
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'admin_user.create', 'admin_users',
    'admin_user', v_new_admin_id,
    jsonb_build_object('email', lower(trim(p_email)), 'role_id', v_target_role_id),
    'warning'
  );

  RETURN jsonb_build_object('id', v_new_admin_id, 'auth_uid', v_new_auth_uid, 'email', lower(trim(p_email)));
END;
$$;


-- ─── 2. UPDATE ADMIN USER ───
-- Required permission: admin_users.update
-- Cannot change email, auth_uid, is_super_admin.

CREATE OR REPLACE FUNCTION public.admin_manage_update_user(
  p_target_id UUID,
  p_full_name_ar TEXT DEFAULT NULL,
  p_full_name_en TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_target admin_users%ROWTYPE;
BEGIN
  -- Verify caller
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.update') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.update';
  END IF;

  -- Get target
  SELECT * INTO v_target FROM public.admin_users WHERE id = p_target_id AND deleted_at IS NULL;
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Cannot modify super_admin unless caller is also super_admin
  IF v_target.is_super_admin AND NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = v_caller_id AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Cannot modify super_admin';
  END IF;

  -- Validate role_id if provided
  IF p_role_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND is_active = true) THEN
      RAISE EXCEPTION 'Invalid role_id';
    END IF;
    -- Cannot assign super_admin role
    IF EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND name = 'super_admin') THEN
      RAISE EXCEPTION 'Cannot assign super_admin role via this function';
    END IF;
  END IF;

  -- Update
  UPDATE public.admin_users SET
    full_name_ar = COALESCE(p_full_name_ar, full_name_ar),
    full_name_en = COALESCE(p_full_name_en, full_name_en),
    phone = COALESCE(p_phone, phone),
    role_id = COALESCE(p_role_id, role_id)
  WHERE id = p_target_id;

  -- Audit
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'admin_user.update', 'admin_users',
    'admin_user', p_target_id,
    jsonb_build_object(
      'full_name_ar', p_full_name_ar, 'full_name_en', p_full_name_en,
      'phone', p_phone, 'role_id', p_role_id
    ),
    'info'
  );
END;
$$;


-- ─── 3. DEACTIVATE ADMIN USER ───
-- Required permission: admin_users.deactivate

CREATE OR REPLACE FUNCTION public.admin_manage_deactivate_user(p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_target admin_users%ROWTYPE;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.deactivate') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.deactivate';
  END IF;

  SELECT * INTO v_target FROM public.admin_users WHERE id = p_target_id AND deleted_at IS NULL;
  IF v_target IS NULL THEN RAISE EXCEPTION 'Admin user not found'; END IF;

  -- Cannot deactivate self
  IF v_caller_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot deactivate yourself';
  END IF;

  -- Cannot deactivate super_admin unless caller is super_admin
  IF v_target.is_super_admin AND NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = v_caller_id AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Cannot deactivate super_admin';
  END IF;

  UPDATE public.admin_users SET status = 'inactive' WHERE id = p_target_id;

  -- Invalidate all sessions
  UPDATE public.admin_sessions SET is_active = false WHERE admin_user_id = p_target_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'admin_user.deactivate', 'admin_users',
    'admin_user', p_target_id, 'warning'
  );
END;
$$;


-- ─── 4. ACTIVATE ADMIN USER ───
-- Required permission: admin_users.update (reusing update permission)

CREATE OR REPLACE FUNCTION public.admin_manage_activate_user(p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.update') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.update';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = p_target_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  UPDATE public.admin_users SET status = 'active', locked_until = NULL, failed_login_attempts = 0
  WHERE id = p_target_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'admin_user.activate', 'admin_users',
    'admin_user', p_target_id, 'info'
  );
END;
$$;


-- ─── 5. SOFT DELETE ADMIN USER ───
-- Required permission: admin_users.delete

CREATE OR REPLACE FUNCTION public.admin_manage_soft_delete_user(p_target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_target admin_users%ROWTYPE;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.delete') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.delete';
  END IF;

  SELECT * INTO v_target FROM public.admin_users WHERE id = p_target_id AND deleted_at IS NULL;
  IF v_target IS NULL THEN RAISE EXCEPTION 'Admin user not found'; END IF;

  IF v_caller_id = p_target_id THEN RAISE EXCEPTION 'Cannot delete yourself'; END IF;

  IF v_target.is_super_admin THEN RAISE EXCEPTION 'Cannot delete super_admin'; END IF;

  UPDATE public.admin_users SET deleted_at = now(), status = 'inactive' WHERE id = p_target_id;
  UPDATE public.admin_sessions SET is_active = false WHERE admin_user_id = p_target_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'admin_user.soft_delete', 'admin_users',
    'admin_user', p_target_id,
    jsonb_build_object('deleted_email', v_target.email),
    'critical'
  );
END;
$$;


-- ─── 6. GET ROLE WITH PERMISSIONS ───
-- Returns role + its permissions as JSONB. Read-only, for roles page.

CREATE OR REPLACE FUNCTION public.admin_get_role_permissions(p_role_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'roles.view') THEN
    RAISE EXCEPTION 'Permission denied: roles.view';
  END IF;

  SELECT jsonb_build_object(
    'role', row_to_json(r),
    'permissions', COALESCE(
      (SELECT jsonb_agg(row_to_json(ap))
       FROM public.admin_role_permissions arp
       JOIN public.admin_permissions ap ON ap.id = arp.permission_id
       WHERE arp.role_id = p_role_id),
      '[]'::JSONB
    )
  ) INTO v_result
  FROM public.admin_roles r
  WHERE r.id = p_role_id;

  RETURN v_result;
END;
$$;


-- ═══════════════════════════════════════════════════
-- REVOKE/GRANT for new functions
-- ═══════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.admin_manage_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_manage_update_user(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_manage_deactivate_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_manage_activate_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_manage_soft_delete_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_role_permissions(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_manage_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_update_user(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_deactivate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_activate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_manage_soft_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_role_permissions(UUID) TO authenticated;
