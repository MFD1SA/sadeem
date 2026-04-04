// ============================================================================
// SADEEM Admin — Templates Management Page (Phase 9)
// View, edit, delete subscriber templates across all organizations.
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminTemplatesService, type AdminTemplateItem } from '../services/adminTemplates.service';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { PERMISSIONS } from '../utils/constants';
import { PermissionGate } from '../guards';
import {
  FileText, Search, Edit3, Trash2, X, Star, Check, Globe,
} from 'lucide-react';

const CATEGORY_MAP: Record<string, { ar: string; color: string }> = {
  positive: { ar: 'إيجابي', color: 'emerald' },
  negative: { ar: 'سلبي', color: 'red' },
  neutral:  { ar: 'محايد', color: 'amber' },
  general:  { ar: 'عام', color: 'blue' },
};

const LANG_MAP: Record<string, string> = { ar: 'عربي', en: 'إنجليزي', any: 'الكل' };

export default function AdminTemplates() {
  const { hasPermission } = useAdminAuth();
  const [templates, setTemplates] = useState<AdminTemplateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<AdminTemplateItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', body: '', category: '', rating_min: 1, rating_max: 5, language: 'ar', is_active: true });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplateItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

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
    } catch (err) {
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
    <div>
      {/* Toast */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${msg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">إدارة القوالب</h1>
        <p className="text-sm text-gray-500">عرض وتعديل وحذف قوالب الردود عبر جميع المشتركين ({total} قالب)</p>
      </div>

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
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${cat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                            cat.color === 'red' ? 'bg-red-500/10 text-red-600' :
                            cat.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-blue-500/10 text-blue-600'}`}>{cat.ar}</span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Star size={12} className="text-amber-400" />
                          {t.rating_min}-{t.rating_max}
                        </span>
                      </td>
                      <td><span className="text-xs text-gray-500">{LANG_MAP[t.language] || t.language}</span></td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${t.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
                          {t.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">تعديل القالب</h3>
              <button onClick={() => setEditTarget(null)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 mb-2">المشترك: <span className="font-medium text-gray-700">{editTarget.org_name}</span></p>

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
                    <option value="any">الكل</option>
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
                <input type="checkbox" id="tpl-active" checked={editForm.is_active}
                  onChange={(e) => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-600" />
                <label htmlFor="tpl-active" className="text-sm text-gray-700">نشط</label>
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

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">حذف القالب</h3>
              <p className="text-sm text-gray-500 mb-1">هل تريد حذف القالب "{deleteTarget.name}"؟</p>
              <p className="text-xs text-gray-400">المشترك: {deleteTarget.org_name}</p>
            </div>
            <div className="p-4 border-t flex items-center gap-3 justify-center">
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">
                {deleting ? 'جارٍ الحذف...' : 'حذف'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="admin-btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
