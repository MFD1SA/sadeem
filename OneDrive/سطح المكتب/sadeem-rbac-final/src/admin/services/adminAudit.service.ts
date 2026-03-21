// ============================================================================
// SADEEM Admin — Audit Logs Service (Hardened)
// READ: Protected by RLS admin_audit_select — only active admins.
// WRITE: Via RPC admin_write_audit_log() — SECURITY DEFINER.
// ============================================================================

import { adminSupabase } from './adminSupabase';
import type { AdminAuditLog, PaginationParams, PaginatedResult } from '../types';

class AdminAuditService {
  private static instance: AdminAuditService;
  static getInstance(): AdminAuditService {
    if (!AdminAuditService.instance) {
      AdminAuditService.instance = new AdminAuditService();
    }
    return AdminAuditService.instance;
  }

  /** List audit logs — protected by RLS */
  async list(
    params: PaginationParams & { module?: string; severity?: string }
  ): Promise<PaginatedResult<AdminAuditLog>> {
    const { page, pageSize, search, module, severity, sortOrder = 'desc' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminSupabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`action.ilike.%${search}%,admin_email.ilike.%${search}%`);
    }
    if (module) query = query.eq('module', module);
    if (severity) query = query.eq('severity', severity);

    query = query.order('created_at', { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error('فشل في جلب سجل العمليات: ' + error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminAuditLog[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** Write audit log via RPC — enforced server-side */
  async log(action: string, module: string, severity = 'info', details?: Record<string, unknown>): Promise<void> {
    await adminSupabase.rpc('admin_write_audit_log', {
      p_action: action,
      p_module: module,
      p_severity: severity,
      p_details: details ?? null,
    });
  }
}

export const adminAuditService = AdminAuditService.getInstance();
