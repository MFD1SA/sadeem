-- ============================================================================
-- SENDA Admin — Phase 5: Billing & Finance Layer
-- Run AFTER admin-phase4-operations.sql
--
-- Creates:
-- 1. admin_invoices table (linked to organizations + subscriptions)
-- 2. admin_payments table (linked to invoices)
-- 3. New permissions: invoices.view, invoices.create, invoices.update
-- 4. RPCs for billing operations
-- ============================================================================


-- ═══════════════════════════════════════════════════
-- STEP 1: New Tables
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admin_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  plan TEXT NOT NULL,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  notes TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.admin_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.admin_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.admin_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON public.admin_invoices(created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.admin_invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  method TEXT NOT NULL DEFAULT 'manual'
    CHECK (method IN ('manual', 'bank_transfer', 'credit_card', 'mada', 'stc_pay', 'other')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.admin_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.admin_payments(organization_id);

-- Updated_at trigger for invoices
DROP TRIGGER IF EXISTS trg_invoices_updated ON public.admin_invoices;
CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON public.admin_invoices
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- RLS
ALTER TABLE public.admin_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_invoices_select" ON public.admin_invoices
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "admin_invoices_service" ON public.admin_invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_payments_select" ON public.admin_payments
  FOR SELECT TO authenticated USING (public.is_active_admin());
CREATE POLICY "admin_payments_service" ON public.admin_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- STEP 2: New Permissions
-- ═══════════════════════════════════════════════════

INSERT INTO public.admin_permissions (key, module, action, display_name_ar, display_name_en) VALUES
  ('invoices.view',   'invoices', 'view',   'عرض الفواتير',    'View Invoices'),
  ('invoices.create', 'invoices', 'create', 'إنشاء فاتورة',   'Create Invoice'),
  ('invoices.update', 'invoices', 'update', 'تعديل فاتورة',   'Update Invoice')
ON CONFLICT (key) DO NOTHING;

-- Grant new permissions to finance_admin and super_admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'super_admin' AND p.key IN ('invoices.view', 'invoices.create', 'invoices.update')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'finance_admin' AND p.key IN ('invoices.view', 'invoices.create', 'invoices.update')
ON CONFLICT (role_id, permission_id) DO NOTHING;


-- ═══════════════════════════════════════════════════
-- STEP 3: Invoice number generator
-- ═══════════════════════════════════════════════════

CREATE SEQUENCE IF NOT EXISTS admin_invoice_seq START 1001;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('admin_invoice_seq')::TEXT, 5, '0');
$$;


-- ═══════════════════════════════════════════════════
-- STEP 4: RPCs
-- ═══════════════════════════════════════════════════

-- ─── Billing overview (MRR, ARR, status breakdown) ───
CREATE OR REPLACE FUNCTION public.admin_get_billing_overview()
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
  IF NOT public.admin_has_permission(v_caller_id, 'finance.view') THEN
    RAISE EXCEPTION 'Permission denied: finance.view';
  END IF;

  SELECT jsonb_build_object(
    'total_revenue', (SELECT COALESCE(sum(total), 0) FROM public.admin_invoices WHERE status = 'paid'),
    'revenue_this_month', (
      SELECT COALESCE(sum(total), 0) FROM public.admin_invoices
      WHERE status = 'paid' AND paid_at >= date_trunc('month', now())
    ),
    'outstanding', (SELECT COALESCE(sum(total), 0) FROM public.admin_invoices WHERE status IN ('sent', 'overdue')),
    'overdue_count', (SELECT count(*) FROM public.admin_invoices WHERE status = 'overdue'),
    'invoice_counts', jsonb_build_object(
      'draft', (SELECT count(*) FROM public.admin_invoices WHERE status = 'draft'),
      'sent', (SELECT count(*) FROM public.admin_invoices WHERE status = 'sent'),
      'paid', (SELECT count(*) FROM public.admin_invoices WHERE status = 'paid'),
      'overdue', (SELECT count(*) FROM public.admin_invoices WHERE status = 'overdue'),
      'cancelled', (SELECT count(*) FROM public.admin_invoices WHERE status = 'cancelled')
    ),
    'subscription_status', jsonb_build_object(
      'active', (SELECT count(*) FROM public.subscriptions WHERE status = 'active'),
      'trial', (SELECT count(*) FROM public.subscriptions WHERE status = 'trial'),
      'expired', (SELECT count(*) FROM public.subscriptions WHERE status = 'expired'),
      'cancelled', (SELECT count(*) FROM public.subscriptions WHERE status = 'cancelled')
    ),
    'plan_revenue', (
      SELECT COALESCE(jsonb_object_agg(plan, rev), '{}'::JSONB) FROM (
        SELECT i.plan, sum(i.total) as rev
        FROM public.admin_invoices i WHERE i.status = 'paid'
        GROUP BY i.plan
      ) pr
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ─── List invoices ───
CREATE OR REPLACE FUNCTION public.admin_list_invoices(
  p_org_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
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
  IF NOT public.admin_has_permission(v_caller_id, 'invoices.view') THEN
    RAISE EXCEPTION 'Permission denied: invoices.view';
  END IF;

  SELECT count(*) INTO v_total FROM public.admin_invoices i
  WHERE (p_org_id IS NULL OR i.organization_id = p_org_id)
    AND (p_status IS NULL OR i.status = p_status);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'organization_id', i.organization_id,
      'org_name', o.name,
      'plan', i.plan,
      'status', i.status,
      'subtotal', i.subtotal,
      'tax_rate', i.tax_rate,
      'tax_amount', i.tax_amount,
      'total', i.total,
      'currency', i.currency,
      'due_date', i.due_date,
      'paid_at', i.paid_at,
      'billing_period_start', i.billing_period_start,
      'billing_period_end', i.billing_period_end,
      'created_at', i.created_at
    ) AS row_data
    FROM public.admin_invoices i
    JOIN public.organizations o ON o.id = i.organization_id
    WHERE (p_org_id IS NULL OR i.organization_id = p_org_id)
      AND (p_status IS NULL OR i.status = p_status)
    ORDER BY i.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;


-- ─── Create invoice ───
CREATE OR REPLACE FUNCTION public.admin_create_invoice(
  p_org_id UUID,
  p_plan TEXT,
  p_subtotal NUMERIC,
  p_tax_rate NUMERIC DEFAULT 15.00,
  p_billing_start TIMESTAMPTZ DEFAULT NULL,
  p_billing_end TIMESTAMPTZ DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_inv_id UUID;
  v_inv_number TEXT;
  v_tax NUMERIC;
  v_total NUMERIC;
  v_sub_id UUID;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'invoices.create') THEN
    RAISE EXCEPTION 'Permission denied: invoices.create';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Get subscription
  SELECT id INTO v_sub_id FROM public.subscriptions
  WHERE organization_id = p_org_id ORDER BY created_at DESC LIMIT 1;

  -- Calculate
  v_inv_number := public.generate_invoice_number();
  v_tax := ROUND(p_subtotal * (p_tax_rate / 100), 2);
  v_total := p_subtotal + v_tax;

  INSERT INTO public.admin_invoices (
    invoice_number, organization_id, subscription_id, plan,
    subtotal, tax_rate, tax_amount, total, currency,
    billing_period_start, billing_period_end, due_date, notes,
    status, created_by
  ) VALUES (
    v_inv_number, p_org_id, v_sub_id, p_plan,
    p_subtotal, p_tax_rate, v_tax, v_total, 'SAR',
    p_billing_start, p_billing_end,
    COALESCE(p_due_date, now() + interval '30 days'),
    p_notes, 'draft', v_caller_id
  ) RETURNING id INTO v_inv_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'invoice.create', 'finance',
    'invoice', v_inv_id,
    jsonb_build_object('invoice_number', v_inv_number, 'total', v_total, 'org_id', p_org_id),
    'info'
  );

  RETURN jsonb_build_object('id', v_inv_id, 'invoice_number', v_inv_number, 'total', v_total);
END;
$$;


-- ─── Update invoice status ───
CREATE OR REPLACE FUNCTION public.admin_update_invoice_status(
  p_invoice_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_old_status TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'invoices.update') THEN
    RAISE EXCEPTION 'Permission denied: invoices.update';
  END IF;

  IF p_status NOT IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid invoice status: %', p_status;
  END IF;

  SELECT status INTO v_old_status FROM public.admin_invoices WHERE id = p_invoice_id;
  IF v_old_status IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;

  UPDATE public.admin_invoices SET
    status = p_status,
    paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END
  WHERE id = p_invoice_id;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'invoice.update_status', 'finance',
    'invoice', p_invoice_id,
    jsonb_build_object('old_status', v_old_status, 'new_status', p_status),
    CASE WHEN p_status IN ('cancelled', 'refunded') THEN 'critical' ELSE 'warning' END
  );
END;
$$;


-- ─── Record manual payment ───
CREATE OR REPLACE FUNCTION public.admin_record_payment(
  p_invoice_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'manual',
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_inv admin_invoices%ROWTYPE;
  v_payment_id UUID;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'finance.manage') THEN
    RAISE EXCEPTION 'Permission denied: finance.manage';
  END IF;

  SELECT * INTO v_inv FROM public.admin_invoices WHERE id = p_invoice_id;
  IF v_inv IS NULL THEN RAISE EXCEPTION 'Invoice not found'; END IF;

  IF p_method NOT IN ('manual', 'bank_transfer', 'credit_card', 'mada', 'stc_pay', 'other') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  INSERT INTO public.admin_payments (
    invoice_id, organization_id, amount, currency, method, status, reference, notes, recorded_by
  ) VALUES (
    p_invoice_id, v_inv.organization_id, p_amount, v_inv.currency,
    p_method, 'completed', p_reference, p_notes, v_caller_id
  ) RETURNING id INTO v_payment_id;

  -- Auto-mark invoice as paid if payment >= total
  IF p_amount >= v_inv.total THEN
    UPDATE public.admin_invoices SET status = 'paid', paid_at = now() WHERE id = p_invoice_id;
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'payment.record', 'finance',
    'payment', v_payment_id,
    jsonb_build_object('invoice_id', p_invoice_id, 'amount', p_amount, 'method', p_method),
    'warning'
  );

  RETURN v_payment_id;
END;
$$;


-- ═══════════════════════════════════════════════════
-- REVOKE/GRANT
-- ═══════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_billing_overview() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_invoices(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_create_invoice(UUID, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_invoice_status(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_record_payment(UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- generate_invoice_number: service_role only (called from other RPCs)
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO service_role;

-- Billing RPCs: authenticated (permission checked inside)
GRANT EXECUTE ON FUNCTION public.admin_get_billing_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_invoices(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_invoice(UUID, TEXT, NUMERIC, NUMERIC, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_invoice_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_record_payment(UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
