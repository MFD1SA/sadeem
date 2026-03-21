-- ============================================================================
-- SADEEM Admin — Phase 8: Settings Persistence + Tickets
-- Run AFTER admin-phase7-payment-gateway.sql
-- ============================================================================

-- ─── 1. System Settings (key-value store) ───
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_by UUID REFERENCES public.admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_admin_select" ON public.system_settings
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "system_settings_service" ON public.system_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── RPC: Get setting ───
CREATE OR REPLACE FUNCTION public.admin_get_setting(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_caller_id UUID;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  RETURN (SELECT value FROM public.system_settings WHERE key = p_key);
END;
$$;

-- ─── RPC: Set setting ───
CREATE OR REPLACE FUNCTION public.admin_set_setting(p_key TEXT, p_value JSONB)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller_id UUID; v_caller_email TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'settings.update') THEN
    RAISE EXCEPTION 'Permission denied: settings.update';
  END IF;

  INSERT INTO public.system_settings (key, value, updated_by, updated_at)
  VALUES (p_key, p_value, v_caller_id, now())
  ON CONFLICT (key) DO UPDATE SET value = p_value, updated_by = v_caller_id, updated_at = now();

  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, details, severity)
  VALUES (v_caller_id, v_caller_email, 'settings.update', 'settings',
    jsonb_build_object('key', p_key), 'info');
END;
$$;

-- ─── RPC: Get all settings ───
CREATE OR REPLACE FUNCTION public.admin_get_all_settings()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_caller_id UUID;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  RETURN (SELECT COALESCE(jsonb_object_agg(key, value), '{}'::JSONB) FROM public.system_settings);
END;
$$;

-- ─── 2. Support Tickets ───
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  submitted_by_email TEXT,
  submitted_by_name TEXT,
  assigned_to UUID REFERENCES public.admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON public.support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.support_tickets(created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_admin_select" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "tickets_service" ON public.support_tickets
  FOR ALL TO service_role USING (true) WITH CHECK (true);
-- Subscribers can insert tickets for their own org
CREATE POLICY "tickets_subscriber_insert" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid() AND status = 'active')
  );

-- ─── RPC: List tickets (admin) ───
CREATE OR REPLACE FUNCTION public.admin_list_tickets(
  p_status TEXT DEFAULT NULL, p_priority TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_caller_id UUID; v_result JSONB; v_total BIGINT;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'support.view') THEN
    RAISE EXCEPTION 'Permission denied'; END IF;

  SELECT count(*) INTO v_total FROM public.support_tickets t
  WHERE (p_status IS NULL OR t.status = p_status)
    AND (p_priority IS NULL OR t.priority = p_priority);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::JSONB)
  INTO v_result FROM (
    SELECT jsonb_build_object(
      'id', t.id, 'subject', t.subject, 'status', t.status,
      'priority', t.priority, 'submitted_by_name', t.submitted_by_name,
      'submitted_by_email', t.submitted_by_email,
      'org_name', o.name, 'organization_id', t.organization_id,
      'created_at', t.created_at, 'updated_at', t.updated_at
    ) AS row_data
    FROM public.support_tickets t
    LEFT JOIN public.organizations o ON o.id = t.organization_id
    WHERE (p_status IS NULL OR t.status = p_status)
      AND (p_priority IS NULL OR t.priority = p_priority)
    ORDER BY t.created_at DESC LIMIT p_limit OFFSET p_offset
  ) sub;
  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;

-- ─── RPC: Update ticket status (admin) ───
CREATE OR REPLACE FUNCTION public.admin_update_ticket_status(p_ticket_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_caller_id UUID; v_caller_email TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'support.manage') THEN
    RAISE EXCEPTION 'Permission denied'; END IF;

  UPDATE public.support_tickets SET status = p_status, updated_at = now(),
    resolved_at = CASE WHEN p_status IN ('resolved','closed') THEN now() ELSE resolved_at END
  WHERE id = p_ticket_id;

  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, target_type, target_id, severity)
  VALUES (v_caller_id, v_caller_email, 'ticket.update_status', 'support', 'ticket', p_ticket_id, 'info');
END;
$$;

-- REVOKE/GRANT
REVOKE EXECUTE ON FUNCTION public.admin_get_setting(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_setting(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_all_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_tickets(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_ticket_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_setting(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_setting(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_tickets(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_ticket_status(UUID, TEXT) TO authenticated;
