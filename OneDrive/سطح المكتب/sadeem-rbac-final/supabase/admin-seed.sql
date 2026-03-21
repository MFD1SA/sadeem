-- ============================================================================
-- SADEEM Admin — Seed Data
-- Run AFTER admin-foundation.sql
-- Seeds: roles, permissions, role_permissions, first super_admin
-- ============================================================================

-- ─── 1. Seed Roles ───
INSERT INTO public.admin_roles (name, display_name_ar, display_name_en, description_ar, description_en, is_system) VALUES
  ('super_admin',      'مدير عام النظام',    'Super Admin',      'صلاحيات كاملة بلا قيود',                    'Full unrestricted access',                   true),
  ('operations_admin', 'مدير العمليات',       'Operations Admin', 'إدارة العمليات اليومية والمشتركين',          'Daily operations and subscriber management', true),
  ('finance_admin',    'مدير الشؤون المالية', 'Finance Admin',    'إدارة الاشتراكات والفوترة والتقارير المالية', 'Subscription, billing, and financial reports', true),
  ('support_admin',    'مدير الدعم الفني',    'Support Admin',    'إدارة التذاكر والدعم الفني للمشتركين',       'Ticket and technical support management',     true),
  ('readonly_admin',   'مشاهد فقط',          'Read-Only Admin',  'صلاحية عرض فقط بدون تعديل',                 'View-only access without modifications',      true)
ON CONFLICT (name) DO NOTHING;

-- ─── 2. Seed Permissions ───
INSERT INTO public.admin_permissions (key, module, action, display_name_ar, display_name_en) VALUES
  ('admin_users.view',       'admin_users', 'view',       'عرض المشرفين',       'View Admins'),
  ('admin_users.create',     'admin_users', 'create',     'إنشاء مشرف',         'Create Admin'),
  ('admin_users.update',     'admin_users', 'update',     'تعديل مشرف',         'Update Admin'),
  ('admin_users.deactivate', 'admin_users', 'deactivate', 'تعطيل مشرف',         'Deactivate Admin'),
  ('admin_users.delete',     'admin_users', 'delete',     'حذف مشرف',           'Delete Admin'),
  ('roles.view',             'roles',       'view',       'عرض الأدوار',         'View Roles'),
  ('roles.create',           'roles',       'create',     'إنشاء دور',          'Create Role'),
  ('roles.update',           'roles',       'update',     'تعديل دور',          'Update Role'),
  ('roles.delete',           'roles',       'delete',     'حذف دور',            'Delete Role'),
  ('roles.assign',           'roles',       'assign',     'تعيين دور',          'Assign Role'),
  ('subscribers.view',       'subscribers', 'view',       'عرض المشتركين',       'View Subscribers'),
  ('subscribers.update',     'subscribers', 'update',     'تعديل مشترك',        'Update Subscriber'),
  ('subscribers.suspend',    'subscribers', 'suspend',    'تعليق مشترك',        'Suspend Subscriber'),
  ('settings.view',          'settings',    'view',       'عرض الإعدادات',       'View Settings'),
  ('settings.update',        'settings',    'update',     'تعديل الإعدادات',     'Update Settings'),
  ('audit_logs.view',        'audit_logs',  'view',       'عرض سجل العمليات',    'View Audit Logs'),
  ('audit_logs.export',      'audit_logs',  'export',     'تصدير سجل العمليات',  'Export Audit Logs'),
  ('dashboard.view',         'dashboard',   'view',       'عرض لوحة التحكم',     'View Dashboard'),
  ('dashboard.analytics',    'dashboard',   'analytics',  'عرض التحليلات',       'View Analytics'),
  ('finance.view',           'finance',     'view',       'عرض البيانات المالية', 'View Financial Data'),
  ('finance.manage',         'finance',     'manage',     'إدارة الفوترة',       'Manage Billing'),
  ('support.view',           'support',     'view',       'عرض التذاكر',         'View Tickets'),
  ('support.manage',         'support',     'manage',     'إدارة التذاكر',       'Manage Tickets')
ON CONFLICT (key) DO NOTHING;

-- ─── 3. Assign Permissions to Roles ───

-- Super Admin → ALL permissions
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Operations Admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'operations_admin'
  AND p.key IN (
    'dashboard.view', 'dashboard.analytics',
    'subscribers.view', 'subscribers.update', 'subscribers.suspend',
    'admin_users.view', 'audit_logs.view', 'settings.view',
    'support.view', 'support.manage'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Finance Admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'finance_admin'
  AND p.key IN (
    'dashboard.view', 'dashboard.analytics',
    'subscribers.view', 'finance.view', 'finance.manage', 'audit_logs.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Support Admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'support_admin'
  AND p.key IN (
    'dashboard.view', 'subscribers.view', 'subscribers.update',
    'support.view', 'support.manage', 'audit_logs.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Read-Only Admin
INSERT INTO public.admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.admin_roles r CROSS JOIN public.admin_permissions p
WHERE r.name = 'readonly_admin'
  AND p.key IN (
    'dashboard.view', 'subscribers.view', 'admin_users.view',
    'roles.view', 'settings.view', 'audit_logs.view',
    'finance.view', 'support.view'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ─── 4. Bootstrap First Super Admin ───
-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║ BOOTSTRAP PROCEDURE (must follow these steps IN ORDER):             ║
-- ║                                                                     ║
-- ║ STEP A: Create auth user in Supabase Dashboard → Authentication     ║
-- ║         → Add User → email: admin@sadeem.app, password: <strong>    ║
-- ║         → Copy the UUID shown (this is the auth_uid)                ║
-- ║                                                                     ║
-- ║ STEP B: Replace 'REPLACE_WITH_AUTH_USER_UUID' below with that UUID  ║
-- ║                                                                     ║
-- ║ STEP C: Run this SQL in Supabase SQL Editor                         ║
-- ║                                                                     ║
-- ║ STEP D: Login at /admin/login with admin@sadeem.app                 ║
-- ║         → You will be forced to change password on first login      ║
-- ║                                                                     ║
-- ║ WARNING: Do NOT skip Step A. Without a real auth_uid,               ║
-- ║          the admin CANNOT login. There is no auto-linking.          ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- UNCOMMENT AND EDIT the line below after completing Step A:
--
-- INSERT INTO public.admin_users (
--   auth_uid, email, full_name_ar, full_name_en, role_id, status,
--   is_super_admin, force_password_reset
-- )
-- SELECT
--   'REPLACE_WITH_AUTH_USER_UUID'::UUID,   -- ← paste auth.users UUID here
--   'admin@sadeem.app',
--   'المدير العام',
--   'System Administrator',
--   r.id,
--   'active',
--   true,
--   true
-- FROM public.admin_roles r
-- WHERE r.name = 'super_admin'
--   AND NOT EXISTS (SELECT 1 FROM public.admin_users WHERE is_super_admin = true)
-- ON CONFLICT (email) DO NOTHING;

