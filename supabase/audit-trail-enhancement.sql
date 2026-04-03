-- ============================================================================
-- SADEEM Audit Trail Enhancement
-- Upgrades audit_logs for full actor tracking, proper event types,
-- and structured details (jsonb).
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- 1. Convert details from text to jsonb (backward-compatible)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'details' AND data_type = 'text'
  ) THEN
    -- Add temp column, migrate data, swap
    ALTER TABLE public.audit_logs ADD COLUMN details_jsonb jsonb;
    UPDATE public.audit_logs SET details_jsonb =
      CASE
        WHEN details IS NULL THEN NULL
        WHEN details LIKE '{%' THEN details::jsonb  -- already JSON-shaped
        ELSE jsonb_build_object('message', details)  -- wrap plain text
      END;
    ALTER TABLE public.audit_logs DROP COLUMN details;
    ALTER TABLE public.audit_logs RENAME COLUMN details_jsonb TO details;
  END IF;
END $$;

-- 2. Add actor_type column: 'user' | 'system' | 'auto'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'actor_type'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN actor_type text NOT NULL DEFAULT 'system';
  END IF;
END $$;

-- 3. Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_type ON public.audit_logs(actor_type);

-- 4. Composite index for common query pattern: org + event + created_at
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_event_date ON public.audit_logs(organization_id, event, created_at DESC);
