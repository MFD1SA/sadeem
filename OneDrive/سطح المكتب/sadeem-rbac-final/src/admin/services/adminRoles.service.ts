// ============================================================================
// SADEEM Admin — Roles & Permissions Service (Phase 3)
//
// READ: via RLS (is_active_admin) + RPC for detail views
// WRITE: via SECURITY DEFINER RPCs with permission checks inside DB
// ============================================================================

import { adminSupabase } from './adminSupabase';
import type { AdminRole, AdminPermission } from '../types';

interface RolePermissionsResult {
  role: AdminRole;
  permissions: AdminPermission[];
}

class AdminRolesService {
  private static instance: AdminRolesService;
  static getInstance(): AdminRolesService {
    if (!AdminRolesService.instance) {
      AdminRolesService.instance = new AdminRolesService();
    }
    return AdminRolesService.instance;
  }

  /** List all roles — protected by RLS */
  async listRoles(): Promise<AdminRole[]> {
    const { data, error } = await adminSupabase
      .from('admin_roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw new Error('فشل في جلب الأدوار: ' + error.message);
    return (data ?? []) as AdminRole[];
  }

  /** Get role with permissions via RPC */
  async getRoleWithPermissions(roleId: string): Promise<RolePermissionsResult | null> {
    const { data, error } = await adminSupabase.rpc('admin_get_role_permissions', {
      p_role_id: roleId,
    });
    if (error) throw new Error('فشل في جلب صلاحيات الدور: ' + error.message);
    if (!data) return null;
    const result = data as { role: AdminRole; permissions: AdminPermission[] };
    return { role: result.role, permissions: result.permissions || [] };
  }

  /** List ALL permissions via RPC — permission-checked server-side */
  async listAllPermissions(): Promise<AdminPermission[]> {
    const { data, error } = await adminSupabase.rpc('admin_list_all_permissions');
    if (error) throw new Error('فشل في جلب الصلاحيات: ' + error.message);
    return (data as AdminPermission[]) ?? [];
  }

  /** List permissions grouped by module */
  async listPermissionsGrouped(): Promise<Record<string, AdminPermission[]>> {
    const permissions = await this.listAllPermissions();
    const grouped: Record<string, AdminPermission[]> = {};
    permissions.forEach((p) => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });
    return grouped;
  }

  /** Get user count per role — protected by RLS */
  async getRoleUserCounts(): Promise<Record<string, number>> {
    const { data, error } = await adminSupabase
      .from('admin_users')
      .select('role_id')
      .is('deleted_at', null);

    if (error) return {};
    const counts: Record<string, number> = {};
    (data ?? []).forEach((u: { role_id: string }) => {
      counts[u.role_id] = (counts[u.role_id] || 0) + 1;
    });
    return counts;
  }

  // ═══════════════════════════════════════════════════
  // WRITE OPERATIONS — via RPCs
  // ═══════════════════════════════════════════════════

  /** Assign role to admin user — DB checks roles.assign permission */
  async assignRole(targetUserId: string, newRoleId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_assign_role', {
      p_target_user_id: targetUserId,
      p_new_role_id: newRoleId,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعيين الأدوار');
      if (msg.includes('super_admin')) throw new Error('لا يمكن تعديل أو تعيين دور المدير العام');
      if (msg.includes('your own role')) throw new Error('لا يمكنك تغيير دورك');
      throw new Error('فشل في تعيين الدور: ' + msg);
    }
  }

  /** Update role permissions — DB checks roles.update permission */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<{ oldCount: number; newCount: number }> {
    const { data, error } = await adminSupabase.rpc('admin_update_role_perms', {
      p_role_id: roleId,
      p_permission_ids: permissionIds,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل الأدوار');
      if (msg.includes('super_admin')) throw new Error('لا يمكن تعديل صلاحيات المدير العام');
      if (msg.includes('system role')) throw new Error('فقط المدير العام يمكنه تعديل صلاحيات الأدوار النظامية');
      throw new Error('فشل في تحديث الصلاحيات: ' + msg);
    }
    const result = data as { old_count: number; new_count: number } | null;
    return { oldCount: result?.old_count ?? 0, newCount: result?.new_count ?? 0 };
  }
}

export const adminRolesService = AdminRolesService.getInstance();
