// ============================================================================
// SADEEM Admin — Constants
// ============================================================================

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  ROOT: '/admin',
  DASHBOARD: '/admin/dashboard',
  ADMINS: '/admin/admins',
  ROLES: '/admin/roles',
  SUBSCRIBERS: '/admin/subscribers',
  BILLING: '/admin/billing',
  AI_USAGE: '/admin/ai-usage',
  PAYMENT_GATEWAY: '/admin/payment-gateway',
  SETTINGS: '/admin/settings',
  PROFILE: '/admin/profile',
  SECURITY: '/admin/security',
  AUDIT_LOGS: '/admin/audit-logs',
} as const;

export const PERMISSIONS = {
  ADMIN_USERS_VIEW: 'admin_users.view',
  ADMIN_USERS_CREATE: 'admin_users.create',
  ADMIN_USERS_UPDATE: 'admin_users.update',
  ADMIN_USERS_DEACTIVATE: 'admin_users.deactivate',
  ADMIN_USERS_DELETE: 'admin_users.delete',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN: 'roles.assign',
  SUBSCRIBERS_VIEW: 'subscribers.view',
  SUBSCRIBERS_UPDATE: 'subscribers.update',
  SUBSCRIBERS_SUSPEND: 'subscribers.suspend',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  AUDIT_LOGS_EXPORT: 'audit_logs.export',
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ANALYTICS: 'dashboard.analytics',
  FINANCE_VIEW: 'finance.view',
  FINANCE_MANAGE: 'finance.manage',
  SUPPORT_VIEW: 'support.view',
  SUPPORT_MANAGE: 'support.manage',
} as const;

export const ROLE_NAMES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS_ADMIN: 'operations_admin',
  FINANCE_ADMIN: 'finance_admin',
  SUPPORT_ADMIN: 'support_admin',
  READONLY_ADMIN: 'readonly_admin',
} as const;

export const SESSION_CONFIG = {
  TOKEN_KEY: 'sadeem_admin_token',
  SESSION_DURATION_HOURS: 8,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
} as const;

export const STATUS_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  active: { ar: 'نشط', en: 'Active', color: 'emerald' },
  inactive: { ar: 'غير نشط', en: 'Inactive', color: 'slate' },
  suspended: { ar: 'معلّق', en: 'Suspended', color: 'amber' },
  pending: { ar: 'قيد الانتظار', en: 'Pending', color: 'blue' },
};
