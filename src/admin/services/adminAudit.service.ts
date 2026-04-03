// ============================================================================
// SADEEM Admin — Audit Logs Service (Hardened)
// READ: Protected by RLS admin_audit_select — only active admins.
// WRITE: Via RPC admin_write_audit_log() — SECURITY DEFINER.
// ============================================================================

import { adminSupabase } from './adminSupabase';
import type { AdminAuditLog, SubscriberAuditLog, PaginationParams, PaginatedResult } from '../types';

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

  /** List subscriber audit logs from audit_logs table — protected by RLS is_active_admin() */
  async listSubscriberAudit(
    params: PaginationParams & { event?: string; actorType?: string; organizationId?: string }
  ): Promise<PaginatedResult<SubscriberAuditLog>> {
    const { page, pageSize, search, event, actorType, organizationId, sortOrder = 'desc' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = adminSupabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`event.ilike.%${search}%,entity_type.ilike.%${search}%`);
    }
    if (event) query = query.eq('event', event);
    if (actorType) query = query.eq('actor_type', actorType);
    if (organizationId) query = query.eq('organization_id', organizationId);

    query = query.order('created_at', { ascending: sortOrder === 'asc' }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error('فشل في جلب سجل عمليات المشتركين: ' + error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as SubscriberAuditLog[],
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
