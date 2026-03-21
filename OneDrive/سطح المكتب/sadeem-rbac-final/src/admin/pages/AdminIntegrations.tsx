// ============================================================================
// SADEEM Admin — Integrations (DB-Persisted)
// Integration status saved/loaded from system_settings via RPCs.
// ============================================================================

import { useState, useEffect } from 'react';
import { adminSettingsService } from '../services/adminSettings.service';
import { Puzzle, Check, X, Settings, ExternalLink } from 'lucide-react';

interface IntegrationDef {
  id: string; name: string; name_ar: string; description: string;
  icon: string; category: string; configurable: boolean;
}

const INTEGRATION_DEFS: IntegrationDef[] = [
  { id: 'google_business', name: 'Google Business', name_ar: 'Google Business Profile', description: 'ربط حسابات Google لسحب التقييمات والرد عليها', icon: '🔗', category: 'reviews', configurable: true },
  { id: 'gemini_ai', name: 'Google Gemini', name_ar: 'الذكاء الاصطناعي — Gemini', description: 'توليد الردود الذكية وتحليل المشاعر', icon: '🤖', category: 'ai', configurable: true },
  { id: 'stripe', name: 'Stripe', name_ar: 'بوابة الدفع — Stripe', description: 'معالجة المدفوعات والاشتراكات الدولية', icon: '💳', category: 'payments', configurable: true },
  { id: 'moyasar', name: 'Moyasar', name_ar: 'بوابة الدفع — ميسر', description: 'بوابة دفع سعودية تدعم مدى وApple Pay', icon: '💰', category: 'payments', configurable: true },
  { id: 'slack', name: 'Slack', name_ar: 'إشعارات Slack', description: 'إرسال تنبيهات التقييمات إلى قنوات Slack', icon: '💬', category: 'notifications', configurable: false },
  { id: 'zapier', name: 'Zapier', name_ar: 'أتمتة Zapier', description: 'ربط مع آلاف التطبيقات عبر Zapier', icon: '⚡', category: 'automation', configurable: false },
  { id: 'whatsapp', name: 'WhatsApp Business', name_ar: 'إشعارات واتساب', description: 'إرسال تنبيهات فورية عبر واتساب للأعمال', icon: '📱', category: 'notifications', configurable: false },
];

const CATS: Record<string, string> = {
  reviews: 'التقييمات', ai: 'الذكاء الاصطناعي', payments: 'المدفوعات',
  notifications: 'الإشعارات', automation: 'الأتمتة',
};

type IntegrationState = Record<string, { enabled: boolean; config?: Record<string, string> }>;

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

  useEffect(() => {
    adminSettingsService.get<IntegrationState>('integrations', DEFAULT_STATE)
      .then((s) => { setState(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleIntegration = async (id: string) => {
    const newState = { ...state, [id]: { ...state[id], enabled: !state[id]?.enabled } };
    setState(newState);
    setSaving(id);
    try {
      await adminSettingsService.set('integrations', newState);
      setMsg({ text: `تم ${newState[id].enabled ? 'تفعيل' : 'تعطيل'} التكامل`, type: 'success' });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setState(state); // rollback
      setMsg({ text: 'فشل في حفظ التغيير', type: 'error' });
      setTimeout(() => setMsg(null), 3000);
    } finally { setSaving(null); }
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

      {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{msg.text}</div>}

      <div className="admin-card mb-4"><div className="p-4 flex items-center gap-3">
        <select className="admin-form-input w-auto min-w-[140px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {cats.map(c => <option key={c} value={c}>{CATS[c] || c}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filtered.length} تكامل</span>
      </div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((intg) => {
          const s = state[intg.id] || { enabled: false };
          const isSaving = saving === intg.id;
          return (
            <div key={intg.id} className={`admin-card transition-colors ${s.enabled ? 'border-cyan-500/10' : ''}`}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl flex-shrink-0">{intg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{intg.name_ar}</h3>
                    <p className="text-xs text-slate-500" dir="ltr">{intg.name}</p>
                  </div>

                  {/* Enable/disable toggle — saves to DB */}
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
                  </div>
                  {intg.configurable && s.enabled && (
                    <button className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-1">
                      <Settings size={12} /> إعدادات
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
