-- ============================================================================
-- FIX: Allow subscribers to read their own organization's tickets
-- Without this policy, RLS blocks all SELECT for non-admin users,
-- so subscribers see zero tickets even after creating them.
-- ============================================================================

CREATE POLICY "tickets_subscriber_select" ON public.support_tickets
  FOR SELECT TO authenticated USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
