// ============================================================================
// SADEEM Admin — Billing & Finance Page (Phase 5)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminBillingService, type BillingOverview, type InvoiceListItem } from '../services/adminBilling.service';
import { adminSubscribersService, type SubscriberListItem } from '../services/adminSubscribers.service';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import {
  CreditCard, FileText, Coins, AlertTriangle,
  Plus, Search, MoreVertical, X, Check, Ban, RotateCcw,
} from 'lucide-react';

const INV_STATUS: Record<string, { ar: string; color: string }> = {
  draft: { ar: 'مسودة', color: 'slate' },
  sent: { ar: 'مُرسلة', color: 'blue' },
  paid: { ar: 'مدفوعة', color: 'emerald' },
  overdue: { ar: 'متأخرة', color: 'red' },
  cancelled: { ar: 'ملغاة', color: 'slate' },
  refunded: { ar: 'مُعادة', color: 'amber' },
};

export default function AdminBilling() {
  const { hasPermission } = useAdminAuth();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Create invoice modal
  const [showCreate, setShowCreate] = useState(false);
  const [orgs, setOrgs] = useState<SubscriberListItem[]>([]);
  const [createForm, setCreateForm] = useState({ org_id: '', plan: 'orbit', subtotal: '', notes: '' });
  const [creating, setCreating] = useState(false);

  // Record payment modal
  const [payTarget, setPayTarget] = useState<InvoiceListItem | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'bank_transfer', reference: '', notes: '' });
  const [paying, setPaying] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type }); setTimeout(() => setMsg(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const [ov, inv] = await Promise.all([
        adminBillingService.getOverview(),
        adminBillingService.listInvoices({ status: filterStatus || undefined }),
      ]);
      setOverview(ov);
      setInvoices(inv.data);
      setTotal(inv.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally { setIsLoading(false); }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreateModal = async () => {
    try {
      const result = await adminSubscribersService.list({ limit: 200 });
      setOrgs(result.data);
      setShowCreate(true);
    } catch { showMsg('فشل في جلب المشتركين', 'error'); }
  };

  const handleCreate = async () => {
    if (!createForm.org_id || !createForm.subtotal) {
      showMsg('يرجى ملء الحقول المطلوبة', 'error'); return;
    }
    setCreating(true);
    try {
      const result = await adminBillingService.createInvoice({
        orgId: createForm.org_id,
        plan: createForm.plan,
        subtotal: parseFloat(createForm.subtotal),
        notes: createForm.notes || undefined,
      });
      showMsg(`تم إنشاء الفاتورة ${result.invoice_number}`, 'success');
      setShowCreate(false);
      setCreateForm({ org_id: '', plan: 'orbit', subtotal: '', notes: '' });
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
    finally { setCreating(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActiveMenu(null);
    try {
      await adminBillingService.updateInvoiceStatus(id, status);
      showMsg('تم تحديث حالة الفاتورة', 'success');
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
  };

  const handlePayment = async () => {
    if (!payTarget || !payForm.amount) return;
    setPaying(true);
    try {
      await adminBillingService.recordPayment({
        invoiceId: payTarget.id,
        amount: parseFloat(payForm.amount),
        method: payForm.method,
        reference: payForm.reference || undefined,
        notes: payForm.notes || undefined,
      });
      showMsg('تم تسجيل الدفعة بنجاح', 'success');
      setPayTarget(null);
      setPayForm({ amount: '', method: 'bank_transfer', reference: '', notes: '' });
      loadData();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
    finally { setPaying(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-400 mb-3">{error}</p>
      <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">المالية والفوترة</h1>
          <p className="text-sm text-slate-400">إدارة الفواتير والمدفوعات</p>
        </div>
        <PermissionGate permission={PERMISSIONS.FINANCE_MANAGE}>
          <button onClick={openCreateModal} className="admin-btn-primary text-sm">
            <Plus size={16} /> إنشاء فاتورة
          </button>
        </PermissionGate>
      </div>

      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OvCard icon={Coins} color="emerald" label="إجمالي الإيرادات"
          value={`${(overview?.total_revenue ?? 0).toLocaleString()} ر.س`} />
        <OvCard icon={CreditCard} color="cyan" label="إيرادات الشهر"
          value={`${(overview?.revenue_this_month ?? 0).toLocaleString()} ر.س`} />
        <OvCard icon={FileText} color="blue" label="مستحقات معلّقة"
          value={`${(overview?.outstanding ?? 0).toLocaleString()} ر.س`} />
        <OvCard icon={AlertTriangle} color="red" label="فواتير متأخرة"
          value={String(overview?.overdue_count ?? 0)} />
      </div>

      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex items-center gap-3">
          <select className="admin-form-input w-auto min-w-[160px]" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="sent">مُرسلة</option>
            <option value="paid">مدفوعة</option>
            <option value="overdue">متأخرة</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <span className="text-xs text-slate-500">{total} فاتورة</span>
        </div>
      </div>

      {/* Invoices table */}
      <div className="admin-card">
        {invoices.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا توجد فواتير</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>المنظمة</th>
                  <th>الخطة</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>تاريخ الاستحقاق</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const si = INV_STATUS[inv.status] || INV_STATUS.draft;
                  return (
                    <tr key={inv.id}>
                      <td><span className="text-sm text-cyan-400 font-mono" dir="ltr">{inv.invoice_number}</span></td>
                      <td><span className="text-sm text-white">{inv.org_name}</span></td>
                      <td><span className="text-sm text-slate-300">{inv.plan}</span></td>
                      <td><span className="text-sm text-white font-medium" dir="ltr">{inv.total.toLocaleString()} {inv.currency}</span></td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                            inv.status === 'overdue' ? 'bg-red-500/10 text-red-400' :
                            inv.status === 'sent' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-slate-500/10 text-slate-400'}`}>{si.ar}</span>
                      </td>
                      <td><span className="text-sm text-slate-500">{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></td>
                      <td>
                        <PermissionGate permission={PERMISSIONS.FINANCE_MANAGE}>
                          <div className="relative">
                            <button onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === inv.id && (
                              <div className="absolute left-0 bottom-full mb-1 w-48 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 z-50">
                                {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                                  <button onClick={() => { setActiveMenu(null); setPayTarget(inv); setPayForm(p => ({ ...p, amount: String(inv.total) })); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                    <Check size={14} /> تسجيل دفعة
                                  </button>
                                )}
                                {inv.status === 'draft' && (
                                  <button onClick={() => handleStatusChange(inv.id, 'sent')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors">
                                    <FileText size={14} /> إرسال الفاتورة
                                  </button>
                                )}
                                {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                                  <button onClick={() => handleStatusChange(inv.id, 'cancelled')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                                    <Ban size={14} /> إلغاء
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </PermissionGate>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <Modal title="إنشاء فاتورة" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">المنظمة *</label>
              <select className="admin-form-input" value={createForm.org_id}
                onChange={(e) => setCreateForm(p => ({ ...p, org_id: e.target.value }))}>
                <option value="">اختر المنظمة</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">الخطة *</label>
              <select className="admin-form-input" value={createForm.plan}
                onChange={(e) => setCreateForm(p => ({ ...p, plan: e.target.value }))}>
                <option value="orbit">مدار</option>
                <option value="nova">نوفا</option>
                <option value="galaxy">جالاكسي</option>
                <option value="infinity">إنفينيتي</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">المبلغ قبل الضريبة (ر.س) *</label>
              <input className="admin-form-input" type="number" dir="ltr" min="0" step="0.01"
                value={createForm.subtotal}
                onChange={(e) => setCreateForm(p => ({ ...p, subtotal: e.target.value }))} />
              {createForm.subtotal && (
                <p className="text-[11px] text-slate-500 mt-1" dir="ltr">
                  + 15% VAT = {(parseFloat(createForm.subtotal) * 1.15).toFixed(2)} SAR
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">ملاحظات</label>
              <input className="admin-form-input" value={createForm.notes}
                onChange={(e) => setCreateForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => setShowCreate(false)} className="admin-btn-secondary text-sm">إلغاء</button>
            <button onClick={handleCreate} disabled={creating} className="admin-btn-primary text-sm">
              {creating ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
            </button>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {payTarget && (
        <Modal title={`تسجيل دفعة — ${payTarget.invoice_number}`} onClose={() => setPayTarget(null)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/[0.03] text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">المبلغ المستحق</span>
                <span className="text-white font-medium" dir="ltr">{payTarget.total.toLocaleString()} {payTarget.currency}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">المبلغ المدفوع (ر.س) *</label>
              <input className="admin-form-input" type="number" dir="ltr" min="0" step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">طريقة الدفع</label>
              <select className="admin-form-input" value={payForm.method}
                onChange={(e) => setPayForm(p => ({ ...p, method: e.target.value }))}>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="credit_card">بطاقة ائتمان</option>
                <option value="mada">مدى</option>
                <option value="stc_pay">STC Pay</option>
                <option value="manual">يدوي</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم المرجع</label>
              <input className="admin-form-input" dir="ltr" value={payForm.reference}
                onChange={(e) => setPayForm(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">ملاحظات</label>
              <input className="admin-form-input" value={payForm.notes}
                onChange={(e) => setPayForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-5">
            <button onClick={() => setPayTarget(null)} className="admin-btn-secondary text-sm">إلغاء</button>
            <button onClick={handlePayment} disabled={paying} className="admin-btn-primary text-sm">
              {paying ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Reusable components ---

function OvCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
        <Icon size={20} className={`text-${color}-400`} />
      </div>
      <div className="text-xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Modal({ title, children, onClose }: {
  title: string; children: React.ReactNode; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
