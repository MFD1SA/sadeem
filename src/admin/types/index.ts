// ============================================================================
// SENDA Admin — Type Definitions
// Completely independent from subscriber types
// ============================================================================

// --- Database row types ---

export interface AdminRole {
  id: string;
  name: string;
  display_name_ar: string;
  display_name_en: string;
  description_ar: string | null;
  description_en: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminPermission {
  id: string;
  key: string;
  module: string;
  action: string;
  display_name_ar: string;
  display_name_en: string;
  description_ar: string | null;
  description_en: string | null;
  created_at: string;
}

export interface AdminRolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

export type AdminUserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface AdminUser {
  id: string;
  auth_uid: string | null;
  email: string;
  full_name_ar: string;
  full_name_en: string | null;
  avatar_url: string | null;
  phone: string | null;
  role_id: string;
  role?: AdminRole;
  status: AdminUserStatus;
  is_super_admin: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  password_changed_at: string | null;
  force_password_reset: boolean;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AdminAuditLog {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  module: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  severity: AuditSeverity;
  created_at: string;
}

/** Subscriber-side audit log (from audit_logs table) */
export interface SubscriberAuditLog {
  id: string;
  event: string;
  organization_id: string;
  entity_id: string | null;
  entity_type: string | null;
  user_id: string | null;
  actor_type: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminSession {
  id: string;
  admin_user_id: string;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  last_activity_at: string;
}

// --- Auth types ---

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

export interface AdminAuthState {
  user: AdminUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresPasswordReset: boolean;
}

export interface AdminSessionData {
  adminUser: AdminUser;
  permissions: string[];
  expiresAt: string;
}

// --- RBAC types ---

export type PermissionKey = string;

export interface RoleWithPermissions extends AdminRole {
  permissions: AdminPermission[];
}

export interface AdminUserWithRole extends AdminUser {
  role: AdminRole;
}

// --- Form payloads ---

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  full_name_ar: string;
  full_name_en?: string;
  phone?: string;
  role_id: string;
  status?: AdminUserStatus;
}

export interface UpdateAdminUserPayload {
  full_name_ar?: string;
  full_name_en?: string;
  phone?: string;
  role_id?: string;
  status?: AdminUserStatus;
  avatar_url?: string;
}

export interface UpdateAdminProfilePayload {
  full_name_ar?: string;
  full_name_en?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// --- Pagination ---

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// --- UI types ---

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface AdminNavItem {
  id: string;
  label: string;
  path?: string;
  permission?: PermissionKey;
  dividerAfter?: boolean;
}
