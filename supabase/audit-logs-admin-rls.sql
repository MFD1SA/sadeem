-- ============================================================================
-- SADEEM: Allow admin users to read subscriber audit_logs
-- Applied: 2026-04-03
-- Purpose: AdminAuditLogs page needs to read from audit_logs (subscriber ops)
--          in addition to admin_audit_logs (admin ops)
-- ============================================================================

CREATE POLICY audit_logs_admin_select
  ON public.audit_logs
  FOR SELECT
  USING (is_active_admin());
