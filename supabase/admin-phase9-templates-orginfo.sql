-- ============================================================================
-- SADEEM Admin — Phase 9: Template Management + Org Info Update
-- Adds RPCs for:
-- 1. admin_update_org_info       – edit subscriber org name/industry/city
-- 2. admin_list_all_templates    – list all templates across all orgs
-- 3. admin_update_template       – edit a template
-- 4. admin_delete_template       – delete a template
-- ============================================================================


-- ─── 1. UPDATE ORGANIZATION INFO ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_org_info(
  p_org_id UUID,
  p_name TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.update') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.update';
  END IF;

  UPDATE public.organizations
  SET
    name     = COALESCE(NULLIF(p_name, ''), name),
    industry = COALESCE(p_industry, industry),
    city     = COALESCE(p_city, city),
    country  = COALESCE(p_country, country)
  WHERE id = p_org_id;

  -- audit
  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, target_type, target_id, severity, details)
  SELECT v_caller_id, au.email, 'org.update_info', 'subscribers', 'organization', p_org_id, 'info',
    jsonb_build_object('name', p_name, 'industry', p_industry, 'city', p_city, 'country', p_country)
  FROM public.admin_users au WHERE au.id = v_caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_org_info FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_org_info TO authenticated;


-- ─── 2. LIST ALL TEMPLATES (across all orgs) ──────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_list_all_templates(
  p_search TEXT DEFAULT NULL,
  p_org_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
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

  SELECT count(*) INTO v_total
  FROM public.reply_templates t
  JOIN public.organizations o ON o.id = t.organization_id
  WHERE (p_search IS NULL OR t.name ILIKE '%' || p_search || '%' OR t.body ILIKE '%' || p_search || '%')
    AND (p_org_id IS NULL OR t.organization_id = p_org_id)
    AND (p_category IS NULL OR t.category = p_category);

  SELECT COALESCE(jsonb_agg(row_data ORDER BY (row_data->>'created_at') DESC), '[]'::JSONB)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', t.id,
      'organization_id', t.organization_id,
      'org_name', o.name,
      'name', t.name,
      'body', t.body,
      'category', t.category,
      'rating_min', t.rating_min,
      'rating_max', t.rating_max,
      'is_active', t.is_active,
      'usage_count', t.usage_count,
      'language', COALESCE(t.language, 'ar'),
      'created_at', t.created_at
    ) AS row_data
    FROM public.reply_templates t
    JOIN public.organizations o ON o.id = t.organization_id
    WHERE (p_search IS NULL OR t.name ILIKE '%' || p_search || '%' OR t.body ILIKE '%' || p_search || '%')
      AND (p_org_id IS NULL OR t.organization_id = p_org_id)
      AND (p_category IS NULL OR t.category = p_category)
    ORDER BY t.created_at DESC
    LIMIT p_limit OFFSET p_offset
  ) sub;

  RETURN jsonb_build_object('data', v_result, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_all_templates FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_all_templates TO authenticated;


-- ─── 3. UPDATE TEMPLATE ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_update_template(
  p_template_id UUID,
  p_name TEXT DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_rating_min INTEGER DEFAULT NULL,
  p_rating_max INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_language TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_org_id UUID;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.update') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.update';
  END IF;

  SELECT organization_id INTO v_org_id FROM public.reply_templates WHERE id = p_template_id;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Template not found'; END IF;

  UPDATE public.reply_templates
  SET
    name       = COALESCE(NULLIF(p_name, ''), name),
    body       = COALESCE(NULLIF(p_body, ''), body),
    category   = COALESCE(NULLIF(p_category, ''), category),
    rating_min = COALESCE(p_rating_min, rating_min),
    rating_max = COALESCE(p_rating_max, rating_max),
    is_active  = COALESCE(p_is_active, is_active),
    language   = COALESCE(NULLIF(p_language, ''), language)
  WHERE id = p_template_id;

  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, target_type, target_id, severity, details)
  SELECT v_caller_id, au.email, 'template.update', 'subscribers', 'template', p_template_id, 'info',
    jsonb_build_object('org_id', v_org_id, 'name', p_name, 'category', p_category)
  FROM public.admin_users au WHERE au.id = v_caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_template FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_template TO authenticated;


-- ─── 4. DELETE TEMPLATE ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_delete_template(
  p_template_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_org_id UUID;
  v_template_name TEXT;
BEGIN
  SELECT id INTO v_caller_id FROM public.admin_users
  WHERE auth_uid = auth.uid() AND status = 'active' AND deleted_at IS NULL;
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not an active admin'; END IF;
  IF NOT public.admin_has_permission(v_caller_id, 'subscribers.update') THEN
    RAISE EXCEPTION 'Permission denied: subscribers.update';
  END IF;

  SELECT organization_id, name INTO v_org_id, v_template_name
  FROM public.reply_templates WHERE id = p_template_id;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Template not found'; END IF;

  DELETE FROM public.reply_templates WHERE id = p_template_id;

  INSERT INTO public.admin_audit_logs (admin_user_id, admin_email, action, module, target_type, target_id, severity, details)
  SELECT v_caller_id, au.email, 'template.delete', 'subscribers', 'template', p_template_id, 'warning',
    jsonb_build_object('org_id', v_org_id, 'name', v_template_name)
  FROM public.admin_users au WHERE au.id = v_caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_template FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_template TO authenticated;
