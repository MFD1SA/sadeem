-- ============================================================
-- SENDA — Plans + Integrations Dynamic Schema
-- Run once in Supabase SQL Editor
-- ============================================================

-- 1. Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  desc_ar TEXT,
  desc_en TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Plan limits table (numeric limits per plan)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  max_branches INTEGER NOT NULL DEFAULT 1,
  max_team_members INTEGER NOT NULL DEFAULT 1,
  max_ai_replies INTEGER NOT NULL DEFAULT 50,
  max_template_replies INTEGER NOT NULL DEFAULT 100,
  max_qr_codes INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id)
);

-- 3. Plan features table (boolean features per plan)
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_value TEXT NOT NULL DEFAULT 'false',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- 4. Integrations config table (dynamic, not hardcoded)
CREATE TABLE IF NOT EXISTS public.integrations_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('api', 'oauth', 'webhook')),
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  config_json JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── RLS ──
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations_config ENABLE ROW LEVEL SECURITY;

-- Plans: read-only for authenticated users, admin managed via service role
CREATE POLICY "Anyone can read plans" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read plan_limits" ON public.plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read plan_features" ON public.plan_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read integrations" ON public.integrations_config FOR SELECT TO authenticated USING (true);
-- Allow anon read for plans (for billing page before auth)
CREATE POLICY "Anon can read plans" ON public.plans FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read plan_limits" ON public.plan_limits FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read plan_features" ON public.plan_features FOR SELECT TO anon USING (true);

-- ── SEED: Plans ──
INSERT INTO public.plans (id, name_ar, name_en, desc_ar, desc_en, price_monthly, price_yearly, is_active, sort_order)
VALUES
  ('orbit',    'مدار',     'Orbit',    'للأنشطة الصغيرة والناشئة',          'For small & emerging businesses',       99,  990,  true, 1),
  ('nova',     'نوفا',     'Nova',     'للأنشطة المتنامية',                  'For growing businesses',                199, 1990, true, 2),
  ('galaxy',   'جالاكسي',  'Galaxy',   'للشركات المتقدمة متعددة الفروع',    'For advanced multi-branch companies',   399, 3990, true, 3),
  ('infinity', 'إنفينيتي', 'Infinity', 'حلول مخصصة بلا حدود',              'Unlimited custom solutions',              0,     0, true, 4)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  updated_at = now();

-- ── SEED: Plan Limits ──
INSERT INTO public.plan_limits (plan_id, max_branches, max_team_members, max_ai_replies, max_template_replies, max_qr_codes)
VALUES
  ('orbit',    1,  1,   50,       100, 1),
  ('nova',     3,  3,   300,      500, 3),
  ('galaxy',   10, 10,  1500, 999999, 10),
  ('infinity', -1, -1,  -1,    -1,    -1)
ON CONFLICT (plan_id) DO UPDATE SET
  max_branches       = EXCLUDED.max_branches,
  max_team_members   = EXCLUDED.max_team_members,
  max_ai_replies     = EXCLUDED.max_ai_replies,
  max_template_replies = EXCLUDED.max_template_replies,
  max_qr_codes       = EXCLUDED.max_qr_codes;

-- ── SEED: Plan Features ──
-- Orbit features
INSERT INTO public.plan_features (plan_id, feature_key, feature_value) VALUES
  ('orbit', 'google_integration', 'true'),
  ('orbit', 'ai_auto_reply',      'false'),
  ('orbit', 'manual_reply',       'true'),
  ('orbit', 'templates',          'true'),
  ('orbit', 'analytics',          'basic'),
  ('orbit', 'notifications',      'true'),
  ('orbit', 'tasks',              'false'),
  ('orbit', 'team_management',    'false'),
  ('orbit', 'api_access',         'false'),
  ('orbit', 'advanced_analytics', 'false'),
  ('orbit', 'branch_comparison',  'false'),
  ('orbit', 'premium_support',    'false'),
  ('orbit', 'qr_landing_page',    'false'),
  ('orbit', 'qr_employee_field',  'false'),
  ('orbit', 'qr_analytics',       'false')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET feature_value = EXCLUDED.feature_value;

-- Nova features
INSERT INTO public.plan_features (plan_id, feature_key, feature_value) VALUES
  ('nova', 'google_integration', 'true'),
  ('nova', 'ai_auto_reply',      'true'),
  ('nova', 'manual_reply',       'true'),
  ('nova', 'templates',          'true'),
  ('nova', 'analytics',          'advanced'),
  ('nova', 'notifications',      'true'),
  ('nova', 'tasks',              'true'),
  ('nova', 'team_management',    'true'),
  ('nova', 'api_access',         'false'),
  ('nova', 'advanced_analytics', 'true'),
  ('nova', 'branch_comparison',  'true'),
  ('nova', 'premium_support',    'false'),
  ('nova', 'qr_landing_page',    'true'),
  ('nova', 'qr_employee_field',  'false'),
  ('nova', 'qr_analytics',       'true')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET feature_value = EXCLUDED.feature_value;

-- Galaxy features
INSERT INTO public.plan_features (plan_id, feature_key, feature_value) VALUES
  ('galaxy', 'google_integration', 'true'),
  ('galaxy', 'ai_auto_reply',      'true'),
  ('galaxy', 'manual_reply',       'true'),
  ('galaxy', 'templates',          'true'),
  ('galaxy', 'analytics',          'advanced'),
  ('galaxy', 'notifications',      'true'),
  ('galaxy', 'tasks',              'true'),
  ('galaxy', 'team_management',    'true'),
  ('galaxy', 'api_access',         'false'),
  ('galaxy', 'advanced_analytics', 'true'),
  ('galaxy', 'branch_comparison',  'true'),
  ('galaxy', 'premium_support',    'true'),
  ('galaxy', 'qr_landing_page',    'true'),
  ('galaxy', 'qr_employee_field',  'true'),
  ('galaxy', 'qr_analytics',       'true')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET feature_value = EXCLUDED.feature_value;

-- Infinity features (all enabled)
INSERT INTO public.plan_features (plan_id, feature_key, feature_value) VALUES
  ('infinity', 'google_integration', 'true'),
  ('infinity', 'ai_auto_reply',      'true'),
  ('infinity', 'manual_reply',       'true'),
  ('infinity', 'templates',          'true'),
  ('infinity', 'analytics',          'advanced'),
  ('infinity', 'notifications',      'true'),
  ('infinity', 'tasks',              'true'),
  ('infinity', 'team_management',    'true'),
  ('infinity', 'api_access',         'true'),
  ('infinity', 'advanced_analytics', 'true'),
  ('infinity', 'branch_comparison',  'true'),
  ('infinity', 'premium_support',    'true'),
  ('infinity', 'qr_landing_page',    'true'),
  ('infinity', 'qr_employee_field',  'true'),
  ('infinity', 'qr_analytics',       'true')
ON CONFLICT (plan_id, feature_key) DO UPDATE SET feature_value = EXCLUDED.feature_value;

-- ── SEED: Integrations Config ──
INSERT INTO public.integrations_config (key, name_ar, name_en, type, category, enabled)
VALUES
  ('google_business',  'Google Business Profile',   'Google Business Profile',   'oauth',   'reviews',  false),
  ('google_gemini',    'الذكاء الاصطناعي — Gemini', 'AI — Google Gemini',         'api',     'ai',       false),
  ('stripe',           'Stripe — بوابة الدفع',      'Stripe — Payment Gateway',  'api',     'payments', false),
  ('moyasar',          'بوابة الدفع — ميسر',        'Moyasar — Payment Gateway', 'api',     'payments', false),
  ('slack',            'Slack — إشعارات',            'Slack Notifications',        'webhook', 'notifications', false),
  ('zapier',           'أتمتة Zapier',              'Zapier Automation',          'webhook', 'automation', false),
  ('whatsapp',         'WhatsApp Business',          'WhatsApp Business',          'api',     'notifications', false)
ON CONFLICT (key) DO NOTHING;

-- ── RPC: Get plan with limits and features ──
CREATE OR REPLACE FUNCTION public.get_plan_details(p_plan_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'plan', row_to_json(p.*),
    'limits', row_to_json(pl.*),
    'features', (
      SELECT jsonb_object_agg(pf.feature_key, pf.feature_value)
      FROM public.plan_features pf
      WHERE pf.plan_id = p_plan_id
    )
  ) INTO result
  FROM public.plans p
  LEFT JOIN public.plan_limits pl ON pl.plan_id = p.id
  WHERE p.id = p_plan_id;
  RETURN result;
END;
$$;

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_limits_plan_id ON public.plan_limits(plan_id);

SELECT 'SENDA plans + integrations schema applied successfully' AS status;
