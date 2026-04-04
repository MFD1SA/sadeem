-- ============================================================================
-- SENDA Admin — Phase 3: Role & Permission Management RPCs
-- Run AFTER admin-phase2.5-auth-hardening.sql
--
-- RPCs:
-- 1. admin_assign_role          — change a user's role (roles.assign)
-- 2. admin_update_role_perms    — update permissions for a role (roles.update)
-- 3. admin_list_all_permissions — list all permissions grouped (roles.view)
--
-- Super Admin protections:
-- - super_admin role cannot be assigned/removed via RPCs
-- - super_admin role permissions cannot be modified
-- - Only super_admin can modify system roles
-- ============================================================================


-- ─── 1. ASSIGN ROLE TO ADMIN USER ───
-- Required permission: roles.assign
-- Cannot assign super_admin. Cannot change super_admin's role.

CREATE OR REPLACE FUNCTION public.admin_assign_role(
  p_target_user_id UUID,
  p_new_role_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_caller_is_super BOOLEAN;
  v_target admin_users%ROWTYPE;
  v_old_role_name TEXT;
  v_new_role_name TEXT;
BEGIN
  -- Verify caller
  SELECT id, email, is_super_admin INTO v_caller_id, v_caller_email, v_caller_is_super
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'roles.assign') THEN
    RAISE EXCEPTION 'Permission denied: roles.assign';
  END IF;

  -- Get target user
  SELECT * INTO v_target FROM public.admin_users
  WHERE id = p_target_user_id AND deleted_at IS NULL;

  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Admin user not found';
  END IF;

  -- Cannot change own role
  IF v_caller_id = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Cannot change super_admin's role
  IF v_target.is_super_admin THEN
    RAISE EXCEPTION 'Cannot change super_admin role assignment';
  END IF;

  -- Validate new role exists and is active
  SELECT name INTO v_new_role_name FROM public.admin_roles
  WHERE id = p_new_role_id AND is_active = true;

  IF v_new_role_name IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive role';
  END IF;

  -- Cannot assign super_admin role
  IF v_new_role_name = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super_admin role via this function';
  END IF;

  -- Get old role name for audit
  SELECT name INTO v_old_role_name FROM public.admin_roles WHERE id = v_target.role_id;

  -- Perform assignment
  UPDATE public.admin_users SET role_id = p_new_role_id
  WHERE id = p_target_user_id;

  -- Audit
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'role.assign', 'roles',
    'admin_user', p_target_user_id,
    jsonb_build_object(
      'old_role', v_old_role_name,
      'new_role', v_new_role_name,
      'target_email', v_target.email
    ),
    'warning'
  );
END;
$$;


-- ─── 2. UPDATE ROLE PERMISSIONS ───
-- Required permission: roles.update
-- Cannot modify super_admin role's permissions.
-- Only super_admin can modify system roles.
-- Accepts array of permission IDs to SET (replaces existing).

CREATE OR REPLACE FUNCTION public.admin_update_role_perms(
  p_role_id UUID,
  p_permission_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_caller_is_super BOOLEAN;
  v_role admin_roles%ROWTYPE;
  v_old_count INTEGER;
  v_new_count INTEGER;
  v_pid UUID;
BEGIN
  -- Verify caller
  SELECT id, email, is_super_admin INTO v_caller_id, v_caller_email, v_caller_is_super
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'roles.update') THEN
    RAISE EXCEPTION 'Permission denied: roles.update';
  END IF;

  -- Get role
  SELECT * INTO v_role FROM public.admin_roles WHERE id = p_role_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Role not found';
  END IF;

  -- Cannot modify super_admin permissions
  IF v_role.name = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot modify super_admin permissions';
  END IF;

  -- Only super_admin can modify system roles
  IF v_role.is_system AND NOT v_caller_is_super THEN
    RAISE EXCEPTION 'Only super_admin can modify system role permissions';
  END IF;

  -- Validate all permission IDs exist
  FOREACH v_pid IN ARRAY p_permission_ids
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.admin_permissions WHERE id = v_pid) THEN
      RAISE EXCEPTION 'Invalid permission ID: %', v_pid;
    END IF;
  END LOOP;

  -- Get old count for audit
  SELECT count(*) INTO v_old_count FROM public.admin_role_permissions WHERE role_id = p_role_id;

  -- Delete existing permissions for this role
  DELETE FROM public.admin_role_permissions WHERE role_id = p_role_id;

  -- Insert new permissions
  IF array_length(p_permission_ids, 1) > 0 THEN
    INSERT INTO public.admin_role_permissions (role_id, permission_id)
    SELECT p_role_id, unnest(p_permission_ids)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;

  SELECT count(*) INTO v_new_count FROM public.admin_role_permissions WHERE role_id = p_role_id;

  -- Audit
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'role.update_permissions', 'roles',
    'role', p_role_id,
    jsonb_build_object(
      'role_name', v_role.name,
      'old_permission_count', v_old_count,
      'new_permission_count', v_new_count,
      'permission_ids', p_permission_ids
    ),
    'critical'
  );

  RETURN jsonb_build_object(
    'role_id', p_role_id,
    'old_count', v_old_count,
    'new_count', v_new_count
  );
END;
$$;


-- ─── 3. LIST ALL PERMISSIONS (grouped) ───
-- Required permission: roles.view
-- Returns all permissions as JSONB array.

CREATE OR REPLACE FUNCTION public.admin_list_all_permissions()
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

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'roles.view') THEN
    RAISE EXCEPTION 'Permission denied: roles.view';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'key', key,
      'module', module,
      'action', action,
      'display_name_ar', display_name_ar,
      'display_name_en', display_name_en
    ) ORDER BY module, action
  ), '[]'::JSONB) INTO v_result
  FROM public.admin_permissions;

  RETURN v_result;
END;
$$;


-- ═══════════════════════════════════════════════════
-- REVOKE/GRANT
-- ═══════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.admin_assign_role(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_role_perms(UUID, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_all_permissions() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_assign_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_role_perms(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_all_permissions() TO authenticated;
