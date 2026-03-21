// ============================================================================
// SADEEM Admin — Billing & Finance Service (Phase 5)
// All operations via SECURITY DEFINER RPCs.
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface BillingOverview {
  total_revenue: number;
  revenue_this_month: number;
  outstanding: number;
  overdue_count: number;
  invoice_counts: Record<string, number>;
  subscription_status: Record<string, number>;
  plan_revenue: Record<string, number>;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  organization_id: string;
  org_name: string;
  plan: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
}

class AdminBillingService {
  private static instance: AdminBillingService;
  static getInstance(): AdminBillingService {
    if (!AdminBillingService.instance) {
      AdminBillingService.instance = new AdminBillingService();
    }
    return AdminBillingService.instance;
  }

  async getOverview(): Promise<BillingOverview> {
    const { data, error } = await adminSupabase.rpc('admin_get_billing_overview');
    if (error) throw new Error('فشل في جلب نظرة المالية: ' + error.message);
    return data as BillingOverview;
  }

  async listInvoices(params: {
    orgId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: InvoiceListItem[]; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_list_invoices', {
      p_org_id: params.orgId ?? null,
      p_status: params.status ?? null,
      p_limit: params.limit ?? 50,
      p_offset: params.offset ?? 0,
    });
    if (error) throw new Error('فشل في جلب الفواتير: ' + error.message);
    const result = data as { data: InvoiceListItem[]; total: number };
    return { data: result.data ?? [], total: result.total ?? 0 };
  }

  async createInvoice(params: {
    orgId: string;
    plan: string;
    subtotal: number;
    taxRate?: number;
    billingStart?: string;
    billingEnd?: string;
    dueDate?: string;
    notes?: string;
  }): Promise<{ id: string; invoice_number: string; total: number }> {
    const { data, error } = await adminSupabase.rpc('admin_create_invoice', {
      p_org_id: params.orgId,
      p_plan: params.plan,
      p_subtotal: params.subtotal,
      p_tax_rate: params.taxRate ?? 15.00,
      p_billing_start: params.billingStart ?? null,
      p_billing_end: params.billingEnd ?? null,
      p_due_date: params.dueDate ?? null,
      p_notes: params.notes ?? null,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية إنشاء الفواتير');
      throw new Error('فشل في إنشاء الفاتورة: ' + msg);
    }
    return data as { id: string; invoice_number: string; total: number };
  }

  async updateInvoiceStatus(invoiceId: string, status: string): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_update_invoice_status', {
      p_invoice_id: invoiceId,
      p_status: status,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تعديل الفواتير');
      throw new Error('فشل في تحديث حالة الفاتورة: ' + msg);
    }
  }

  async recordPayment(params: {
    invoiceId: string;
    amount: number;
    method?: string;
    reference?: string;
    notes?: string;
  }): Promise<string> {
    const { data, error } = await adminSupabase.rpc('admin_record_payment', {
      p_invoice_id: params.invoiceId,
      p_amount: params.amount,
      p_method: params.method ?? 'manual',
      p_reference: params.reference ?? null,
      p_notes: params.notes ?? null,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Permission denied')) throw new Error('ليس لديك صلاحية تسجيل المدفوعات');
      throw new Error('فشل في تسجيل الدفعة: ' + msg);
    }
    return data as string;
  }
}

export const adminBillingService = AdminBillingService.getInstance();
