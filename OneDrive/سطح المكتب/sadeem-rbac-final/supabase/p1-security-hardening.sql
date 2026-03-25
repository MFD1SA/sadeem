-- ============================================================================
-- P1 Security Hardening — apply AFTER all prior migrations
-- Fixes:
--   1. increment_ai_reply / increment_template_reply: add auth.uid() check
--      (previously any authenticated user could consume any org's quota)
--   2. memberships INSERT: drop unsafe self-invitation policy
--      (the "Owners can manage memberships" FOR ALL policy already covers
--       owner self-registration via owner_user_id check in organizations)
--   3. subscriptions: add UNIQUE constraint on organization_id
--      (prevents duplicate rows from trigger retries / race conditions)
-- ============================================================================


-- ─── 1. Fix increment_ai_reply: validate caller is a member of the org ───────

CREATE OR REPLACE FUNCTION public.increment_ai_reply(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub    record;
  max_ai integer;
BEGIN
  -- Security: caller must be an active member of the target organization.
  -- Without this check, any authenticated user can drain any org's quota.
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
     WHERE organization_id = org_id
       AND user_id         = auth.uid()
  ) THEN
    RAISE EXCEPTION 'increment_ai_reply: access denied — not a member of organization';
  END IF;

  SELECT * INTO sub
    FROM public.subscriptions
   WHERE organization_id = org_id
   ORDER BY created_at DESC
   LIMIT 1;

  IF sub IS NULL THEN RETURN false; END IF;

  IF sub.status = 'trial' THEN
    IF sub.ends_at IS NOT NULL AND sub.ends_at < now() THEN
      UPDATE public.subscriptions
         SET status = 'expired', updated_at = now()
       WHERE id = sub.id;
      RETURN false;
    END IF;
    max_ai := 2;
  ELSIF sub.status = 'expired' OR sub.status = 'cancelled' THEN
    RETURN false;
  ELSE
    max_ai := 999999;
  END IF;

  IF sub.ai_replies_used >= max_ai THEN RETURN false; END IF;

  UPDATE public.subscriptions
     SET ai_replies_used = ai_replies_used + 1,
         updated_at      = now()
   WHERE id = sub.id;

  RETURN true;
END;
$$;

-- Keep existing grants (revoke PUBLIC, grant to authenticated)
REVOKE EXECUTE ON FUNCTION public.increment_ai_reply(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_ai_reply(uuid) TO authenticated;


-- ─── 2. Fix increment_template_reply: validate caller is a member of the org ─

CREATE OR REPLACE FUNCTION public.increment_template_reply(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub           record;
  max_templates integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
     WHERE organization_id = org_id
       AND user_id         = auth.uid()
  ) THEN
    RAISE EXCEPTION 'increment_template_reply: access denied — not a member of organization';
  END IF;

  SELECT * INTO sub
    FROM public.subscriptions
   WHERE organization_id = org_id
   ORDER BY created_at DESC
   LIMIT 1;

  IF sub IS NULL THEN RETURN false; END IF;

  IF sub.status = 'trial' THEN
    IF sub.ends_at IS NOT NULL AND sub.ends_at < now() THEN
      UPDATE public.subscriptions
         SET status = 'expired', updated_at = now()
       WHERE id = sub.id;
      RETURN false;
    END IF;
    max_templates := 10;
  ELSIF sub.status = 'expired' OR sub.status = 'cancelled' THEN
    RETURN false;
  ELSE
    max_templates := 999999;
  END IF;

  IF sub.template_replies_used >= max_templates THEN RETURN false; END IF;

  UPDATE public.subscriptions
     SET template_replies_used = template_replies_used + 1,
         updated_at            = now()
   WHERE id = sub.id;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_template_reply(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.increment_template_reply(uuid) TO authenticated;


-- ─── 3. Fix memberships INSERT: drop self-invitation policy ──────────────────
--
-- The "Owners can manage memberships" policy (FOR ALL) already allows the
-- organization owner to insert their own membership row because it checks
-- organizations.owner_user_id = auth.uid(). The broad "Authenticated users
-- can create membership" policy (WITH CHECK user_id = auth.uid()) lets any
-- subscriber add themselves to any organization, which is a tenant isolation
-- breach. Drop it.
--
DROP POLICY IF EXISTS "Authenticated users can create membership" ON public.memberships;


-- ─── 4. Add UNIQUE constraint on subscriptions.organization_id ───────────────
--
-- Prevents duplicate subscription rows (e.g., from trigger retries).
-- PostgreSQL does NOT support ADD CONSTRAINT IF NOT EXISTS, so we use a
-- DO block that checks pg_constraint before applying — safe on repeated runs.
--
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname     = 'subscriptions_organization_id_unique'
       AND conrelid    = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_organization_id_unique UNIQUE (organization_id);
  END IF;
END;
$$;

-- Update the org-creation trigger to be idempotent
CREATE OR REPLACE FUNCTION public.handle_new_organization_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.subscriptions
    (organization_id, plan, status, starts_at, ends_at, ai_replies_used, template_replies_used)
  VALUES
    (NEW.id, 'starter', 'trial', now(), now() + interval '24 hours', 0, 0)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;
