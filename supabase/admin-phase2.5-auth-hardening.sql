-- ============================================================================
-- SADEEM Admin — Phase 2.5: Auth User Creation Hardening
-- Run AFTER admin-phase2-user-management.sql
--
-- What this does:
-- 1. Drops admin_manage_create_user (writes to auth.users directly — unsafe)
-- 2. Creates admin_verify_create_permission() — permission check only
-- 3. Creates admin_insert_admin_user() — inserts into admin_users only
--    (auth.users creation is handled by Edge Function via service_role API)
-- 4. Updates REVOKE/GRANT
-- ============================================================================


-- ─── Drop the unsafe create function ───
DROP FUNCTION IF EXISTS public.admin_manage_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT);


-- ─── 1. Permission verification RPC ───
-- Called by Edge Function with caller's JWT.
-- Returns TRUE if caller has permission and email/role are valid.
-- Does NOT create anything — pure check.

CREATE OR REPLACE FUNCTION public.admin_verify_create_permission(
  p_email TEXT,
  p_role_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_target_role_id UUID;
BEGIN
  -- Verify caller is active admin
  SELECT id INTO v_caller_id
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  -- Check permission
  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.create') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.create';
  END IF;

  -- Validate email not empty
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Check email not already used
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE email = lower(trim(p_email)) AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email already exists in admin_users';
  END IF;

  -- Validate role_id if provided
  IF p_role_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND is_active = true) THEN
      RAISE EXCEPTION 'Invalid role_id';
    END IF;
    -- Cannot assign super_admin
    IF EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND name = 'super_admin') THEN
      RAISE EXCEPTION 'Cannot assign super_admin role';
    END IF;
  END IF;

  RETURN true;
END;
$$;


-- ─── 2. Insert admin_users row RPC ───
-- Called by Edge Function AFTER auth user is created.
-- Receives auth_uid from the Edge Function (which got it from auth.admin.createUser).
-- Caller's JWT is used for audit logging.

CREATE OR REPLACE FUNCTION public.admin_insert_admin_user(
  p_auth_uid UUID,
  p_email TEXT,
  p_full_name_ar TEXT,
  p_full_name_en TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_role_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_new_admin_id UUID;
  v_target_role_id UUID;
BEGIN
  -- Verify caller is active admin with create permission
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'admin_users.create') THEN
    RAISE EXCEPTION 'Permission denied: admin_users.create';
  END IF;

  -- Resolve role
  IF p_role_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND is_active = true) THEN
      RAISE EXCEPTION 'Invalid role_id';
    END IF;
    IF EXISTS (SELECT 1 FROM public.admin_roles WHERE id = p_role_id AND name = 'super_admin') THEN
      RAISE EXCEPTION 'Cannot assign super_admin role';
    END IF;
    v_target_role_id := p_role_id;
  ELSE
    SELECT id INTO v_target_role_id FROM public.admin_roles WHERE name = 'readonly_admin';
  END IF;

  -- Double-check email uniqueness
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE email = lower(trim(p_email)) AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Email already exists in admin_users';
  END IF;

  -- Double-check auth_uid uniqueness
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE auth_uid = p_auth_uid AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'auth_uid already linked to another admin';
  END IF;

  -- Insert admin_users row
  INSERT INTO public.admin_users (
    auth_uid, email, full_name_ar, full_name_en, phone,
    role_id, status, is_super_admin, force_password_reset, created_by
  ) VALUES (
    p_auth_uid,
    lower(trim(p_email)),
    p_full_name_ar,
    p_full_name_en,
    p_phone,
    v_target_role_id,
    'active',
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
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'role_id', v_target_role_id,
      'auth_uid', p_auth_uid
    ),
    'warning'
  );

  RETURN jsonb_build_object(
    'id', v_new_admin_id,
    'auth_uid', p_auth_uid,
    'email', lower(trim(p_email))
  );
END;
$$;


-- ═══════════════════════════════════════════════════
-- REVOKE/GRANT
-- ═══════════════════════════════════════════════════

-- Revoke old create function grant (may error if already dropped, that's fine)
-- DO $$ BEGIN
--   REVOKE EXECUTE ON FUNCTION public.admin_manage_create_user(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) FROM authenticated;
-- EXCEPTION WHEN undefined_function THEN NULL;
-- END $$;

-- New functions
REVOKE EXECUTE ON FUNCTION public.admin_verify_create_permission(TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_insert_admin_user(UUID, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;

-- Both callable from authenticated (Edge Function passes caller's JWT)
GRANT EXECUTE ON FUNCTION public.admin_verify_create_permission(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_insert_admin_user(UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
