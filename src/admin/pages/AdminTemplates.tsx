// ============================================================================
// SADEEM Admin — Templates Management Page (Phase 9 + Global Templates)
// Tab 1: Subscriber templates (view, edit, delete)
// Tab 2: Global plan templates (full CRUD)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminTemplatesService, type AdminTemplateItem } from '../services/adminTemplates.service';
import { adminGlobalTemplatesService, type GlobalTemplateItem } from '../services/adminGlobalTemplates.service';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import {
  FileText, Search, Edit3, Trash2, X, Star, Check, Plus, Globe,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, { ar: string; color: string }> = {
  positive: { ar: 'إيجابي', color: 'emerald' },
  negative: { ar: 'سلبي', color: 'red' },
  neutral:  { ar: 'محايد', color: 'amber' },
  general:  { ar: 'عام', color: 'blue' },
};

const LANG_MAP: Record<string, string> = { ar: 'عربي', en: 'إنجليزي', any: 'الكل' };

const PLAN_LABELS: Record<string, { ar: string; color: string }> = {
  orbit:    { ar: 'مدار', color: 'blue' },
  nova:     { ar: 'نوفا', color: 'violet' },
  galaxy:   { ar: 'جالكسي', color: 'amber' },
  infinity: { ar: 'إنفينيتي', color: 'emerald' },
};

type TabType = 'subscriber' | 'global';

export default function AdminTemplates() {
  const { hasPermission } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabType>('subscriber');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div>
      {/* Toast */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${msg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">إدارة القوالب</h1>
        <p className="text-sm text-gray-500">إدارة قوالب الردود للمشتركين والقوالب العامة للخطط</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('subscriber')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'subscriber'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><FileText size={14} /> قوالب المشتركين</span>
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'global'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-1.5"><Globe size={14} /> القوالب العامة للخطط</span>
        </button>
      </div>

      {activeTab === 'subscriber' ? (
        <SubscriberTemplatesTab hasPermission={hasPermission} showMsg={showMsg} />
      ) : (
        <GlobalTemplatesTab hasPermission={hasPermission} showMsg={showMsg} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: Subscriber Templates
// ═══════════════════════════════════════════════════════════════════
function SubscriberTemplatesTab({ hasPermission, showMsg }: {
  hasPermission: (p: string) => boolean;
  showMsg: (t: string, ty: 'success' | 'error') => void;
}) {
  const [templates, setTemplates] = useState<AdminTemplateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [editTarget, setEditTarget] = useState<AdminTemplateItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', body: '', category: '', rating_min: 1, rating_max: 5, language: 'ar', is_active: true });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminTemplateItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const result = await adminTemplatesService.list({
        search: search || undefined,
        category: filterCategory || undefined,
      });
      setTemplates(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally { setIsLoading(false); }
  }, [search, filterCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (t: AdminTemplateItem) => {
    setEditTarget(t);
    setEditForm({
      name: t.name, body: t.body, category: t.category,
      rating_min: t.rating_min, rating_max: t.rating_max,
      language: t.language || 'ar', is_active: t.is_active,
    });
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await adminTemplatesService.update(editTarget.id, editForm);
      showMsg('تم تحديث القالب بنجاح', 'success');
      setEditTarget(null);
      loadData();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'فشل في التحديث', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminTemplatesService.remove(deleteTarget.id);
      showMsg('تم حذف القالب بنجاح', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'فشل في الحذف', 'error');
    } finally { setDeleting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-400 mb-3">{error}</p>
      <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  return (
    <>
      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="بحث بالاسم أو المحتوى..." className="admin-form-input pr-10 w-full"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="admin-form-input w-auto min-w-[140px]" value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">كل الفئات</option>
            <option value="positive">إيجابي</option>
            <option value="negative">سلبي</option>
            <option value="neutral">محايد</option>
            <option value="general">عام</option>
          </select>
          <span className="text-xs text-slate-500">{total} قالب</span>
        </div>
      </div>

      {/* Templates table */}
      <div className="admin-card">
        {templates.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={40} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد قوالب بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المشترك</th>
                  <th>اسم القالب</th>
                  <th>المحتوى</th>
                  <th>الفئة</th>
                  <th>التقييم</th>
                  <th>اللغة</th>
                  <th>الحالة</th>
                  <th>الاستخدام</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.general;
                  return (
                    <tr key={t.id}>
                      <td><span className="text-sm text-gray-900">{t.org_name}</span></td>
                      <td><span className="text-sm text-gray-900 font-medium">{t.name}</span></td>
                      <td>
                        <span className="text-xs text-gray-500 block max-w-[200px] truncate" title={t.body}>
                          {t.body}
                        </span>
                      </td>
                      <td><CategoryBadge cat={cat} /></td>
                      <td>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star size={12} className="text-amber-400" />
                          {t.rating_min}-{t.rating_max}
                        </span>
                      </td>
                      <td><span className="text-xs text-gray-500">{LANG_MAP[t.language] || t.language}</span></td>
                      <td><ActiveBadge active={t.is_active} /></td>
                      <td><span className="text-sm text-gray-500">{t.usage_count}</span></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
                            <>
                              <button onClick={() => openEdit(t)}
                                className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors" title="تعديل">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => setDeleteTarget(t)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <TemplateEditModal
          title="تعديل القالب"
          subtitle={`المشترك: ${editTarget.org_name}`}
          form={editForm}
          setForm={setEditForm}
          saving={saving}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          subtitle={`المشترك: ${deleteTarget.org_name}`}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: Global Plan Templates
// ═══════════════════════════════════════════════════════════════════
function GlobalTemplatesTab({ hasPermission, showMsg }: {
  hasPermission: (p: string) => boolean;
  showMsg: (t: string, ty: 'success' | 'error') => void;
}) {
  const [templates, setTemplates] = useState<GlobalTemplateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    plan_id: 'orbit', name: '', body: '', category: 'general',
    rating_min: 1, rating_max: 5, language: 'ar',
  });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<GlobalTemplateItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '', body: '', category: '', rating_min: 1, rating_max: 5,
    language: 'ar', is_active: true, plan_id: 'orbit',
  });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<GlobalTemplateItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const result = await adminGlobalTemplatesService.list({
        plan: filterPlan || undefined,
        category: filterCategory || undefined,
        search: search || undefined,
      });
      setTemplates(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally { setIsLoading(false); }
  }, [search, filterPlan, filterCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (t: GlobalTemplateItem) => {
    setEditTarget(t);
    setEditForm({
      name: t.name, body: t.body, category: t.category,
      rating_min: t.rating_min, rating_max: t.rating_max,
      language: t.language || 'ar', is_active: t.is_active,
      plan_id: t.plan_id,
    });
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.body) {
      showMsg('يرجى ملء اسم القالب والمحتوى', 'error'); return;
    }
    setCreating(true);
    try {
      await adminGlobalTemplatesService.create(createForm);
      showMsg('تم إنشاء القالب العام بنجاح', 'success');
      setShowCreate(false);
      setCreateForm({ plan_id: 'orbit', name: '', body: '', category: 'general', rating_min: 1, rating_max: 5, language: 'ar' });
      loadData();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل في الإنشاء', 'error');
    } finally { setCreating(false); }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    try {
      setSaving(true);
      await adminGlobalTemplatesService.update(editTarget.id, editForm);
      showMsg('تم تحديث القالب العام بنجاح', 'success');
      setEditTarget(null);
      loadData();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل في التحديث', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminGlobalTemplatesService.remove(deleteTarget.id);
      showMsg('تم حذف القالب العام بنجاح', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل في الحذف', 'error');
    } finally { setDeleting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-400 mb-3">{error}</p>
      <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  return (
    <>
      {/* Header + Create */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="admin-card flex-1">
          <div className="p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="بحث..." className="admin-form-input pr-10 w-full"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="admin-form-input w-auto min-w-[120px]" value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}>
              <option value="">كل الخطط</option>
              <option value="orbit">مدار</option>
              <option value="nova">نوفا</option>
              <option value="galaxy">جالكسي</option>
              <option value="infinity">إنفينيتي</option>
            </select>
            <select className="admin-form-input w-auto min-w-[120px]" value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">كل الفئات</option>
              <option value="positive">إيجابي</option>
              <option value="negative">سلبي</option>
              <option value="neutral">محايد</option>
              <option value="general">عام</option>
            </select>
            <span className="text-xs text-slate-500">{total} قالب</span>
          </div>
        </div>
        <PermissionGate permission={PERMISSIONS.SUBSCRIBERS_UPDATE}>
          <button onClick={() => setShowCreate(true)} className="admin-btn-primary text-sm flex-shrink-0">
            <Plus size={16} /> إضافة قالب عام
          </button>
        </PermissionGate>
      </div>

      {/* Templates grouped by plan */}
      <div className="admin-card">
        {templates.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={40} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد قوالب عامة بعد</p>
            {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
              <button onClick={() => setShowCreate(true)} className="text-xs text-cyan-600 hover:text-cyan-500 mt-2 underline">
                إضافة أول قالب
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الخطة</th>
                  <th>اسم القالب</th>
                  <th>المحتوى</th>
                  <th>الفئة</th>
                  <th>التقييم</th>
                  <th>اللغة</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.general;
                  const plan = PLAN_LABELS[t.plan_id] || { ar: t.plan_id, color: 'gray' };
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${plan.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                            plan.color === 'violet' ? 'bg-violet-500/10 text-violet-600' :
                            plan.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-emerald-500/10 text-emerald-600'}`}>
                          {plan.ar}
                        </span>
                      </td>
                      <td><span className="text-sm text-gray-900 font-medium">{t.name}</span></td>
                      <td>
                        <span className="text-xs text-gray-500 block max-w-[250px] truncate" title={t.body}>
                          {t.body}
                        </span>
                      </td>
                      <td><CategoryBadge cat={cat} /></td>
                      <td>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star size={12} className="text-amber-400" />
                          {t.rating_min}-{t.rating_max}
                        </span>
                      </td>
                      <td><span className="text-xs text-gray-500">{LANG_MAP[t.language] || t.language}</span></td>
                      <td><ActiveBadge active={t.is_active} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {hasPermission(PERMISSIONS.SUBSCRIBERS_UPDATE) && (
                            <>
                              <button onClick={() => openEdit(t)}
                                className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors" title="تعديل">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => setDeleteTarget(t)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">إضافة قالب عام جديد</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخطة</label>
                <select className="admin-form-input w-full" value={createForm.plan_id}
                  onChange={(e) => setCreateForm(f => ({ ...f, plan_id: e.target.value }))}>
                  <option value="orbit">مدار</option>
                  <option value="nova">نوفا</option>
                  <option value="galaxy">جالكسي</option>
                  <option value="infinity">إنفينيتي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب *</label>
                <input type="text" className="admin-form-input w-full" value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الرد *</label>
                <textarea className="admin-form-input w-full min-h-[100px]" value={createForm.body}
                  onChange={(e) => setCreateForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                  <select className="admin-form-input w-full" value={createForm.category}
                    onChange={(e) => setCreateForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="positive">إيجابي</option>
                    <option value="negative">سلبي</option>
                    <option value="neutral">محايد</option>
                    <option value="general">عام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                  <select className="admin-form-input w-full" value={createForm.language}
                    onChange={(e) => setCreateForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="ar">عربي</option>
                    <option value="en">إنجليزي</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">أقل تقييم</label>
                  <input type="number" min={1} max={5} className="admin-form-input w-full" value={createForm.rating_min}
                    onChange={(e) => setCreateForm(f => ({ ...f, rating_min: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">أعلى تقييم</label>
                  <input type="number" min={1} max={5} className="admin-form-input w-full" value={createForm.rating_max}
                    onChange={(e) => setCreateForm(f => ({ ...f, rating_max: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex items-center gap-3">
              <button onClick={handleCreate} disabled={creating}
                className="admin-btn-primary flex items-center gap-2">
                <Plus size={14} /> {creating ? 'جارٍ الإنشاء...' : 'إنشاء القالب'}
              </button>
              <button onClick={() => setShowCreate(false)} className="admin-btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">تعديل القالب العام</h3>
              <button onClick={() => setEditTarget(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الخطة</label>
                <select className="admin-form-input w-full" value={editForm.plan_id}
                  onChange={(e) => setEditForm(f => ({ ...f, plan_id: e.target.value }))}>
                  <option value="orbit">مدار</option>
                  <option value="nova">نوفا</option>
                  <option value="galaxy">جالكسي</option>
                  <option value="infinity">إنفينيتي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب</label>
                <input type="text" className="admin-form-input w-full" value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الرد</label>
                <textarea className="admin-form-input w-full min-h-[100px]" value={editForm.body}
                  onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                  <select className="admin-form-input w-full" value={editForm.category}
                    onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="positive">إيجابي</option>
                    <option value="negative">سلبي</option>
                    <option value="neutral">محايد</option>
                    <option value="general">عام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                  <select className="admin-form-input w-full" value={editForm.language}
                    onChange={(e) => setEditForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="ar">عربي</option>
                    <option value="en">إنجليزي</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">أقل تقييم</label>
                  <input type="number" min={1} max={5} className="admin-form-input w-full" value={editForm.rating_min}
                    onChange={(e) => setEditForm(f => ({ ...f, rating_min: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">أعلى تقييم</label>
                  <input type="number" min={1} max={5} className="admin-form-input w-full" value={editForm.rating_max}
                    onChange={(e) => setEditForm(f => ({ ...f, rating_max: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="gtpl-active" checked={editForm.is_active}
                  onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600" />
                <label htmlFor="gtpl-active" className="text-sm text-gray-700">نشط</label>
              </div>
            </div>
            <div className="p-5 border-t flex items-center gap-3">
              <button onClick={handleSaveEdit} disabled={saving}
                className="admin-btn-primary flex items-center gap-2">
                <Check size={14} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button onClick={() => setEditTarget(null)} className="admin-btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          name={deleteTarget.name}
          subtitle={`الخطة: ${PLAN_LABELS[deleteTarget.plan_id]?.ar || deleteTarget.plan_id}`}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════════════════

function CategoryBadge({ cat }: { cat: { ar: string; color: string } }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
      ${cat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
        cat.color === 'red' ? 'bg-red-500/10 text-red-600' :
        cat.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
        'bg-blue-500/10 text-blue-600'}`}>{cat.ar}</span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
      ${active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
      {active ? 'نشط' : 'معطل'}
    </span>
  );
}

function TemplateEditModal({ title, subtitle, form, setForm, saving, onSave, onClose }: {
  title: string;
  subtitle: string;
  form: { name: string; body: string; category: string; rating_min: number; rating_max: number; language: string; is_active: boolean };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم القالب</label>
            <input type="text" className="admin-form-input w-full" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الرد</label>
            <textarea className="admin-form-input w-full min-h-[100px]" value={form.body}
              onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <select className="admin-form-input w-full" value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="positive">إيجابي</option>
                <option value="negative">سلبي</option>
                <option value="neutral">محايد</option>
                <option value="general">عام</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
              <select className="admin-form-input w-full" value={form.language}
                onChange={(e) => setForm(f => ({ ...f, language: e.target.value }))}>
                <option value="ar">عربي</option>
                <option value="en">إنجليزي</option>
                <option value="any">الكل</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أقل تقييم</label>
              <input type="number" min={1} max={5} className="admin-form-input w-full" value={form.rating_min}
                onChange={(e) => setForm(f => ({ ...f, rating_min: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أعلى تقييم</label>
              <input type="number" min={1} max={5} className="admin-form-input w-full" value={form.rating_max}
                onChange={(e) => setForm(f => ({ ...f, rating_max: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="tpl-active-edit" checked={form.is_active}
              onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600" />
            <label htmlFor="tpl-active-edit" className="text-sm text-gray-700">نشط</label>
          </div>
        </div>
        <div className="p-5 border-t flex items-center gap-3">
          <button onClick={onSave} disabled={saving}
            className="admin-btn-primary flex items-center gap-2">
            <Check size={14} /> {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>
          <button onClick={onClose} className="admin-btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, subtitle, deleting, onConfirm, onClose }: {
  name: string; subtitle: string; deleting: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">حذف القالب</h3>
          <p className="text-sm text-gray-500 mb-1">هل تريد حذف القالب "{name}"؟</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="p-4 border-t flex items-center gap-3 justify-center">
          <button onClick={onConfirm} disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
            {deleting ? 'جارٍ الحذف...' : 'حذف'}
          </button>
          <button onClick={onClose} className="admin-btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
