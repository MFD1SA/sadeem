-- ============================================================================
-- SADEEM Admin — Phase 7: Payment Gateway Foundation
-- Run AFTER admin-phase6-ai-usage.sql
--
-- Creates:
-- 1. Gateway columns on subscriptions, admin_invoices, admin_payments
-- 2. payment_events table (raw webhook log)
-- 3. RPCs for checkout creation, webhook processing, admin monitoring
-- ============================================================================


-- ═══════════════════════════════════════════════════
-- STEP 1: Gateway columns on existing tables
-- ═══════════════════════════════════════════════════

-- Subscriptions: link to gateway subscription
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT CHECK (gateway_provider IN ('stripe', 'moyasar', 'manual')),
  ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_type TEXT;

CREATE INDEX IF NOT EXISTS idx_subs_gateway_customer ON public.subscriptions(gateway_customer_id);
CREATE INDEX IF NOT EXISTS idx_subs_gateway_sub ON public.subscriptions(gateway_subscription_id);

-- Invoices: link to gateway invoice
ALTER TABLE public.admin_invoices
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT,
  ADD COLUMN IF NOT EXISTS gateway_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_inv_gateway ON public.admin_invoices(gateway_invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_checkout ON public.admin_invoices(checkout_session_id);

-- Payments: link to gateway payment
ALTER TABLE public.admin_payments
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_pay_gateway ON public.admin_payments(gateway_payment_id);


-- ═══════════════════════════════════════════════════
-- STEP 2: Payment Events table (raw webhook log)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  invoice_id UUID REFERENCES public.admin_invoices(id),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pe_provider ON public.payment_events(gateway_provider);
CREATE INDEX IF NOT EXISTS idx_pe_event_type ON public.payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pe_event_id ON public.payment_events(event_id);
CREATE INDEX IF NOT EXISTS idx_pe_created ON public.payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pe_status ON public.payment_events(status);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read, service_role writes (from webhooks)
CREATE POLICY "payment_events_admin_select" ON public.payment_events
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "payment_events_service" ON public.payment_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- STEP 3: Webhook processing RPC
-- Called by webhook Edge Function with service_role.
-- ═══════════════════════════════════════════════════

-- Process a payment success event
CREATE OR REPLACE FUNCTION public.gateway_process_payment_success(
  p_gateway_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_org_id UUID,
  p_gateway_customer_id TEXT DEFAULT NULL,
  p_gateway_subscription_id TEXT DEFAULT NULL,
  p_gateway_payment_id TEXT DEFAULT NULL,
  p_gateway_invoice_id TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT 'SAR',
  p_payment_method TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_sub_id UUID;
  v_inv_id UUID;
BEGIN
  -- Log the event
  INSERT INTO public.payment_events (
    gateway_provider, event_type, event_id,
    organization_id, payload, status
  ) VALUES (
    p_gateway_provider, p_event_type, p_event_id,
    p_org_id, p_payload, 'received'
  ) RETURNING id INTO v_event_id;

  -- Idempotency: skip if already processed
  IF EXISTS (
    SELECT 1 FROM public.payment_events
    WHERE event_id = p_event_id AND status = 'processed' AND id != v_event_id
  ) THEN
    UPDATE public.payment_events SET status = 'ignored', processed_at = now()
    WHERE id = v_event_id;
    RETURN v_event_id;
  END IF;

  -- Update subscription
  SELECT id INTO v_sub_id FROM public.subscriptions
  WHERE organization_id = p_org_id ORDER BY created_at DESC LIMIT 1;

  IF v_sub_id IS NOT NULL THEN
    UPDATE public.subscriptions SET
      status = 'active',
      plan = COALESCE(p_plan, plan),
      gateway_provider = p_gateway_provider,
      gateway_customer_id = COALESCE(p_gateway_customer_id, gateway_customer_id),
      gateway_subscription_id = COALESCE(p_gateway_subscription_id, gateway_subscription_id),
      payment_method_type = COALESCE(p_payment_method, payment_method_type),
      starts_at = COALESCE(p_period_start, starts_at),
      ends_at = COALESCE(p_period_end, ends_at),
      updated_at = now()
    WHERE id = v_sub_id;
  END IF;

  -- Create invoice if amount provided
  IF p_amount IS NOT NULL AND p_amount > 0 THEN
    INSERT INTO public.admin_invoices (
      invoice_number, organization_id, subscription_id, plan,
      subtotal, tax_rate, tax_amount, total, currency,
      status, paid_at, gateway_provider, gateway_invoice_id,
      gateway_payment_intent_id,
      billing_period_start, billing_period_end
    ) VALUES (
      public.generate_invoice_number(),
      p_org_id, v_sub_id, COALESCE(p_plan, 'starter'),
      ROUND(p_amount / 1.15, 2), 15.00,
      ROUND(p_amount - (p_amount / 1.15), 2), p_amount, p_currency,
      'paid', now(), p_gateway_provider, p_gateway_invoice_id,
      p_gateway_payment_id,
      p_period_start, p_period_end
    ) RETURNING id INTO v_inv_id;

    -- Create payment record
    INSERT INTO public.admin_payments (
      invoice_id, organization_id, amount, currency,
      method, status, gateway_provider, gateway_payment_id
    ) VALUES (
      v_inv_id, p_org_id, p_amount, p_currency,
      COALESCE(p_payment_method, 'credit_card'), 'completed',
      p_gateway_provider, p_gateway_payment_id
    );
  END IF;

  -- Mark event as processed
  UPDATE public.payment_events SET
    status = 'processed',
    subscription_id = v_sub_id,
    invoice_id = v_inv_id,
    processed_at = now()
  WHERE id = v_event_id;

  -- Audit
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    NULL, 'system@gateway',
    'payment.success', 'finance',
    'organization', p_org_id,
    jsonb_build_object(
      'event_id', p_event_id, 'amount', p_amount,
      'provider', p_gateway_provider, 'plan', p_plan
    ),
    'info'
  );

  RETURN v_event_id;
END;
$$;

-- Process payment failure
CREATE OR REPLACE FUNCTION public.gateway_process_payment_failure(
  p_gateway_provider TEXT,
  p_event_id TEXT,
  p_event_type TEXT,
  p_org_id UUID,
  p_failure_reason TEXT DEFAULT NULL,
  p_gateway_payment_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.payment_events (
    gateway_provider, event_type, event_id,
    organization_id, payload, status
  ) VALUES (
    p_gateway_provider, p_event_type, p_event_id,
    p_org_id, p_payload, 'received'
  ) RETURNING id INTO v_event_id;

  -- Mark subscription as past_due or keep current
  UPDATE public.subscriptions SET updated_at = now()
  WHERE organization_id = p_org_id AND status = 'active';

  UPDATE public.payment_events SET
    status = 'processed', processed_at = now()
  WHERE id = v_event_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    NULL, 'system@gateway',
    'payment.failed', 'finance',
    'organization', p_org_id,
    jsonb_build_object(
      'event_id', p_event_id, 'reason', p_failure_reason,
      'provider', p_gateway_provider
    ),
    'critical'
  );

  RETURN v_event_id;
END;
$$;

-- Process subscription cancellation
CREATE OR REPLACE FUNCTION public.gateway_process_subscription_cancelled(
  p_gateway_provider TEXT,
  p_event_id TEXT,
  p_org_id UUID,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.payment_events (
    gateway_provider, event_type, event_id,
    organization_id, payload, status
  ) VALUES (
    p_gateway_provider, 'subscription.cancelled', p_event_id,
    p_org_id, p_payload, 'received'
  ) RETURNING id INTO v_event_id;

  UPDATE public.subscriptions SET status = 'cancelled', updated_at = now()
  WHERE organization_id = p_org_id AND status IN ('active', 'trial');

  UPDATE public.payment_events SET status = 'processed', processed_at = now()
  WHERE id = v_event_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    NULL, 'system@gateway',
    'subscription.cancelled', 'finance',
    'organization', p_org_id,
    jsonb_build_object('event_id', p_event_id, 'provider', p_gateway_provider),
    'critical'
  );

  RETURN v_event_id;
END;
$$;


-- ─── Admin: list payment events ───
CREATE OR REPLACE FUNCTION public.admin_list_payment_events(
  p_status TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_result JSONB;
  v_total BIGINT;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'finance.view') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT count(*) INTO v_total FROM public.payment_events pe
  WHERE (p_status IS NULL OR pe.status = p_status)
    AND (p_provider IS NULL OR pe.gateway_provider = p_provider);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', pe.id,
      'gateway_provider', pe.gateway_provider,
      'event_type', pe.event_type,
      'event_id', pe.event_id,
      'org_name', o.name,
      'organization_id', pe.organization_id,
      'status', pe.status,
      'error_message', pe.error_message,
      'processed_at', pe.processed_at,
      'created_at', pe.created_at
    ) AS row_data
    FROM public.payment_events pe
    LEFT JOIN public.organizations o ON o.id = pe.organization_id
    WHERE (p_status IS NULL OR pe.status = p_status)
      AND (p_provider IS NULL OR pe.gateway_provider = p_provider)
    ORDER BY pe.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;

-- Admin: gateway overview stats
CREATE OR REPLACE FUNCTION public.admin_get_gateway_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'finance.view') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN jsonb_build_object(
    'total_events', (SELECT count(*) FROM public.payment_events),
    'events_today', (SELECT count(*) FROM public.payment_events WHERE created_at >= date_trunc('day', now())),
    'processed', (SELECT count(*) FROM public.payment_events WHERE status = 'processed'),
    'failed', (SELECT count(*) FROM public.payment_events WHERE status = 'failed'),
    'ignored', (SELECT count(*) FROM public.payment_events WHERE status = 'ignored'),
    'gateway_revenue', (
      SELECT COALESCE(jsonb_object_agg(gp, rev), '{}'::JSONB) FROM (
        SELECT p.gateway_provider AS gp, sum(p.amount) AS rev
        FROM public.admin_payments p
        WHERE p.status = 'completed' AND p.gateway_provider IS NOT NULL
        GROUP BY p.gateway_provider
      ) gr
    ),
    'active_gateway_subs', (
      SELECT count(*) FROM public.subscriptions
      WHERE gateway_subscription_id IS NOT NULL AND status = 'active'
    ),
    'by_event_type', (
      SELECT COALESCE(jsonb_object_agg(event_type, cnt), '{}'::JSONB) FROM (
        SELECT event_type, count(*) as cnt FROM public.payment_events GROUP BY event_type
      ) et
    )
  );
END;
$$;


-- ═══════════════════════════════════════════════════
-- STEP 4: REVOKE/GRANT
-- ═══════════════════════════════════════════════════

-- Gateway processing RPCs: service_role ONLY (called from webhook Edge Functions)
REVOKE EXECUTE ON FUNCTION public.gateway_process_payment_success(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gateway_process_payment_failure(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gateway_process_subscription_cancelled(TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.gateway_process_payment_success(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.gateway_process_payment_failure(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.gateway_process_subscription_cancelled(TEXT, TEXT, UUID, JSONB) TO service_role;

-- Admin monitoring RPCs: authenticated (permission checked inside)
REVOKE EXECUTE ON FUNCTION public.admin_list_payment_events(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_gateway_overview() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_payment_events(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_gateway_overview() TO authenticated;
