-- ═══════════════════════════════════════════════════════════════
-- Smart Template Mode — Migration
-- 1. Adds smart_template_mode toggle to organizations table
-- 2. Adds language column to reply_templates for bilingual support
-- ═══════════════════════════════════════════════════════════════

-- 1. Smart Template Mode toggle (defaults to false — opt-in feature)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS smart_template_mode BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.smart_template_mode IS
  'When enabled, the sync pipeline tries to match a ready template before calling AI. '
  'Template matches consume template_replies quota; AI fallback consumes ai_replies quota. '
  'No double consumption occurs.';

-- 2. Bilingual template support
--    'ar' = Arabic only, 'en' = English only, 'any' = used for both languages
ALTER TABLE public.reply_templates
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ar'
  CHECK (language IN ('ar', 'en', 'any'));

COMMENT ON COLUMN public.reply_templates.language IS
  'Template language: ar=Arabic only, en=English only, any=matches both. '
  'Smart Template Mode uses this to avoid serving an Arabic template for an English review.';

-- 3. RLS: existing policies on organizations and reply_templates already allow
--    owner/member read/update. No new policy needed.
