-- ============================================================================
-- SENDA Admin Foundation — Migration
-- Creates: admin_roles, admin_permissions, admin_role_permissions,
--          admin_users, admin_audit_logs, admin_sessions
-- Run in Supabase SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Admin Roles ───
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Admin Permissions ───
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  display_name_ar TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_module ON public.admin_permissions(module);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_key ON public.admin_permissions(key);

-- ─── 3. Admin Role Permissions (junction) ───
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.admin_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_role_perms_role ON public.admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_perms_perm ON public.admin_role_permissions(permission_id);

-- ─── 4. Admin Users ───
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_uid UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT,
  avatar_url TEXT,
  phone TEXT,
  role_id UUID NOT NULL REFERENCES public.admin_roles(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  password_changed_at TIMESTAMPTZ,
  force_password_reset BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_auth_uid ON public.admin_users(auth_uid);
CREATE INDEX IF NOT EXISTS idx_admin_users_deleted ON public.admin_users(deleted_at);

-- ─── 5. Admin Audit Logs ───
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES public.admin_users(id),
  admin_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_module ON public.admin_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs(created_at DESC);

-- ─── 6. Admin Sessions ───
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON public.admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON public.admin_sessions(is_active, expires_at);

-- ─── 7. Updated_at triggers ───
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_roles_updated ON public.admin_roles;
CREATE TRIGGER trg_admin_roles_updated
  BEFORE UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

DROP TRIGGER IF EXISTS trg_admin_users_updated ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_updated_at();

-- ─── 8. RLS Policies ───
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read admin tables (needed for admin login flow)
-- The actual access control is done via admin_sessions + application logic.
CREATE POLICY "admin_roles_read" ON public.admin_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_roles_write" ON public.admin_roles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_permissions_read" ON public.admin_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_permissions_write" ON public.admin_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_role_permissions_read" ON public.admin_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_role_permissions_write" ON public.admin_role_permissions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_users_read" ON public.admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_users_manage" ON public.admin_users FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_audit_logs_read" ON public.admin_audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_audit_logs_insert" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_sessions_manage" ON public.admin_sessions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── 9. Helper Functions ───

CREATE OR REPLACE FUNCTION admin_has_permission(p_admin_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = p_admin_id AND is_super_admin = true AND status = 'active' AND deleted_at IS NULL
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    JOIN public.admin_role_permissions arp ON arp.role_id = au.role_id
    JOIN public.admin_permissions ap ON ap.id = arp.permission_id
    WHERE au.id = p_admin_id
      AND au.status = 'active'
      AND au.deleted_at IS NULL
      AND ap.key = p_permission_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_module TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM public.admin_users WHERE id = p_admin_id;
  INSERT INTO public.admin_audit_logs (
    admin_user_id, admin_email, action, module,
    target_type, target_id, details, severity
  ) VALUES (
    p_admin_id, v_email, p_action, p_module,
    p_target_type, p_target_id, p_details, p_severity
  ) RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
