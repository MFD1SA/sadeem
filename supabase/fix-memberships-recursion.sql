-- ============================================================================
-- Fix Infinite Recursion in memberships RLS policies
--
-- Root cause chain:
--   INSERT INTO memberships
--   → policy "Owners can manage memberships" (FOR ALL)
--   → subquery: SELECT id FROM organizations WHERE owner_user_id = auth.uid()
--   → organizations RLS fires: "Org members can read their org"
--   → subquery: SELECT organization_id FROM memberships WHERE user_id = auth.uid()
--   → memberships RLS fires again → INFINITE RECURSION
--
-- Fix: SECURITY DEFINER helper function that checks org ownership
-- WITHOUT triggering RLS on the organizations table.
-- ============================================================================

-- 1. Create helper function: checks if auth.uid() owns the given org
--    SECURITY DEFINER bypasses RLS, breaking the recursion chain.
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND owner_user_id = auth.uid()
  );
$$;

-- 2. Drop the recursive FOR ALL policy on memberships
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.memberships;

-- 3. Drop any leftover policies we're replacing
DROP POLICY IF EXISTS "Members can read own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Owner can insert membership" ON public.memberships;
DROP POLICY IF EXISTS "Owner can update membership" ON public.memberships;
DROP POLICY IF EXISTS "Owner can delete membership" ON public.memberships;
DROP POLICY IF EXISTS "Authenticated users can create membership" ON public.memberships;

-- 4. Recreate as separate per-command policies using the helper function

-- SELECT: members can read their own rows (direct uid check, no recursion)
CREATE POLICY "Members can read own memberships"
  ON public.memberships FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: org owner can add members (uses SECURITY DEFINER to avoid recursion)
CREATE POLICY "Owner can insert membership"
  ON public.memberships FOR INSERT
  WITH CHECK (is_org_owner(organization_id));

-- UPDATE: only org owner can update memberships (change roles, deactivate)
CREATE POLICY "Owner can update membership"
  ON public.memberships FOR UPDATE
  USING (is_org_owner(organization_id));

-- DELETE: only org owner can delete memberships
CREATE POLICY "Owner can delete membership"
  ON public.memberships FOR DELETE
  USING (is_org_owner(organization_id));

-- 5. Grant execute to authenticated users only
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid) TO authenticated;

-- ============================================================================
-- Verification query (run after applying):
-- ============================================================================
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'memberships'
-- ORDER BY policyname;
--
-- Expected result:
--   Members can read own memberships  | SELECT
--   Owner can insert membership       | INSERT
--   Owner can update membership       | UPDATE
--   Owner can delete membership       | DELETE
-- ============================================================================
