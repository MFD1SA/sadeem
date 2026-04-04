-- ============================================================================
-- SENDA — Ticket Reply Threading & Auto-Close
--
-- 1. ticket_replies table for conversation threading
-- 2. RLS policies for subscriber + admin access
-- 3. RPC: subscriber_add_ticket_reply (subscriber writes a reply)
-- 4. RPC: admin_add_ticket_reply (admin writes a reply)
-- 5. RPC: admin_get_ticket_detail (ticket + all replies)
-- 6. Trigger: auto-close resolved tickets after 24 hours
-- ============================================================================

-- ─── 1. Table ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type     TEXT        NOT NULL CHECK (sender_type IN ('customer', 'support')),
  sender_name     TEXT        NOT NULL,
  sender_email    TEXT,
  body            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON public.ticket_replies(ticket_id, created_at);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- ─── 2. RLS Policies ───────────────────────────────────────────────────────

-- Admins can read all replies
CREATE POLICY "replies_admin_select" ON public.ticket_replies
  FOR SELECT TO authenticated USING (public.is_active_admin());

-- Subscribers can read replies for their own org's tickets
CREATE POLICY "replies_subscriber_select" ON public.ticket_replies
  FOR SELECT TO authenticated USING (
    ticket_id IN (
      SELECT t.id FROM public.support_tickets t
      WHERE t.organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Service role full access
CREATE POLICY "replies_service" ON public.ticket_replies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 3. Subscriber reply RPC ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.subscriber_add_ticket_reply(
  p_ticket_id UUID,
  p_body      TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id    UUID;
  v_user_email TEXT;
  v_user_name  TEXT;
  v_org_id     UUID;
  v_reply_id   UUID;
BEGIN
  -- Get caller identity
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Verify the ticket belongs to one of the caller's orgs
  SELECT t.organization_id INTO v_org_id
  FROM public.support_tickets t
  WHERE t.id = p_ticket_id
    AND t.organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = v_user_id AND status = 'active'
    );

  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Ticket not found or access denied'; END IF;

  -- Get user display info from auth.users
  SELECT
    COALESCE(raw_user_meta_data->>'full_name', email),
    email
  INTO v_user_name, v_user_email
  FROM auth.users WHERE id = v_user_id;

  -- Insert the reply
  INSERT INTO public.ticket_replies (ticket_id, sender_type, sender_name, sender_email, body)
  VALUES (p_ticket_id, 'customer', v_user_name, v_user_email, p_body)
  RETURNING id INTO v_reply_id;

  -- Re-open ticket if it was resolved/closed (customer replied = needs attention)
  UPDATE public.support_tickets
  SET status = 'open', updated_at = now()
  WHERE id = p_ticket_id AND status IN ('resolved', 'closed');

  RETURN v_reply_id;
END;
$$;

-- ─── 4. Admin reply RPC ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_add_ticket_reply(
  p_ticket_id UUID,
  p_body      TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_caller_id    UUID;
  v_caller_email TEXT;
  v_caller_name  TEXT;
  v_reply_id     UUID;
BEGIN
  -- Verify active admin with support.manage permission
  SELECT au.id, au.email, au.full_name_ar
  INTO v_caller_id, v_caller_email, v_caller_name
  FROM public.admin_users au
  WHERE au.auth_uid = auth.uid() AND au.status = 'active' AND au.deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'support.manage') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Insert the reply
  INSERT INTO public.ticket_replies (ticket_id, sender_type, sender_name, sender_email, body)
  VALUES (p_ticket_id, 'support', v_caller_name, v_caller_email, p_body)
  RETURNING id INTO v_reply_id;

  -- Move ticket to in_progress if it was open
  UPDATE public.support_tickets
  SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
      updated_at = now()
  WHERE id = p_ticket_id;

  -- Audit log
  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, target_type, target_id, severity)
  VALUES (v_caller_id, v_caller_email, 'ticket.reply', 'support', 'ticket', p_ticket_id, 'info');

  RETURN v_reply_id;
END;
$$;

-- ─── 5. Admin get ticket detail RPC ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_ticket_detail(p_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_caller_id UUID;
  v_ticket    JSONB;
  v_replies   JSONB;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'support.view') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT jsonb_build_object(
    'id', t.id, 'subject', t.subject, 'description', t.description,
    'status', t.status, 'priority', t.priority,
    'submitted_by_name', t.submitted_by_name, 'submitted_by_email', t.submitted_by_email,
    'org_name', o.name, 'organization_id', t.organization_id,
    'assigned_to', t.assigned_to, 'resolved_at', t.resolved_at,
    'created_at', t.created_at, 'updated_at', t.updated_at
  ) INTO v_ticket
  FROM public.support_tickets t
  LEFT JOIN public.organizations o ON o.id = t.organization_id
  WHERE t.id = p_ticket_id;

  IF v_ticket IS NULL THEN RAISE EXCEPTION 'Ticket not found'; END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', r.id, 'sender_type', r.sender_type,
      'sender_name', r.sender_name, 'body', r.body,
      'created_at', r.created_at
    ) ORDER BY r.created_at ASC
  ), '[]'::JSONB) INTO v_replies
  FROM public.ticket_replies r WHERE r.ticket_id = p_ticket_id;

  RETURN v_ticket || jsonb_build_object('replies', v_replies);
END;
$$;

-- ─── 6. Auto-close trigger ─────────────────────────────────────────────────
-- Resolved tickets auto-close after 24 hours.
-- This runs on every UPDATE to support_tickets. When a ticket is set to
-- 'resolved', resolved_at is set. A pg_cron job or application-level check
-- can periodically call the cleanup function below.

CREATE OR REPLACE FUNCTION public.auto_close_resolved_tickets()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.support_tickets
  SET status = 'closed', updated_at = now()
  WHERE status = 'resolved'
    AND resolved_at IS NOT NULL
    AND resolved_at < now() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─── Grants ─────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.subscriber_add_ticket_reply(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.subscriber_add_ticket_reply(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_add_ticket_reply(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_ticket_reply(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_ticket_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_ticket_detail(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.auto_close_resolved_tickets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_close_resolved_tickets() TO authenticated;
