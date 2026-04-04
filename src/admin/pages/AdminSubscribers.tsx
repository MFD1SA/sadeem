// ============================================================================
// SENDA Admin — Subscribers Page (Phase 4)
// All data via RPCs. Permission checks in DB.
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSubscribersService, type SubscriberListItem, type SubscriberDetail } from '../services/adminSubscribers.service';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import {
  Building2, Search, ChevronLeft, ChevronRight, Users, GitBranch,
  MessageSquare, Zap, FileText, MoreVertical, Edit3,
  Pause, Play, ArrowUpCircle, X, Calendar, RefreshCw, Check, Trash2,
} from 'lucide-react';
import { AdminSelect } from '../components/AdminSelect';

const PLAN_LABELS: Record<string, { ar: string; color: string; textClass: string }> = {
  orbit:      { ar: 'مدار',      color: 'blue',    textClass: 'text-blue-600' },
  nova:       { ar: 'نوفا',      color: 'violet',  textClass: 'text-violet-600' },
  galaxy:     { ar: 'جالكسي',  color: 'amber',   textClass: 'text-amber-600' },
  infinity:   { ar: 'إنفينيتي', color: 'emerald', textClass: 'text-emerald-600' },
  // Legacy plan IDs → mapped to new display names
  starter:    { ar: 'مدار',      color: 'blue',    textClass: 'text-blue-600' },
  growth:     { ar: 'نوفا',      color: 'violet',  textClass: 'text-violet-600' },
  pro:        { ar: 'جالكسي',  color: 'amber',   textClass: 'text-amber-600' },
  enterprise: { ar: 'إنفينيتي', color: 'emerald', textClass: 'text-emerald-600' },
};

// Map legacy plan IDs to new plan IDs
const LEGACY_PLAN_MAP: Record<string, string> = {
  starter: 'orbit', growth: 'nova', pro: 'galaxy', enterprise: 'infinity',
};
const normalizePlan = (plan: string) => LEGACY_PLAN_MAP[plan] || plan;

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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Detail
  const [detail, setDetail] = useState<SubscriberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Actions
  const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number; openUp?: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setActiveMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [activeMenu]);

  // Plan change modal
  const [planTarget, setPlanTarget] = useState<SubscriberListItem | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [changingPlan, setChangingPlan] = useState(false);

  // Edit org info modal
  const [editOrgTarget, setEditOrgTarget] = useState<SubscriberDetail | null>(null);
  const [editOrgForm, setEditOrgForm] = useState({ name: '', industry: '', city: '', country: '' });
  const [savingOrg, setSavingOrg] = useState(false);

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
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setItems(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [search, filterPlan, filterStatus, page]);

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
      // Also set status to 'active' so subscriber doesn't see "expired" after plan change
      await adminSubscribersService.updateSubscription(planTarget.id, { plan: newPlan, status: 'active' });
      showMsg('تم تغيير الخطة بنجاح', 'success');
      setPlanTarget(null);
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
    finally { setChangingPlan(false); }
  };

  const handleExtendSub = async (item: SubscriberListItem) => {
    setActiveMenu(null);
    if (!confirm(`تمديد اشتراك "${item.name}" لمدة 30 يوم إضافية؟`)) return;
    try {
      const newEnd = new Date();
      const currentEnd = item.subscription?.ends_at ? new Date(item.subscription.ends_at) : new Date();
      if (currentEnd > newEnd) newEnd.setTime(currentEnd.getTime());
      newEnd.setDate(newEnd.getDate() + 30);
      await adminSubscribersService.updateSubscription(item.id, {
        status: 'active',
        ends_at: newEnd.toISOString(),
      });
      showMsg('تم تمديد الاشتراك 30 يوم', 'success');
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
  };

  const handleResetAI = async (orgId: string) => {
    setActiveMenu(null);
    if (!confirm('إعادة تعيين عداد استهلاك AI لهذا المشترك؟')) return;
    try {
      await adminSubscribersService.resetAIUsage(orgId);
      showMsg('تم إعادة تعيين استهلاك AI', 'success');
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
  };

  // Delete subscriber
  const [deleteTarget, setDeleteTarget] = useState<SubscriberListItem | null>(null);
  const [deletingSubscriber, setDeletingSubscriber] = useState(false);

  const handleDeleteSubscriber = async () => {
    if (!deleteTarget) return;
    setDeletingSubscriber(true);
    try {
      await adminSubscribersService.deleteSubscriber(deleteTarget.id);
      showMsg(`تم حذف المشترك "${deleteTarget.name}" بنجاح`, 'success');
      setDeleteTarget(null);
      loadList();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل في حذف المشترك', 'error');
    } finally {
      setDeletingSubscriber(false);
    }
  };

  const openEditOrg = (d: SubscriberDetail) => {
    setEditOrgTarget(d);
    setEditOrgForm({
      name: d.organization.name || '',
      industry: d.organization.industry || '',
      city: d.organization.city || '',
      country: d.organization.country || '',
    });
  };

  const handleSaveOrgInfo = async () => {
    if (!editOrgTarget) return;
    setSavingOrg(true);
    try {
      await adminSubscribersService.updateOrgInfo(editOrgTarget.organization.id, editOrgForm);
      showMsg('تم تحديث بيانات المشترك بنجاح', 'success');
      setEditOrgTarget(null);
      // Reload detail
      const d = await adminSubscribersService.getDetail(editOrgTarget.organization.id);
      setDetail(d);
      loadList();
    } catch (err) { showMsg(err instanceof Error ? err.message : 'فشل', 'error'); }
    finally { setSavingOrg(false); }
  };

  // ─── Detail View ───
  if (detail) {
    const sub = detail.subscription;
    const planInfo = PLAN_LABELS[sub?.plan ?? ''] || PLAN_LABELS.orbit;
    const statusInfo = SUB_STATUS[sub?.status ?? ''] || SUB_STATUS.expired;

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setDetail(null)}
            className="p-2 rounded-lg text-slate-400 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{detail.organization.name}</h1>
            <p className="text-sm text-slate-400">{detail.organization.slug} — {detail.organization.industry || 'غير محدد'}</p>
          </div>
          {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
            <button onClick={() => openEditOrg(detail)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-cyan-600 hover:bg-cyan-500/10 border border-cyan-200 transition-colors">
              <Edit3 size={14} /> تعديل البيانات
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Subscription card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>الاشتراك</h3></div>
            <div className="admin-card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">الخطة</span>
                <span className={`${planInfo.textClass} font-medium`}>{planInfo.ar}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الحالة</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                  ${sub?.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                    sub?.status === 'trial' ? 'bg-blue-500/10 text-blue-600' :
                    sub?.status === 'cancelled' ? 'bg-slate-500/10 text-slate-600' :
                    'bg-red-500/10 text-red-600'}`}>
                  {statusInfo.ar}
                </span>
              </div>
              {sub?.ends_at && (
                <div className="flex justify-between">
                  <span className="text-slate-400">ينتهي في</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{new Date(sub.ends_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {new Date(sub.ends_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                      <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">قريب</span>
                    )}
                  </div>
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
                <span className="text-gray-900 font-medium">{sub?.ai_replies_used ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><FileText size={14} /> ردود القوالب</span>
                <span className="text-gray-900 font-medium">{sub?.template_replies_used ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><MessageSquare size={14} /> التقييمات</span>
                <span className="text-gray-900 font-medium">{detail.stats.total_reviews}</span>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>إحصائيات</h3></div>
            <div className="admin-card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><GitBranch size={14} /> الفروع النشطة</span>
                <span className="text-gray-900 font-medium">{detail.stats.active_branches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Users size={14} /> الأعضاء</span>
                <span className="text-gray-900 font-medium">{detail.members.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تقييمات هذا الشهر</span>
                <span className="text-gray-900 font-medium">{detail.stats.reviews_this_month}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="admin-card mb-4">
          <div className="admin-card-header"><h3>المالك</h3></div>
          <div className="admin-card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-bold">
                {detail.owner.full_name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="text-sm text-gray-900 font-medium">{detail.owner.full_name}</div>
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
                  <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div>
                      <div className="text-sm text-gray-900">{b.internal_name}</div>
                      <div className="text-xs text-slate-500">{b.city || '—'}</div>
                    </div>
                    <span className={`text-xs ${b.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                <div key={m.user_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="text-sm text-gray-900">{m.full_name}</div>
                    <div className="text-xs text-slate-500" dir="ltr">{m.email}</div>
                  </div>
                  <span className="text-xs text-slate-400">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Org Info Modal */}
        {editOrgTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-bold text-gray-900">تعديل بيانات المشترك</h3>
                <button onClick={() => setEditOrgTarget(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المشترك</label>
                  <input type="text" className="admin-form-input w-full" value={editOrgForm.name}
                    onChange={(e) => setEditOrgForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القطاع</label>
                  <input type="text" className="admin-form-input w-full" placeholder="مطاعم، صحة، تجزئة..."
                    value={editOrgForm.industry}
                    onChange={(e) => setEditOrgForm(f => ({ ...f, industry: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                    <input type="text" className="admin-form-input w-full" value={editOrgForm.city}
                      onChange={(e) => setEditOrgForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البلد</label>
                    <input type="text" className="admin-form-input w-full" value={editOrgForm.country}
                      onChange={(e) => setEditOrgForm(f => ({ ...f, country: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="p-5 border-t flex items-center gap-3">
                <button onClick={handleSaveOrgInfo} disabled={savingOrg}
                  className="admin-btn-primary flex items-center gap-2">
                  <Check size={14} /> {savingOrg ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button onClick={() => setEditOrgTarget(null)} className="admin-btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ───
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">إدارة المشتركين</h1>
        <p className="text-sm text-slate-400">عرض وإدارة جميع المشتركين في المنصة ({total} مشترك)</p>
      </div>

      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
            : 'bg-red-500/10 border border-red-500/20 text-red-600'
        }`}>{msg.text}</div>
      )}

      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="بحث بالاسم..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && loadList()}
              className="admin-form-input pr-9" />
          </div>
          <AdminSelect wrapperClassName="w-auto min-w-[140px]" value={filterPlan}
            onChange={(e) => { setFilterPlan(e.target.value); setPage(1); }}>
            <option value="">كل الخطط</option>
            <option value="orbit">مدار</option>
            <option value="nova">نوفا</option>
            <option value="galaxy">جالكسي</option>
            <option value="infinity">إنفينيتي</option>
          </AdminSelect>
          <AdminSelect wrapperClassName="w-auto min-w-[140px]" value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="trial">تجريبي</option>
            <option value="expired">منتهي</option>
            <option value="cancelled">ملغي</option>
          </AdminSelect>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        {isLoading || detailLoading ? (
          <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <button onClick={loadList} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا يوجد مشتركين</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>الخطة</th>
                  <th>الحالة</th>
                  <th>الفروع</th>
                  <th>AI</th>
                  <th>التقييمات</th>
                  <th>تاريخ الانضمام</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const planInfo = PLAN_LABELS[item.subscription?.plan ?? ''] || PLAN_LABELS.orbit;
                  const statusInfo = SUB_STATUS[item.subscription?.status ?? ''] || SUB_STATUS.expired;
                  const subStatus = item.subscription?.status ?? 'expired';

                  return (
                    <tr key={item.id} className="cursor-pointer" onClick={() => viewDetail(item.id)}>
                      <td>
                        <div>
                          <div className="text-sm text-gray-900 font-medium">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.owner_name} — {item.owner_email}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-medium ${planInfo.textClass}`}>{planInfo.ar}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${subStatus === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                            subStatus === 'trial' ? 'bg-blue-500/10 text-blue-600' :
                            subStatus === 'cancelled' ? 'bg-slate-500/10 text-slate-600' :
                            'bg-red-500/10 text-red-600'}`}>
                          {statusInfo.ar}
                        </span>
                      </td>
                      <td><span className="text-sm text-gray-700">{item.branch_count}</span></td>
                      <td><span className="text-sm text-gray-700">{item.subscription?.ai_replies_used ?? 0}</span></td>
                      <td><span className="text-sm text-gray-700">{item.review_count}</span></td>
                      <td><span className="text-sm text-gray-700">{item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const menuH = 180; const openUp = r.bottom + menuH > window.innerHeight; setActiveMenu(activeMenu?.id === item.id ? null : { id: item.id, top: openUp ? r.top - menuH : r.bottom + 4, left: r.left, openUp }); }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu?.id === item.id && createPortal(
                              <div ref={menuRef} style={{ position: 'fixed', top: activeMenu.top, left: activeMenu.left, zIndex: 9999 }} className="w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5">
                                <button onClick={() => { setActiveMenu(null); setPlanTarget(item); setNewPlan(normalizePlan(item.subscription?.plan || 'orbit')); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-cyan-600 hover:bg-cyan-500/10 transition-colors">
                                  <ArrowUpCircle size={14} /> تغيير الخطة
                                </button>
                                <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_UPDATE}>
                                  <button onClick={() => handleExtendSub(item)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-500/10 transition-colors">
                                    <Calendar size={14} /> تمديد 30 يوم
                                  </button>
                                </PermissionGate>
                                <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_UPDATE}>
                                  <button onClick={() => handleResetAI(item.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-amber-500/10 transition-colors">
                                    <RefreshCw size={14} /> إعادة تعيين AI
                                  </button>
                                </PermissionGate>
                                {(subStatus === 'active' || subStatus === 'trial') ? (
                                  <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_SUSPEND}>
                                    <button onClick={() => handleSuspend(item.id)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-500/10 transition-colors">
                                      <Pause size={14} /> إيقاف الاشتراك
                                    </button>
                                  </PermissionGate>
                                ) : (
                                  <button onClick={() => handleReactivate(item.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-500/10 transition-colors">
                                    <Play size={14} /> إعادة تفعيل
                                  </button>
                                )}
                                <div className="border-t border-gray-100 my-1" />
                                <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_UPDATE}>
                                  <button onClick={() => { setActiveMenu(null); setDeleteTarget(item); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-500/10 transition-colors">
                                    <Trash2 size={14} /> حذف المشترك
                                  </button>
                                </PermissionGate>
                              </div>,
                              document.body
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-slate-500">
            {total} مشترك — صفحة {page} من {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="admin-btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
              <ChevronRight size={14} /> السابق
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="admin-btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
              التالي <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Subscriber Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-lg" dir="rtl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف المشترك</h3>
              <p className="text-sm text-gray-500 mb-1">هل أنت متأكد من حذف "{deleteTarget.name}"؟</p>
              <p className="text-xs text-red-500 mt-2">سيتم إلغاء الاشتراكات النشطة وإخفاء المشترك من النظام.</p>
            </div>
            <div className="p-4 border-t flex items-center gap-3 justify-center">
              <button onClick={handleDeleteSubscriber} disabled={deletingSubscriber}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                {deletingSubscriber ? 'جارٍ الحذف...' : 'حذف المشترك'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="admin-btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {planTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPlanTarget(null); }}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-lg" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">تغيير الخطة</h2>
              <button onClick={() => setPlanTarget(null)} className="text-slate-500 hover:text-gray-900"><X size={18} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-400 mb-4">تغيير خطة "{planTarget.name}"</p>
              <AdminSelect value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
                <option value="orbit">مدار</option>
                <option value="nova">نوفا</option>
                <option value="galaxy">جالكسي</option>
                <option value="infinity">إنفينيتي</option>
              </AdminSelect>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
              <button onClick={() => setPlanTarget(null)} className="admin-btn-secondary text-sm">إلغاء</button>
              <button onClick={handleChangePlan} disabled={changingPlan || newPlan === normalizePlan(planTarget.subscription?.plan || '')}
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
