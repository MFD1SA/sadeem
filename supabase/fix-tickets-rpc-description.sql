-- ============================================================================
-- FIX: Include description field in admin_list_tickets RPC response
-- Without this, ticket body/description is never sent to the admin UI.
-- ============================================================================

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
      'id', t.id, 'subject', t.subject, 'description', t.description,
      'status', t.status, 'priority', t.priority,
      'submitted_by_name', t.submitted_by_name,
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
