// ============================================================================
// SADEEM Admin — Integrations Management
// Full CRUD: add, edit, enable/disable integrations via adminSupabase
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Puzzle, RefreshCw, Settings2, CheckCircle, XCircle, AlertCircle,
  X, Check, Loader2, Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { adminSupabase } from '../services/adminSupabase';
import { adminIntegrationsService, type AdminIntegration } from '../services/adminIntegrations.service';

const CATEGORY_LABELS: Record<string, string> = {
  reviews:       'التقييمات',
  ai:            'الذكاء الاصطناعي',
  payments:      'المدفوعات',
  notifications: 'الإشعارات',
  automation:    'الأتمتة',
  other:         'أخرى',
};

const CATEGORY_ORDER = ['reviews', 'ai', 'payments', 'notifications', 'automation', 'other'];

const INTEGRATION_ICONS: Record<string, string> = {
  google:  '🔍',
  gemini:  '✨',
  openai:  '🤖',
  moyasar: '💳',
  stripe:  '💳',
  slack:   '💬',
  zapier:  '⚡',
};

type IntegrationFormType = 'api' | 'oauth' | 'webhook';

const EMPTY_FORM: {
  key: string; name_ar: string; name_en: string; type: IntegrationFormType;
  category: string; enabled: boolean;
  api_key: string | null; access_token: string | null;
  status: 'disconnected'; config_json: Record<string, unknown>;
  last_sync_at: null; last_error: null;
} = {
  key: '', name_ar: '', name_en: '', type: 'api',
  category: 'other', enabled: true,
  api_key: null, access_token: null,
  status: 'disconnected',
  config_json: {},
  last_sync_at: null, last_error: null,
};

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<AdminIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ api_key: string; access_token: string; description_ar: string }>({ api_key: '', access_token: '', description_ar: '' });
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showActionMsg = (t: string, ty: 'success' | 'error') => { setActionMsg({ text: t, type: ty }); setTimeout(() => setActionMsg(null), 4000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminIntegrationsService.list();
      setIntegrations(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (item: AdminIntegration) => {
    const cfg = item.config_json as Record<string, unknown>;
    if (cfg?.coming_soon) return; // cannot enable coming_soon
    setTogglingId(item.id);
    try {
      await adminIntegrationsService.toggle(item.id, !item.enabled);
      setIntegrations(prev => prev.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i));
    } catch (err) {
      showActionMsg(err instanceof Error ? err.message : 'فشل تبديل الحالة', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (item: AdminIntegration) => {
    const cfg = item.config_json as Record<string, unknown>;
    setExpandedId(expandedId === item.id ? null : item.id);
    setEditValues({
      api_key: item.api_key || '',
      access_token: item.access_token || '',
      description_ar: (cfg?.description_ar as string) || '',
    });
    setShowApiKey(false);
  };

  const handleSave = async (item: AdminIntegration) => {
    setSaving(true);
    try {
      await adminIntegrationsService.update(item.id, {
        api_key: editValues.api_key || null,
        access_token: editValues.access_token || null,
        status: (editValues.api_key || editValues.access_token) ? 'connected' : 'disconnected',
        config_json: {
          ...item.config_json,
          description_ar: editValues.description_ar,
        },
      });
      setIntegrations(prev => prev.map(i => i.id === item.id ? {
        ...i,
        api_key: editValues.api_key || null,
        access_token: editValues.access_token || null,
        status: (editValues.api_key || editValues.access_token) ? 'connected' : 'disconnected',
      } : i));
      setExpandedId(null);
    } catch (err) {
      showActionMsg(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.key || !addForm.name_en) return;
    setAdding(true);
    try {
      await adminIntegrationsService.insert(addForm);
      await load();
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
    } catch (err) {
      showActionMsg(err instanceof Error ? err.message : 'فشل إضافة التكامل', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التكامل؟')) return;
    setDeletingId(id);
    try {
      await adminIntegrationsService.delete(id);
      setIntegrations(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      showActionMsg(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setAiTestResult(null);
    try {
      const testPrompt = `You are a review response assistant. A customer left a 5-star review saying "Great service!". Reply in Arabic in one sentence. Respond ONLY with JSON: {"reply":"..."}`;
      const { data, error } = await adminSupabase.functions.invoke('generate-reply', {
        body: { prompt: testPrompt, temperature: 0.5, maxOutputTokens: 100 },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error || 'Unknown error');
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) throw new Error('Empty response from Gemini');
      const parsed = JSON.parse(rawText.replace(/```json\n?|```\n?/g, '').trim());
      setAiTestResult({ ok: true, message: parsed.reply || rawText });
    } catch (err) {
      setAiTestResult({ ok: false, message: err instanceof Error ? err.message : 'فشل الاختبار' });
    } finally {
      setTestingAI(false);
    }
  };

  // Group by category in defined order
  const allCats = CATEGORY_ORDER.filter(c => integrations.some(i => i.category === c));
  const filtered = filterCat === 'all' ? integrations : integrations.filter(i => i.category === filterCat);
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(i => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {} as Record<string, AdminIntegration[]>);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const enabledCount = integrations.filter(i => i.enabled).length;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">إدارة التكاملات</h1>
          <p className="text-sm text-gray-500">تحكم كامل في التكاملات مع الخدمات الخارجية</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg text-xs transition-colors">
            <RefreshCw size={13} /> تحديث
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors">
            <Plus size={13} /> إضافة تكامل
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'إجمالي التكاملات', value: integrations.length, color: 'text-gray-700' },
          { label: 'مفعّلة', value: enabledCount, color: 'text-indigo-600' },
          { label: 'متصلة', value: connectedCount, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card py-3">
            <div className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Test AI Panel */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 mb-5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">✨</span>
          <div>
            <div className="text-sm font-semibold text-gray-900">Gemini AI</div>
            <div className="text-[11px] text-slate-500">اختبار اتصال خدمة الذكاء الاصطناعي عبر Edge Function</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {aiTestResult && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${aiTestResult.ok ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-red-600 bg-red-500/10 border-red-500/20'}`}>
              {aiTestResult.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
              <span className="max-w-[200px] truncate">{aiTestResult.message}</span>
            </span>
          )}
          <button
            onClick={handleTestAI}
            disabled={testingAI}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {testingAI ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {testingAI ? 'جاري الاختبار…' : 'اختبار AI'}
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">{error}</div>}

      {/* Category filter */}
      {allCats.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {['all', ...allCats].map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCat === cat ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30' : 'bg-gray-50 text-gray-500 hover:text-gray-900 border border-transparent'}`}>
              {cat === 'all' ? 'الكل' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-center py-16 text-slate-500 admin-card">
          <Puzzle size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-1">لا توجد تكاملات بعد</p>
          <button onClick={() => setShowAddModal(true)} className="text-xs text-indigo-600 hover:text-indigo-500 mt-2 underline">إضافة أول تكامل</button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{CATEGORY_LABELS[cat] || cat}</span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-slate-600">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const cfg = item.config_json as Record<string, unknown>;
                  const isComingSoon = !!cfg?.coming_soon;
                  const icon = INTEGRATION_ICONS[cfg?.icon as string] || '🔌';
                  const expanded = expandedId === item.id;
                  const toggling = togglingId === item.id;
                  const deleting = deletingId === item.id;

                  return (
                    <div key={item.id} className={`rounded-xl border transition-all duration-200 ${item.enabled && !isComingSoon ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                      {/* Main row */}
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${item.enabled && !isComingSoon ? 'bg-gray-100' : 'bg-gray-50 opacity-60'}`}>
                          {icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-semibold ${item.enabled && !isComingSoon ? 'text-gray-900' : 'text-gray-500'}`}>{item.name_en}</span>
                            {isComingSoon && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20 font-medium">قريباً</span>}
                            {item.status === 'connected' && !isComingSoon && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                                <CheckCircle size={10} /> متصل
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="flex items-center gap-1 text-[10px] text-red-600">
                                <AlertCircle size={10} /> خطأ
                              </span>
                            )}
                          </div>
                          {cfg?.description_ar ? (
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{String(cfg.description_ar)}</p>
                          ) : null}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(item)}
                            disabled={toggling || isComingSoon}
                            title={isComingSoon ? 'غير متاح بعد' : undefined}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                              isComingSoon ? 'bg-gray-300 cursor-not-allowed opacity-50' :
                              item.enabled ? 'bg-indigo-500' : 'bg-gray-300'
                            } ${toggling ? 'opacity-60' : ''}`}
                          >
                            {toggling
                              ? <Loader2 size={10} className="absolute top-1.5 left-1.5 animate-spin text-white" />
                              : <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
                            }
                          </button>

                          {/* Edit */}
                          {!isComingSoon && (
                            <button onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          )}

                          {/* Delete */}
                          <button onClick={() => handleDelete(item.id)} disabled={!!deleting}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Edit panel */}
                      {expanded && !isComingSoon && (
                        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                            {item.type === 'api' && (
                              <div>
                                <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">مفتاح API</label>
                                <div className="relative">
                                  <input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={editValues.api_key}
                                    onChange={e => setEditValues(p => ({ ...p, api_key: e.target.value }))}
                                    placeholder="أدخل المفتاح..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 pe-8"
                                    dir="ltr"
                                  />
                                  <button onClick={() => setShowApiKey(v => !v)}
                                    className="absolute top-2 end-2 text-gray-400 hover:text-gray-600">
                                    {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                </div>
                              </div>
                            )}
                            {item.type === 'oauth' && (
                              <div>
                                <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">Access Token</label>
                                <input
                                  type={showApiKey ? 'text' : 'password'}
                                  value={editValues.access_token}
                                  onChange={e => setEditValues(p => ({ ...p, access_token: e.target.value }))}
                                  placeholder="ya29...."
                                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50"
                                  dir="ltr"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-[11px] text-gray-500 mb-1.5 font-medium">الوصف</label>
                              <input
                                type="text"
                                value={editValues.description_ar}
                                onChange={e => setEditValues(p => ({ ...p, description_ar: e.target.value }))}
                                placeholder="وصف التكامل..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleSave(item)} disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs transition-colors">
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              حفظ التغييرات
                            </button>
                            <button onClick={() => setExpandedId(null)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-lg text-xs transition-colors">
                              <X size={12} /> إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Plus size={15} className="text-indigo-600" /> إضافة تكامل جديد</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">المعرّف (key)</label>
                  <input value={addForm.key} onChange={e => setAddForm(p => ({ ...p, key: e.target.value }))}
                    placeholder="my_service" dir="ltr"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">الاسم بالإنجليزية</label>
                  <input value={addForm.name_en} onChange={e => setAddForm(p => ({ ...p, name_en: e.target.value }))}
                    placeholder="My Service" dir="ltr"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1 font-medium">الاسم بالعربية</label>
                <input value={addForm.name_ar} onChange={e => setAddForm(p => ({ ...p, name_ar: e.target.value }))}
                  placeholder="خدمة جديدة"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">النوع</label>
                  <select value={addForm.type} onChange={e => setAddForm(p => ({ ...p, type: e.target.value as 'api' | 'oauth' | 'webhook' }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-indigo-500/50">
                    <option value="api">API Key</option>
                    <option value="oauth">OAuth</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">الفئة</label>
                  <select value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-xs focus:outline-none focus:border-indigo-500/50">
                    {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleAdd} disabled={adding || !addForm.key || !addForm.name_en}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors">
                  {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} إضافة
                </button>
                <button onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg text-xs transition-colors">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
