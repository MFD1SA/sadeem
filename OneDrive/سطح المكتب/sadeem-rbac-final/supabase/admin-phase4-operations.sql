-- ============================================================================
-- SADEEM Admin — Phase 4: Subscriber & Subscription Management RPCs
-- Run AFTER admin-phase3-role-management.sql
--
-- These RPCs let admins read subscriber data (organizations, subscriptions,
-- branches, reviews) which is normally RLS-restricted to org members only.
-- SECURITY DEFINER functions bypass RLS and check admin permissions instead.
--
-- IMPORTANT: These functions do NOT modify subscriber RLS policies.
-- Subscriber dashboard continues to work exactly as before.
-- ============================================================================


-- ─── 1. LIST SUBSCRIBERS (organizations + subscription + stats) ───
-- Required permission: subscribers.view

CREATE OR REPLACE FUNCTION public.admin_list_subscribers(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
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

  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.view') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.view';
  END IF;

  -- Count total
  SELECT count(*) INTO v_total
  FROM public.organizations o
  LEFT JOIN LATERAL (
    SELECT * FROM public.subscriptions
    WHERE organization_id = o.id ORDER BY created_at DESC LIMIT 1
  ) s ON true
  WHERE (p_search IS NULL OR o.name ILIKE '%' || p_search || '%' OR o.slug ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR s.status = p_status)
    AND (p_plan IS NULL OR s.plan = p_plan);

  -- Fetch page
  SELECT COALESCE(jsonb_agg(row_data ORDER BY row_data->>'created_at' DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'slug', o.slug,
      'industry', o.industry,
      'country', o.country,
      'city', o.city,
      'created_at', o.created_at,
      'owner_email', u.email,
      'owner_name', u.full_name,
      'subscription', CASE WHEN s.id IS NOT NULL THEN jsonb_build_object(
        'id', s.id,
        'plan', s.plan,
        'status', s.status,
        'starts_at', s.starts_at,
        'ends_at', s.ends_at,
        'ai_replies_used', s.ai_replies_used,
        'template_replies_used', s.template_replies_used,
        'updated_at', s.updated_at
      ) ELSE NULL END,
      'branch_count', (SELECT count(*) FROM public.branches WHERE organization_id = o.id AND status = 'active'),
      'review_count', (SELECT count(*) FROM public.reviews WHERE organization_id = o.id),
      'member_count', (SELECT count(*) FROM public.memberships WHERE organization_id = o.id AND status = 'active')
    ) AS row_data
    FROM public.organizations o
    LEFT JOIN public.users u ON u.id = o.owner_user_id
    LEFT JOIN LATERAL (
      SELECT * FROM public.subscriptions
      WHERE organization_id = o.id ORDER BY created_at DESC LIMIT 1
    ) s ON true
    WHERE (p_search IS NULL OR o.name ILIKE '%' || p_search || '%' OR o.slug ILIKE '%' || p_search || '%')
      AND (p_status IS NULL OR s.status = p_status)
      AND (p_plan IS NULL OR s.plan = p_plan)
    ORDER BY o.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;


-- ─── 2. GET SUBSCRIBER DETAIL ───
-- Required permission: subscribers.view

CREATE OR REPLACE FUNCTION public.admin_get_subscriber_detail(p_org_id UUID)
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

  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.view') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.view';
  END IF;

  SELECT jsonb_build_object(
    'organization', jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug,
      'industry', o.industry, 'country', o.country, 'city', o.city,
      'created_at', o.created_at
    ),
    'owner', jsonb_build_object(
      'id', u.id, 'email', u.email, 'full_name', u.full_name,
      'avatar_url', u.avatar_url, 'created_at', u.created_at
    ),
    'subscription', (
      SELECT jsonb_build_object(
        'id', s.id, 'plan', s.plan, 'status', s.status,
        'starts_at', s.starts_at, 'ends_at', s.ends_at,
        'ai_replies_used', s.ai_replies_used,
        'template_replies_used', s.template_replies_used,
        'updated_at', s.updated_at
      ) FROM public.subscriptions s
      WHERE s.organization_id = o.id ORDER BY s.created_at DESC LIMIT 1
    ),
    'branches', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', b.id, 'internal_name', b.internal_name, 'city', b.city,
        'status', b.status, 'created_at', b.created_at
      )), '[]'::JSONB) FROM public.branches b WHERE b.organization_id = o.id
    ),
    'members', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'role', m.role, 'status', m.status,
        'email', mu.email, 'full_name', mu.full_name
      )), '[]'::JSONB)
      FROM public.memberships m
      JOIN public.users mu ON mu.id = m.user_id
      WHERE m.organization_id = o.id
    ),
    'stats', jsonb_build_object(
      'total_reviews', (SELECT count(*) FROM public.reviews WHERE organization_id = o.id),
      'reviews_this_month', (SELECT count(*) FROM public.reviews WHERE organization_id = o.id AND created_at >= date_trunc('month', now())),
      'active_branches', (SELECT count(*) FROM public.branches WHERE organization_id = o.id AND status = 'active')
    )
  ) INTO v_result
  FROM public.organizations o
  JOIN public.users u ON u.id = o.owner_user_id
  WHERE o.id = p_org_id;

  RETURN v_result;
END;
$$;


-- ─── 3. UPDATE SUBSCRIPTION (plan change, status change) ───
-- Required permission: subscribers.update

CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_org_id UUID,
  p_plan TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
  v_sub_id UUID;
  v_old_plan TEXT;
  v_old_status TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.update') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.update';
  END IF;

  -- Get current subscription
  SELECT id, plan, status INTO v_sub_id, v_old_plan, v_old_status
  FROM public.subscriptions
  WHERE organization_id = p_org_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_sub_id IS NULL THEN
    RAISE EXCEPTION 'No subscription found for this organization';
  END IF;

  -- Validate plan
  IF p_plan IS NOT NULL AND p_plan NOT IN ('starter', 'growth', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  -- Validate status
  IF p_status IS NOT NULL AND p_status NOT IN ('active', 'trial', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  -- Update
  UPDATE public.subscriptions SET
    plan = COALESCE(p_plan, plan),
    status = COALESCE(p_status, status),
    ends_at = CASE WHEN p_ends_at IS NOT NULL THEN p_ends_at ELSE ends_at END,
    updated_at = now()
  WHERE id = v_sub_id;

  -- Audit
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'subscription.update', 'subscribers',
    'organization', p_org_id,
    jsonb_build_object(
      'old_plan', v_old_plan, 'new_plan', COALESCE(p_plan, v_old_plan),
      'old_status', v_old_status, 'new_status', COALESCE(p_status, v_old_status),
      'ends_at', p_ends_at
    ),
    'warning'
  );
END;
$$;


-- ─── 4. SUSPEND / REACTIVATE ORGANIZATION ───
-- Required permission: subscribers.suspend

CREATE OR REPLACE FUNCTION public.admin_suspend_subscriber(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.suspend') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.suspend';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  UPDATE public.subscriptions SET status = 'cancelled', updated_at = now()
  WHERE organization_id = p_org_id AND status IN ('active', 'trial');

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'subscriber.suspend', 'subscribers',
    'organization', p_org_id, 'critical'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reactivate_subscriber(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_email TEXT;
BEGIN
  SELECT id, email INTO v_caller_id, v_caller_email
  FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;

  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;

  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.update') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.update';
  END IF;

  UPDATE public.subscriptions SET status = 'active', updated_at = now()
  WHERE organization_id = p_org_id AND status IN ('expired', 'cancelled');

  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, severity
  ) VALUES (
    v_caller_id, v_caller_email, 'subscriber.reactivate', 'subscribers',
    'organization', p_org_id, 'warning'
  );
END;
$$;


-- ─── 5. DASHBOARD STATS FOR ADMIN ───
-- Required permission: dashboard.view

CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
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

  IF NOT public.admin_has_permission(v_caller_id, 'dashboard.view') THEN
    RAISE EXCEPTION 'Permission denied: dashboard.view';
  END IF;

  RETURN jsonb_build_object(
    'total_organizations', (SELECT count(*) FROM public.organizations),
    'total_subscribers_active', (SELECT count(DISTINCT organization_id) FROM public.subscriptions WHERE status = 'active'),
    'total_subscribers_trial', (SELECT count(DISTINCT organization_id) FROM public.subscriptions WHERE status = 'trial'),
    'total_subscribers_expired', (SELECT count(DISTINCT organization_id) FROM public.subscriptions WHERE status IN ('expired', 'cancelled')),
    'total_branches', (SELECT count(*) FROM public.branches WHERE status = 'active'),
    'total_reviews', (SELECT count(*) FROM public.reviews),
    'reviews_this_month', (SELECT count(*) FROM public.reviews WHERE created_at >= date_trunc('month', now())),
    'total_ai_replies_used', (SELECT COALESCE(sum(ai_replies_used), 0) FROM public.subscriptions),
    'total_template_replies_used', (SELECT COALESCE(sum(template_replies_used), 0) FROM public.subscriptions),
    'plan_distribution', (
      SELECT COALESCE(jsonb_object_agg(plan, cnt), '{}'::JSONB)
      FROM (
        SELECT plan, count(*) as cnt
        FROM public.subscriptions
        WHERE status IN ('active', 'trial')
        GROUP BY plan
      ) pd
    ),
    'recent_organizations', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', o.id, 'name', o.name, 'created_at', o.created_at
      ) ORDER BY o.created_at DESC), '[]'::JSONB)
      FROM (SELECT * FROM public.organizations ORDER BY created_at DESC LIMIT 5) o
    ),
    'admin_count', (SELECT count(*) FROM public.admin_users WHERE status = 'active' AND deleted_at IS NULL)
  );
END;
$$;


-- ═══════════════════════════════════════════════════
-- REVOKE/GRANT
-- ═══════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.admin_list_subscribers(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_subscriber_detail(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_suspend_subscriber(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reactivate_subscriber(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_dashboard_stats() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_subscribers(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_subscriber_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_subscriber(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reactivate_subscriber(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;
