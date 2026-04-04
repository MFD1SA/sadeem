-- ============================================================================
-- SENDA Admin — Phase 6: AI Usage & Cost Control
-- Run AFTER admin-phase5-billing.sql
--
-- Creates:
-- 1. ai_usage_logs table (tracks every AI call)
-- 2. Monthly AI limit columns on subscriptions
-- 3. RPC: log_ai_usage (called from subscriber frontend after AI call)
-- 4. RPC: check_ai_limit (called before AI call to enforce limits)
-- 5. Admin RPCs for usage analytics
-- ============================================================================


-- ═══════════════════════════════════════════════════
-- STEP 1: AI Usage Logs table
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id),
  review_id UUID REFERENCES public.reviews(id),
  user_id UUID REFERENCES public.users(id),
  provider TEXT NOT NULL DEFAULT 'google',
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash-lite',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'error', 'rate_limited', 'limit_exceeded')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON public.ai_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_month ON public.ai_usage_logs(organization_id, created_at);

-- RLS: subscribers see own, admins see all
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_subscriber_select" ON public.ai_usage_logs
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR public.is_active_admin()
  );

CREATE POLICY "ai_usage_service" ON public.ai_usage_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscribers can insert their own usage logs
CREATE POLICY "ai_usage_subscriber_insert" ON public.ai_usage_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );


-- ═══════════════════════════════════════════════════
-- STEP 2: Monthly AI limits on subscriptions
-- ═══════════════════════════════════════════════════

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS monthly_ai_limit INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ai_replies_this_month INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now());


-- ═══════════════════════════════════════════════════
-- STEP 3: Subscriber-callable functions
-- ═══════════════════════════════════════════════════

-- Check if org can use AI (limit enforcement)
CREATE OR REPLACE FUNCTION public.check_ai_monthly_limit(p_org_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub subscriptions%ROWTYPE;
  v_plan_limit INTEGER;
BEGIN
  SELECT * INTO v_sub FROM public.subscriptions
  WHERE organization_id = p_org_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No subscription');
  END IF;

  IF v_sub.status IN ('expired', 'cancelled') THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Subscription inactive');
  END IF;

  -- Auto-reset monthly counter
  IF v_sub.month_reset_at < date_trunc('month', now()) THEN
    UPDATE public.subscriptions SET
      ai_replies_this_month = 0,
      month_reset_at = date_trunc('month', now())
    WHERE id = v_sub.id;
    v_sub.ai_replies_this_month := 0;
  END IF;

  -- Plan limits
  v_plan_limit := CASE v_sub.plan
    WHEN 'starter' THEN 20
    WHEN 'growth' THEN 100
    WHEN 'pro' THEN 500
    WHEN 'enterprise' THEN 10000
    ELSE 20
  END;

  -- Trial override
  IF v_sub.status = 'trial' THEN
    v_plan_limit := 2;
    IF v_sub.ends_at IS NOT NULL AND v_sub.ends_at < now() THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Trial expired');
    END IF;
  END IF;

  IF v_sub.ai_replies_this_month >= v_plan_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly AI limit reached',
      'used', v_sub.ai_replies_this_month,
      'limit', v_plan_limit
    );
  END IF;

  -- Increment counter
  UPDATE public.subscriptions SET
    ai_replies_this_month = ai_replies_this_month + 1,
    ai_replies_used = ai_replies_used + 1,
    updated_at = now()
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_sub.ai_replies_this_month + 1,
    'limit', v_plan_limit
  );
END;
$$;

-- Log AI usage (called from subscriber frontend after AI call)
CREATE OR REPLACE FUNCTION public.log_ai_usage(
  p_org_id UUID,
  p_branch_id UUID DEFAULT NULL,
  p_review_id UUID DEFAULT NULL,
  p_provider TEXT DEFAULT 'google',
  p_model TEXT DEFAULT 'gemini-2.0-flash-lite',
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0,
  p_total_tokens INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_cost NUMERIC(10,6);
BEGIN
  -- Estimated cost: Gemini Flash Lite pricing ~$0.075 per 1M input tokens, $0.30 per 1M output tokens
  v_cost := (p_input_tokens * 0.000000075) + (p_output_tokens * 0.0000003);

  INSERT INTO public.ai_usage_logs (
    organization_id, branch_id, review_id, user_id,
    provider, model, input_tokens, output_tokens, total_tokens,
    estimated_cost_usd, status, error_message, duration_ms
  ) VALUES (
    p_org_id, p_branch_id, p_review_id, auth.uid(),
    p_provider, p_model, p_input_tokens, p_output_tokens, p_total_tokens,
    v_cost, p_status, p_error_message, p_duration_ms
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


-- ═══════════════════════════════════════════════════
-- STEP 4: Admin RPCs
-- ═══════════════════════════════════════════════════

-- Overview stats
CREATE OR REPLACE FUNCTION public.admin_get_ai_usage_overview()
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
  IF NOT public.admin_has_permission(v_caller_id, 'dashboard.analytics') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  RETURN jsonb_build_object(
    'total_calls', (SELECT count(*) FROM public.ai_usage_logs),
    'calls_this_month', (SELECT count(*) FROM public.ai_usage_logs WHERE created_at >= date_trunc('month', now())),
    'successful_calls', (SELECT count(*) FROM public.ai_usage_logs WHERE status = 'success'),
    'failed_calls', (SELECT count(*) FROM public.ai_usage_logs WHERE status IN ('error', 'rate_limited')),
    'limit_exceeded_calls', (SELECT count(*) FROM public.ai_usage_logs WHERE status = 'limit_exceeded'),
    'total_tokens', (SELECT COALESCE(sum(total_tokens), 0) FROM public.ai_usage_logs WHERE status = 'success'),
    'tokens_this_month', (SELECT COALESCE(sum(total_tokens), 0) FROM public.ai_usage_logs WHERE status = 'success' AND created_at >= date_trunc('month', now())),
    'total_cost_usd', (SELECT COALESCE(sum(estimated_cost_usd), 0) FROM public.ai_usage_logs WHERE status = 'success'),
    'cost_this_month', (SELECT COALESCE(sum(estimated_cost_usd), 0) FROM public.ai_usage_logs WHERE status = 'success' AND created_at >= date_trunc('month', now())),
    'top_consumers', (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'total_calls' DESC), '[]'::JSONB)
      FROM (
        SELECT jsonb_build_object(
          'org_id', a.organization_id,
          'org_name', o.name,
          'total_calls', count(*),
          'total_tokens', sum(a.total_tokens),
          'total_cost', sum(a.estimated_cost_usd)
        ) AS row_data
        FROM public.ai_usage_logs a
        JOIN public.organizations o ON o.id = a.organization_id
        WHERE a.status = 'success' AND a.created_at >= date_trunc('month', now())
        GROUP BY a.organization_id, o.name
        ORDER BY count(*) DESC
        LIMIT 10
      ) sub
    ),
    'daily_calls', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'date', d::DATE,
        'calls', COALESCE(c.cnt, 0)
      ) ORDER BY d), '[]'::JSONB)
      FROM generate_series(
        date_trunc('month', now()),
        now(),
        '1 day'::INTERVAL
      ) d
      LEFT JOIN (
        SELECT date_trunc('day', created_at) AS day, count(*) AS cnt
        FROM public.ai_usage_logs WHERE created_at >= date_trunc('month', now())
        GROUP BY day
      ) c ON c.day = d
    )
  );
END;
$$;

-- Usage by org
CREATE OR REPLACE FUNCTION public.admin_list_ai_usage_by_org(
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
  IF NOT public.admin_has_permission(v_caller_id, 'dashboard.analytics') THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT count(*) INTO v_total FROM public.ai_usage_logs
  WHERE (p_org_id IS NULL OR organization_id = p_org_id)
    AND (p_status IS NULL OR status = p_status);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', a.id,
      'org_name', o.name,
      'model', a.model,
      'total_tokens', a.total_tokens,
      'estimated_cost_usd', a.estimated_cost_usd,
      'status', a.status,
      'error_message', a.error_message,
      'duration_ms', a.duration_ms,
      'created_at', a.created_at
    ) AS row_data
    FROM public.ai_usage_logs a
    JOIN public.organizations o ON o.id = a.organization_id
    WHERE (p_org_id IS NULL OR a.organization_id = p_org_id)
      AND (p_status IS NULL OR a.status = p_status)
    ORDER BY a.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;


-- ═══════════════════════════════════════════════════
-- STEP 5: REVOKE/GRANT
-- ═══════════════════════════════════════════════════

-- Subscriber-callable functions
REVOKE EXECUTE ON FUNCTION public.check_ai_monthly_limit(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_ai_monthly_limit(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.log_ai_usage(UUID, UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(UUID, UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER) TO authenticated;

-- Admin-only RPCs
REVOKE EXECUTE ON FUNCTION public.admin_get_ai_usage_overview() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_ai_usage_by_org(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_get_ai_usage_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_ai_usage_by_org(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
