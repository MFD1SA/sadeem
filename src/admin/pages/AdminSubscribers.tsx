// ============================================================================
// SADEEM Admin — Subscribers Page (Phase 4)
// All data via RPCs. Permission checks in DB.
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSubscribersService, type SubscriberListItem, type SubscriberDetail } from '../services/adminSubscribers.service';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import {
  Building2, Search, ChevronLeft, Users, GitBranch,
  MessageSquare, Zap, FileText, MoreVertical,
  Pause, Play, ArrowUpCircle, X,
} from 'lucide-react';

const PLAN_LABELS: Record<string, { ar: string; color: string }> = {
  starter: { ar: 'المبتدئ', color: 'slate' },
  growth: { ar: 'النمو', color: 'blue' },
  pro: { ar: 'الاحترافي', color: 'purple' },
  enterprise: { ar: 'المؤسسات', color: 'amber' },
};

const SUB_STATUS: Record<string, { ar: string; color: string }> = {
  active: { ar: 'نشط', color: 'emerald' },
  trial: { ar: 'تجريبي', color: 'blue' },
  expired: { ar: 'منتهي', color: 'red' },
  cancelled: { ar: 'ملغي', color: 'slate' },
};

export default function AdminSubscribers() {
  const { hasPermission } = useAdminAuth();
  const [items, setItems] = useState<SubscriberListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Detail
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Actions
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Plan change modal
  const [planTarget, setPlanTarget] = useState<SubscriberListItem | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await adminSubscribersService.list({
        search: search || undefined,
        plan: filterPlan || undefined,
        status: filterStatus || undefined,
      });
      setItems(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [search, filterPlan, filterStatus]);

  useEffect(() => { loadList(); }, [loadList]);

  const viewDetail = async (orgId: string) => {
    setDetailLoading(true);
    try {
      const d = await adminSubscribersService.getDetail(orgId);
      setDetail(d);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuspend = async (orgId: string) => {
    setActiveMenu(null);
    if (!confirm('هل أنت متأكد من إيقاف هذا المشترك؟')) return;
    try {
      await adminSubscribersService.suspend(orgId);
      showMsg('تم إيقاف المشترك', 'success');
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
  };

  const handleReactivate = async (orgId: string) => {
    setActiveMenu(null);
    try {
      await adminSubscribersService.reactivate(orgId);
      showMsg('تم إعادة تفعيل المشترك', 'success');
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
  };

  const handleChangePlan = async () => {
    if (!planTarget || !newPlan) return;
    setChangingPlan(true);
    try {
      await adminSubscribersService.updateSubscription(planTarget.id, { plan: newPlan });
      showMsg('تم تغيير الخطة بنجاح', 'success');
      setPlanTarget(null);
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
    finally { setChangingPlan(false); }
  };

  // ─── Detail View ───
  if (detail) {
    const sub = detail.subscription;
    const planInfo = PLAN_LABELS[sub?.plan ?? ''] || PLAN_LABELS.starter;
    const statusInfo = SUB_STATUS[sub?.status ?? ''] || SUB_STATUS.expired;

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setDetail(null)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">{detail.organization.name}</h1>
            <p className="text-sm text-slate-400">{detail.organization.slug} — {detail.organization.industry || 'غير محدد'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Subscription card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>الاشتراك</h3></div>
            <div className="admin-card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">الخطة</span>
                <span className={`text-${planInfo.color}-400 font-medium`}>{planInfo.ar}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الحالة</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                  ${sub?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                    sub?.status === 'trial' ? 'bg-blue-500/10 text-blue-400' :
                    sub?.status === 'cancelled' ? 'bg-slate-500/10 text-slate-400' :
                    'bg-red-500/10 text-red-400'}`}>
                  {statusInfo.ar}
                </span>
              </div>
              {sub?.ends_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ينتهي في</span>
                  <span className="text-slate-300">{new Date(sub.ends_at).toLocaleDateString('ar-SA')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Usage card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>الاستهلاك</h3></div>
            <div className="admin-card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Zap size={14} /> ردود AI</span>
                <span className="text-white font-medium">{sub?.ai_replies_used ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><FileText size={14} /> ردود القوالب</span>
                <span className="text-white font-medium">{sub?.template_replies_used ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><MessageSquare size={14} /> التقييمات</span>
                <span className="text-white font-medium">{detail.stats.total_reviews}</span>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>إحصائيات</h3></div>
            <div className="admin-card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><GitBranch size={14} /> الفروع النشطة</span>
                <span className="text-white font-medium">{detail.stats.active_branches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Users size={14} /> الأعضاء</span>
                <span className="text-white font-medium">{detail.members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تقييمات هذا الشهر</span>
                <span className="text-white font-medium">{detail.stats.reviews_this_month}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="admin-card mb-4">
          <div className="admin-card-header"><h3>المالك</h3></div>
          <div className="admin-card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                {detail.owner.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="text-sm text-white font-medium">{detail.owner.full_name}</div>
                <div className="text-xs text-slate-500" dir="ltr">{detail.owner.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="admin-card mb-4">
          <div className="admin-card-header">
            <h3>الفروع ({detail.branches.length})</h3>
          </div>
          <div className="admin-card-body">
            {detail.branches.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">لا توجد فروع</p>
            ) : (
              <div className="space-y-2">
                {detail.branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                    <div>
                      <div className="text-sm text-white">{b.internal_name}</div>
                      <div className="text-xs text-slate-500">{b.city || '—'}</div>
                    </div>
                    <span className={`text-xs ${b.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {b.status === 'active' ? 'نشط' : b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Members */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>الأعضاء ({detail.members.length})</h3>
          </div>
          <div className="admin-card-body">
            <div className="space-y-2">
              {detail.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                  <div>
                    <div className="text-sm text-white">{m.full_name}</div>
                    <div className="text-xs text-slate-500" dir="ltr">{m.email}</div>
                  </div>
                  <span className="text-xs text-slate-400">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">إدارة المشتركين</h1>
        <p className="text-sm text-slate-400">عرض وإدارة جميع المشتركين في المنصة ({total} مشترك)</p>
      </div>

      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>{msg.text}</div>
      )}

      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="بحث بالاسم..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadList()}
              className="admin-form-input pr-9" />
          </div>
          <select className="admin-form-input w-auto min-w-[140px]" value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}>
            <option value="">كل الخطط</option>
            <option value="starter">المبتدئ</option>
            <option value="growth">النمو</option>
            <option value="pro">الاحترافي</option>
            <option value="enterprise">المؤسسات</option>
          </select>
          <select className="admin-form-input w-auto min-w-[140px]" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="trial">تجريبي</option>
            <option value="expired">منتهي</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        {isLoading || detailLoading ? (
          <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadList} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا يوجد مشتركين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المنظمة</th>
                  <th>الخطة</th>
                  <th>الحالة</th>
                  <th>الفروع</th>
                  <th>AI</th>
                  <th>التقييمات</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const planInfo = PLAN_LABELS[item.subscription?.plan ?? ''] || PLAN_LABELS.starter;
                  const statusInfo = SUB_STATUS[item.subscription?.status ?? ''] || SUB_STATUS.expired;
                  const subStatus = item.subscription?.status ?? 'expired';

                  return (
                    <tr key={item.id} className="cursor-pointer" onClick={() => viewDetail(item.id)}>
                      <td>
                        <div>
                          <div className="text-sm text-white font-medium">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.owner_name} — {item.owner_email}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-medium text-${planInfo.color}-400`}>{planInfo.ar}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${subStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            subStatus === 'trial' ? 'bg-blue-500/10 text-blue-400' :
                            subStatus === 'cancelled' ? 'bg-slate-500/10 text-slate-400' :
                            'bg-red-500/10 text-red-400'}`}>
                          {statusInfo.ar}
                        </span>
                      </td>
                      <td><span className="text-sm text-slate-300">{item.branch_count}</span></td>
                      <td><span className="text-sm text-slate-300">{item.subscription?.ai_replies_used ?? 0}</span></td>
                      <td><span className="text-sm text-slate-300">{item.review_count}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
                          <div className="relative">
                            <button onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === item.id && (
                              <div className="absolute left-0 top-full mt-1 w-48 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 z-50">
                                <button onClick={() => { setActiveMenu(null); setPlanTarget(item); setNewPlan(item.subscription?.plan || 'starter'); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                                  <ArrowUpCircle size={14} /> تغيير الخطة
                                </button>
                                {(subStatus === 'active' || subStatus === 'trial') ? (
                                  <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_SUSPEND}>
                                    <button onClick={() => handleSuspend(item.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                                      <Pause size={14} /> إيقاف الاشتراك
                                    </button>
                                  </PermissionGate>
                                ) : (
                                  <button onClick={() => handleReactivate(item.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                                    <Play size={14} /> إعادة تفعيل
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Change Modal */}
      {planTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPlanTarget(null); }}>
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">تغيير الخطة</h2>
              <button onClick={() => setPlanTarget(null)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">تغيير خطة "{planTarget.name}"</p>
              <select className="admin-form-input" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
                <option value="starter">المبتدئ</option>
                <option value="growth">النمو</option>
                <option value="pro">الاحترافي</option>
                <option value="enterprise">المؤسسات</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
              <button onClick={() => setPlanTarget(null)} className="admin-btn-secondary text-sm">إلغاء</button>
              <button onClick={handleChangePlan} disabled={changingPlan || newPlan === planTarget.subscription?.plan}
                className="admin-btn-primary text-sm">
                {changingPlan ? 'جاري التغيير...' : 'تغيير الخطة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
