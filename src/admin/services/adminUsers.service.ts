// ============================================================================
// SADEEM Admin — Admin Users Service (Phase 2)
//
// READ: Protected by RLS (is_active_admin).
// WRITE: ALL writes go through SECURITY DEFINER RPCs that:
//   1. Verify caller is active admin
//   2. Check specific permission (admin_has_permission)
//   3. Perform the operation
//   4. Write audit log
// NO direct INSERT/UPDATE/DELETE from client to admin_users.
// ============================================================================

import { adminSupabase } from './adminSupabase';
import type {
  AdminUserWithRole,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  PaginationParams,
  PaginatedResult,
} from '../types';

class AdminUsersService {
  private static instance: AdminUsersService;
  static getInstance(): AdminUsersService {
    if (!AdminUsersService.instance) {
      AdminUsersService.instance = new AdminUsersService();
    }
    return AdminUsersService.instance;
  }

  /** List admin users — protected by RLS */
  async list(params: PaginationParams): Promise<PaginatedResult<AdminUserWithRole>> {
    const { page, pageSize, search, sortBy = 'created_at', sortOrder = 'desc' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminSupabase
      .from('admin_users')
      .select('*, role:admin_roles(*)', { count: 'exact' })
      .is('deleted_at', null);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name_ar.ilike.%${search}%,full_name_en.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error('فشل في جلب قائمة المشرفين: ' + error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminUserWithRole[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** Get admin by ID — protected by RLS */
  async getById(id: string): Promise<AdminUserWithRole | null> {
    const { data, error } = await adminSupabase
      .from('admin_users')
      .select('*, role:admin_roles(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) return null;
    return data as AdminUserWithRole;
  }

  /** Get status counts — protected by RLS */
  async getStatusCounts(): Promise<Record<string, number>> {
    const { data, error } = await adminSupabase
      .from('admin_users')
      .select('status')
      .is('deleted_at', null);

    if (error) return {};
    const counts: Record<string, number> = { active: 0, inactive: 0, suspended: 0, pending: 0, total: 0 };
    (data ?? []).forEach((u: { status: string }) => {
      counts[u.status] = (counts[u.status] || 0) + 1;
      counts.total += 1;
    });
    return counts;
  }

  // ═══════════════════════════════════════════════════
  // WRITE OPERATIONS
  // - CREATE: via Edge Function (uses service_role for auth.admin.createUser)
  // - UPDATE/DEACTIVATE/ACTIVATE/DELETE: via SECURITY DEFINER RPCs
  // Permission checks happen INSIDE the DB/Edge Function.
  // ═══════════════════════════════════════════════════

  /**
   * Create admin user via Edge Function.
   *
   * Flow:
   * 1. Frontend calls Edge Function with caller's JWT
   * 2. Edge Function: RPC admin_verify_create_permission (caller's JWT → DB permission check)
   * 3. Edge Function: supabase.auth.admin.createUser (service_role → auth user)
   * 4. Edge Function: RPC admin_insert_admin_user (caller's JWT → admin_users row + audit)
   *
   * service_role key is ONLY inside the Edge Function, never on client.
   */
  async create(payload: CreateAdminUserPayload): Promise<{ id: string; email: string }> {
    // Get current session for JWT
    const { data: { session } } = await adminSupabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('جلسة غير صالحة');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) throw new Error('Missing SUPABASE_URL');

    const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        full_name_ar: payload.full_name_ar,
        full_name_en: payload.full_name_en ?? null,
        phone: payload.phone ?? null,
        role_id: payload.role_id ?? null,
      }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      const msg = result.error || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية إنشاء مشرفين');
      if (msg.includes('Email already exists')) throw new Error('البريد الإلكتروني مستخدم مسبقاً');
      if (msg.includes('super_admin')) throw new Error('لا يمكن تعيين دور المدير العام عبر هذه الواجهة');
      throw new Error('فشل في إنشاء المشرف: ' + msg);
    }

    return result.data as { id: string; email: string };
  }

  /** Update admin user via RPC — DB checks admin_users.update permission */
  async update(targetId: string, payload: UpdateAdminUserPayload): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_manage_update_user', {
      p_target_id: targetId,
      p_full_name_ar: payload.full_name_ar ?? null,
      p_full_name_en: payload.full_name_en ?? null,
      p_phone: payload.phone ?? null,
      p_role_id: payload.role_id ?? null,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل المشرفين');
      if (msg.includes('super_admin')) throw new Error('لا يمكن تعديل/تعيين دور المدير العام');
      throw new Error('فشل في تعديل المشرف: ' + msg);
    }
  }

  /** Deactivate admin user via RPC — DB checks admin_users.deactivate permission */
  async deactivate(targetId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_manage_deactivate_user', {
      p_target_id: targetId,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعطيل المشرفين');
      if (msg.includes('yourself')) throw new Error('لا يمكنك تعطيل حسابك الخاص');
      if (msg.includes('super_admin')) throw new Error('لا يمكن تعطيل المدير العام');
      throw new Error('فشل في تعطيل المشرف: ' + msg);
    }
  }

  /** Activate admin user via RPC — DB checks admin_users.update permission */
  async activate(targetId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_manage_activate_user', {
      p_target_id: targetId,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تفعيل المشرفين');
      throw new Error('فشل في تفعيل المشرف: ' + msg);
    }
  }

  /** Soft delete admin user via RPC — DB checks admin_users.delete permission */
  async softDelete(targetId: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_manage_soft_delete_user', {
      p_target_id: targetId,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية حذف المشرفين');
      if (msg.includes('yourself')) throw new Error('لا يمكنك حذف حسابك الخاص');
      if (msg.includes('super_admin')) throw new Error('لا يمكن حذف المدير العام');
      throw new Error('فشل في حذف المشرف: ' + msg);
    }
  }
}

export const adminUsersService = AdminUsersService.getInstance();
