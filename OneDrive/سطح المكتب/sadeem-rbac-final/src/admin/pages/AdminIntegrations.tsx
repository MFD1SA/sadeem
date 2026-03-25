// ============================================================================
// SADEEM Admin — Integrations (DB-Driven)
// Reads from integrations_config table, not hardcoded
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Puzzle, RefreshCw, Settings2, CheckCircle, XCircle, AlertCircle, X, Check, Loader2 } from 'lucide-react';
import { integrationsService, type DbIntegration } from '@/services/plans';

const CATEGORY_LABELS: Record<string, string> = {
  reviews:       'التقييمات',
  ai:            'الذكاء الاصطناعي',
  payments:      'المدفوعات',
  notifications: 'الإشعارات',
  automation:    'الأتمتة',
  other:         'أخرى',
};

const STATUS_CONFIG = {
  connected:    { label: 'متصل',      icon: CheckCircle, color: 'text-emerald-400' },
  disconnected: { label: 'غير متصل',  icon: XCircle,     color: 'text-slate-500'   },
  error:        { label: 'خطأ',       icon: AlertCircle, color: 'text-red-400'      },
};

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<DbIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ api_key: string; access_token: string }>({ api_key: '', access_token: '' });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await integrationsService.list();
      setIntegrations(data);
    } catch {
      // DB table may not exist yet — show empty state
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (integration: DbIntegration) => {
    setTogglingId(integration.id);
    try {
      await integrationsService.toggleEnabled(integration.id, !integration.enabled);
      setIntegrations(prev =>
        prev.map(i => i.id === integration.id ? { ...i, enabled: !i.enabled } : i)
      );
    } finally {
      setTogglingId(null);
    }
  };

  const startEdit = (integration: DbIntegration) => {
    setEditingId(integration.id);
    setEditValues({ api_key: integration.api_key || '', access_token: integration.access_token || '' });
  };

  const saveEdit = async (integration: DbIntegration) => {
    try {
      await integrationsService.update(integration.id, {
        api_key: editValues.api_key || null,
        access_token: editValues.access_token || null,
      } as Partial<DbIntegration>);
      setIntegrations(prev =>
        prev.map(i => i.id === integration.id
          ? { ...i, api_key: editValues.api_key || null, access_token: editValues.access_token || null }
          : i
        )
      );
      setEditingId(null);
    } catch { /* show error */ }
  };

  const testConnection = async (integration: DbIntegration) => {
    setTestingId(integration.id);
    try {
      const result = await integrationsService.testConnection(integration.key);
      setTestResults(prev => ({ ...prev, [integration.id]: result }));
    } finally {
      setTestingId(null);
    }
  };

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];
  const filtered = filterCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === filterCategory);

  const grouped = filtered.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, DbIntegration[]>);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
            <Puzzle size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">التكاملات</h1>
            <p className="text-sm text-slate-400">إدارة وتفعيل التكاملات مع الخدمات الخارجية</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-sm transition-colors">
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              {cat === 'all' ? 'الكل' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {integrations.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Puzzle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">لم يتم إعداد التكاملات بعد</p>
          <p className="text-xs mt-1">شغّل migration: sadeem-plans-integrations-schema.sql في Supabase</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <div className="space-y-3">
                {items.map((integration) => {
                  const status = STATUS_CONFIG[integration.status] || STATUS_CONFIG.disconnected;
                  const StatusIcon = status.icon;
                  const testResult = testResults[integration.id];
                  const isTesting = testingId === integration.id;
                  const isToggling = togglingId === integration.id;
                  const isEditing = editingId === integration.id;

                  return (
                    <div key={integration.id}
                      className={`rounded-xl border transition-all ${
                        integration.enabled
                          ? 'bg-white/[0.04] border-white/10'
                          : 'bg-white/[0.02] border-white/5 opacity-70'
                      }`}
                    >
                      <div className="p-4 flex items-start gap-4">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(integration)}
                          disabled={isToggling}
                          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                            integration.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                          } ${isToggling ? 'opacity-50' : ''}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            integration.enabled ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'ltr:translate-x-1 rtl:-translate-x-1'
                          }`} />
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white font-medium text-sm">{integration.name_ar}</span>
                            <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded text-[10px] uppercase">{integration.type}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                            <StatusIcon size={11} />
                            {status.label}
                            {integration.last_sync_at && (
                              <span className="text-slate-500 mr-2">
                                آخر مزامنة: {new Date(integration.last_sync_at).toLocaleDateString('ar-SA')}
                              </span>
                            )}
                          </div>
                          {integration.last_error && (
                            <div className="text-xs text-red-400 mt-1 bg-red-500/5 px-2 py-1 rounded">
                              {integration.last_error}
                            </div>
                          )}
                          {testResult && (
                            <div className={`text-xs mt-1 px-2 py-1 rounded ${
                              testResult.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                              {testResult.success ? '✓' : '✗'} {testResult.message}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => testConnection(integration)}
                            disabled={isTesting}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                          >
                            {isTesting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            اختبار
                          </button>
                          <button
                            onClick={() => isEditing ? setEditingId(null) : startEdit(integration)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                          >
                            {isEditing ? <X size={12} /> : <Settings2 size={12} />}
                            {isEditing ? 'إغلاق' : 'إعدادات'}
                          </button>
                        </div>
                      </div>

                      {/* Edit Panel */}
                      {isEditing && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-4">
                          <div className="space-y-3 max-w-md">
                            {integration.type === 'api' && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">مفتاح API</label>
                                <input
                                  type="password"
                                  value={editValues.api_key}
                                  onChange={e => setEditValues(prev => ({ ...prev, api_key: e.target.value }))}
                                  placeholder="sk-..."
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600"
                                  dir="ltr"
                                />
                              </div>
                            )}
                            {integration.type === 'oauth' && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Access Token</label>
                                <input
                                  type="password"
                                  value={editValues.access_token}
                                  onChange={e => setEditValues(prev => ({ ...prev, access_token: e.target.value }))}
                                  placeholder="ya29...."
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-600"
                                  dir="ltr"
                                />
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(integration)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs transition-colors"
                              >
                                <Check size={13} /> حفظ
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 hover:bg-white/10 rounded-lg text-xs transition-colors"
                              >
                                <X size={13} /> إلغاء
                              </button>
                            </div>
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
    </div>
  );
}
