-- ============================================================================
-- SADEEM — RBAC Helper: check_is_admin
-- Lightweight RPC for subscriber guards to check if user is admin.
-- Returns true if auth.uid() has an active admin_users row.
-- This prevents admins from accidentally using subscriber dashboard.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_uid = auth.uid()
      AND status = 'active'
      AND deleted_at IS NULL
  );
$$;

-- Callable by any authenticated user (lightweight check)
REVOKE EXECUTE ON FUNCTION public.check_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
