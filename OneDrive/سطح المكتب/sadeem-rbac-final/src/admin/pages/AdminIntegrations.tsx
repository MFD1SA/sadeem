// ============================================================================
// SADEEM Admin — Integrations (DB-Persisted + Config Panel)
// Integration status saved/loaded from system_settings via RPCs.
// Settings button opens a real config panel per integration.
// ============================================================================

import { useState, useEffect } from 'react';
import { adminSettingsService } from '../services/adminSettings.service';
import { Puzzle, Check, X, Settings, Save } from 'lucide-react';
import { AdminSelect } from '../components/AdminSelect';

interface IntegrationDef {
  id: string; name: string; name_ar: string; description: string;
  icon: string; category: string; configurable: boolean;
  configFields?: Array<{ key: string; label: string; type: 'text' | 'password'; placeholder: string }>;
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: 'google_business', name: 'Google Business', name_ar: 'Google Business Profile',
    description: 'ربط حسابات Google لسحب التقييمات والرد عليها',
    icon: '🔗', category: 'reviews', configurable: true,
    configFields: [
      { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Google OAuth Client ID' },
      { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Google OAuth Client Secret' },
    ],
  },
  {
    id: 'gemini_ai', name: 'Google Gemini', name_ar: 'الذكاء الاصطناعي — Gemini',
    description: 'توليد الردود الذكية وتحليل المشاعر',
    icon: '🤖', category: 'ai', configurable: true,
    configFields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'AIzaSy...' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'gemini-1.5-flash-8b' },
    ],
  },
  {
    id: 'stripe', name: 'Stripe', name_ar: 'بوابة الدفع — Stripe',
    description: 'معالجة المدفوعات والاشتراكات الدولية',
    icon: '💳', category: 'payments', configurable: true,
    configFields: [
      { key: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...' },
    ],
  },
  {
    id: 'moyasar', name: 'Moyasar', name_ar: 'بوابة الدفع — ميسر',
    description: 'بوابة دفع سعودية تدعم مدى وApple Pay',
    icon: '💰', category: 'payments', configurable: true,
    configFields: [
      { key: 'publishable_key', label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
    ],
  },
  {
    id: 'slack', name: 'Slack', name_ar: 'إشعارات Slack',
    description: 'إرسال تنبيهات التقييمات إلى قنوات Slack',
    icon: '💬', category: 'notifications', configurable: false,
  },
  {
    id: 'zapier', name: 'Zapier', name_ar: 'أتمتة Zapier',
    description: 'ربط مع آلاف التطبيقات عبر Zapier',
    icon: '⚡', category: 'automation', configurable: false,
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business', name_ar: 'إشعارات واتساب',
    description: 'إرسال تنبيهات فورية عبر واتساب للأعمال',
    icon: '📱', category: 'notifications', configurable: false,
  },
];

const CATS: Record<string, string> = {
  reviews: 'التقييمات', ai: 'الذكاء الاصطناعي', payments: 'المدفوعات',
  notifications: 'الإشعارات', automation: 'الأتمتة',
};

type IntegrationConfig = Record<string, string>;
type IntegrationState = Record<string, { enabled: boolean; config?: IntegrationConfig }>;

const DEFAULT_STATE: IntegrationState = {
  google_business: { enabled: true }, gemini_ai: { enabled: true },
  stripe: { enabled: true }, moyasar: { enabled: false },
  slack: { enabled: false }, zapier: { enabled: false }, whatsapp: { enabled: false },
};

export default function AdminIntegrations() {
  const [state, setState] = useState<IntegrationState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [configTarget, setConfigTarget] = useState<IntegrationDef | null>(null);
  const [configValues, setConfigValues] = useState<IntegrationConfig>({});
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    adminSettingsService.get<IntegrationState>('integrations', DEFAULT_STATE)
      .then((s) => { setState(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const toggleIntegration = async (id: string) => {
    const newState = { ...state, [id]: { ...state[id], enabled: !state[id]?.enabled } };
    setState(newState);
    setSaving(id);
    try {
      await adminSettingsService.set('integrations', newState);
      showMsg(`تم ${newState[id].enabled ? 'تفعيل' : 'تعطيل'} التكامل`, 'success');
    } catch {
      setState(state);
      showMsg('فشل في حفظ التغيير', 'error');
    } finally { setSaving(null); }
  };

  const openConfig = (intg: IntegrationDef) => {
    setConfigTarget(intg);
    setConfigValues(state[intg.id]?.config || {});
  };

  const saveConfig = async () => {
    if (!configTarget) return;
    setSavingConfig(true);
    try {
      const newState = {
        ...state,
        [configTarget.id]: { ...state[configTarget.id], config: configValues },
      };
      await adminSettingsService.set('integrations', newState);
      setState(newState);
      showMsg('تم حفظ الإعدادات', 'success');
      setConfigTarget(null);
    } catch {
      showMsg('فشل في حفظ الإعدادات', 'error');
    } finally { setSavingConfig(false); }
  };

  const filtered = filterCat ? INTEGRATION_DEFS.filter(i => i.category === filterCat) : INTEGRATION_DEFS;
  const cats = [...new Set(INTEGRATION_DEFS.map(i => i.category))];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">التكاملات</h1>
        <p className="text-sm text-slate-400">إدارة وتفعيل التكاملات مع الخدمات الخارجية — الحالة تُحفظ تلقائيًا</p>
      </div>

      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      <div className="admin-card mb-4">
        <div className="p-4 flex items-center gap-3">
          <AdminSelect wrapperClassName="w-auto min-w-[140px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">كل التصنيفات</option>
            {cats.map(c => <option key={c} value={c}>{CATS[c] || c}</option>)}
          </AdminSelect>
          <span className="text-xs text-slate-500">{filtered.length} تكامل</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((intg) => {
          const s = state[intg.id] || { enabled: false };
          const isSaving = saving === intg.id;
          const hasConfig = intg.configFields && (state[intg.id]?.config
            ? Object.values(state[intg.id]!.config!).some(v => v.trim() !== '')
            : false);

          return (
            <div key={intg.id} className={`admin-card transition-colors ${s.enabled ? 'border-cyan-500/10' : ''}`}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl flex-shrink-0">{intg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{intg.name_ar}</h3>
                    <p className="text-xs text-slate-500" dir="ltr">{intg.name}</p>
                  </div>

                  {/* Enable/disable toggle */}
                  <button
                    onClick={() => toggleIntegration(intg.id)}
                    disabled={isSaving}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${s.enabled ? 'bg-cyan-500' : 'bg-slate-700'} ${isSaving ? 'opacity-50' : ''}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.enabled ? 'right-1' : 'right-[24px]'}`} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">{intg.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600">{CATS[intg.category]}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${s.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                      {s.enabled ? <><Check size={10} /> مفعّل</> : <><X size={10} /> معطّل</>}
                    </span>
                    {hasConfig && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">
                        مُهيَّأ
                      </span>
                    )}
                  </div>
                  {intg.configurable && s.enabled && (
                    <button
                      onClick={() => openConfig(intg)}
                      className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-cyan-500/10"
                    >
                      <Settings size={12} /> إعدادات
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Config Modal */}
      {configTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfigTarget(null); }}
        >
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-xl">{configTarget.icon}</span>
                <div>
                  <h2 className="text-base font-semibold text-white">{configTarget.name_ar}</h2>
                  <p className="text-xs text-slate-500" dir="ltr">{configTarget.name} — Configuration</p>
                </div>
              </div>
              <button onClick={() => setConfigTarget(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                هذه البيانات تُخزَّن بشكل آمن في إعدادات النظام. تأكد من استخدام مفاتيح الإنتاج (Production) فقط.
              </p>
              {configTarget.configFields?.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    className="admin-form-input"
                    dir="ltr"
                    placeholder={field.placeholder}
                    value={configValues[field.key] || ''}
                    onChange={(e) => setConfigValues(p => ({ ...p, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.06]">
              <button onClick={() => setConfigTarget(null)} className="admin-btn-secondary text-sm">إلغاء</button>
              <button onClick={saveConfig} disabled={savingConfig} className="admin-btn-primary text-sm">
                <Save size={14} />
                <span>{savingConfig ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
