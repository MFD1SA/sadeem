// ============================================================================
// SADEEM Admin — Plans Management
// Full CRUD for pricing plans, limits, and features
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Package, Edit2, Check, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { plansService, type DbPlan, type DbPlanLimits } from '@/services/plans';
import { adminSupabase } from '../services/adminSupabase';

export default function AdminPlans() {
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [limits, setLimits] = useState<Record<string, DbPlanLimits>>({});
  const [features, setFeatures] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingLimits, setEditingLimits] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [planEdits, setPlanEdits] = useState<Partial<DbPlan>>({});
  const [limitEdits, setLimitEdits] = useState<Partial<DbPlanLimits>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ps = await plansService.listActive();
      setPlans(ps);
      const limitsMap: Record<string, DbPlanLimits> = {};
      const featuresMap: Record<string, Record<string, string>> = {};
      await Promise.all(ps.map(async (p) => {
        const [l, f] = await Promise.all([
          plansService.getLimits(p.id),
          plansService.getFeatures(p.id),
        ]);
        if (l) limitsMap[p.id] = l;
        featuresMap[p.id] = f;
      }));
      setLimits(limitsMap);
      setFeatures(featuresMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEditPlan = (plan: DbPlan) => {
    setEditingPlan(plan.id);
    setPlanEdits({ name_ar: plan.name_ar, name_en: plan.name_en, price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, desc_ar: plan.desc_ar || '', desc_en: plan.desc_en || '' });
  };

  const savePlan = async (planId: string) => {
    setSaving(true);
    try {
      const { error } = await adminSupabase
        .from('plans')
        .update({ ...planEdits, updated_at: new Date().toISOString() })
        .eq('id', planId);
      if (error) throw error;
      setEditingPlan(null);
      await load();
    } finally { setSaving(false); }
  };

  const startEditLimits = (planId: string) => {
    setEditingLimits(planId);
    const l = limits[planId];
    if (l) setLimitEdits({ max_branches: l.max_branches, max_team_members: l.max_team_members, max_ai_replies: l.max_ai_replies, max_template_replies: l.max_template_replies, max_qr_codes: l.max_qr_codes });
  };

  const saveLimits = async (planId: string) => {
    setSaving(true);
    try {
      const { error } = await adminSupabase
        .from('plan_limits')
        .upsert({ plan_id: planId, ...limitEdits });
      if (error) throw error;
      setEditingLimits(null);
      await load();
    } finally { setSaving(false); }
  };

  const toggleFeature = async (planId: string, featureKey: string) => {
    const current = features[planId]?.[featureKey] || 'false';
    const newVal = current === 'true' ? 'false' : 'true';
    try {
      const { error } = await adminSupabase
        .from('plan_features')
        .upsert({ plan_id: planId, feature_key: featureKey, feature_value: newVal });
      if (error) throw error;
      setFeatures(prev => ({ ...prev, [planId]: { ...prev[planId], [featureKey]: newVal } }));
    } catch { /* silent */ }
  };

  const formatLimit = (v: number) => v === -1 || v === 999999 ? '∞' : v.toString();

  const featureLabels: Record<string, string> = {
    google_integration: 'Google Business',
    ai_auto_reply: 'الرد الآلي بالذكاء الاصطناعي',
    manual_reply: 'الرد اليدوي',
    templates: 'قوالب الردود',
    notifications: 'الإشعارات',
    tasks: 'المهام',
    team_management: 'إدارة الفريق',
    api_access: 'وصول API',
    advanced_analytics: 'التحليلات المتقدمة',
    branch_comparison: 'مقارنة الفروع',
    premium_support: 'الدعم المميز',
    qr_landing_page: 'صفحة QR',
    qr_employee_field: 'حقل الموظف في QR',
    qr_analytics: 'تحليلات QR',
  };

  const planColors: Record<string, string> = {
    orbit: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    nova: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    galaxy: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    infinity: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="admin-spinner" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Package size={20} className="text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">إدارة الخطط والأسعار</h1>
          <p className="text-sm text-slate-400">تحكم كامل في خطط الاشتراك وحدودها وميزاتها</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const planLimits = limits[plan.id];
          const planFeatures = features[plan.id] || {};
          const isExpanded = expanded === plan.id;
          const colorClass = planColors[plan.id] || 'from-slate-500/20 to-slate-600/20 border-slate-500/30';

          return (
            <div key={plan.id} className={`rounded-2xl border bg-gradient-to-br ${colorClass} overflow-hidden`}>
              {/* Plan Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {editingPlan === plan.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={planEdits.name_ar || ''}
                            onChange={e => setPlanEdits(prev => ({ ...prev, name_ar: e.target.value }))}
                            placeholder="الاسم بالعربية"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                          <input
                            value={planEdits.name_en || ''}
                            onChange={e => setPlanEdits(prev => ({ ...prev, name_en: e.target.value }))}
                            placeholder="Name in English"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                            dir="ltr"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={planEdits.price_monthly || 0}
                            onChange={e => setPlanEdits(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                            placeholder="السعر الشهري (ريال)"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                          <input
                            type="number"
                            value={planEdits.price_yearly || 0}
                            onChange={e => setPlanEdits(prev => ({ ...prev, price_yearly: Number(e.target.value) }))}
                            placeholder="السعر السنوي (ريال)"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => savePlan(plan.id)} disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors">
                            <Check size={14} /> حفظ
                          </button>
                          <button onClick={() => setEditingPlan(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs hover:bg-white/10 transition-colors">
                            <X size={14} /> إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{plan.name_ar}</h3>
                          <span className="text-sm text-slate-400">/ {plan.name_en}</span>
                          {plan.id === 'nova' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-medium">
                              <Star size={10} /> الأكثر شعبية
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {plan.price_monthly > 0 ? (
                            <>
                              <span className="text-white font-semibold">{plan.price_monthly} ريال<span className="text-slate-400 text-xs font-normal">/شهر</span></span>
                              <span className="text-slate-400">{plan.price_yearly} ريال/سنة</span>
                            </>
                          ) : (
                            <span className="text-white font-semibold">تسعير مخصص</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingPlan !== plan.id && (
                      <button onClick={() => startEditPlan(plan)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <Edit2 size={15} />
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : plan.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Quick limits summary */}
                {planLimits && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      { label: 'فروع', val: formatLimit(planLimits.max_branches) },
                      { label: 'فريق', val: formatLimit(planLimits.max_team_members) },
                      { label: 'ردود AI', val: formatLimit(planLimits.max_ai_replies) },
                      { label: 'قوالب', val: formatLimit(planLimits.max_template_replies) },
                      { label: 'QR', val: formatLimit(planLimits.max_qr_codes) },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs">
                        <span className="text-white font-semibold">{item.val}</span>
                        <span className="text-slate-400">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-white/5 p-5 space-y-6">
                  {/* Limits Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-300">الحدود الكمية</h4>
                      {editingLimits !== plan.id ? (
                        <button onClick={() => startEditLimits(plan.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-slate-400 hover:text-white rounded-lg text-xs hover:bg-white/10 transition-colors">
                          <Edit2 size={12} /> تعديل
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => saveLimits(plan.id)} disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30">
                            <Check size={12} /> حفظ
                          </button>
                          <button onClick={() => setEditingLimits(null)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 text-slate-400 rounded-lg text-xs hover:bg-white/10">
                            <X size={12} /> إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                    {planLimits && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { key: 'max_branches', label: 'الفروع' },
                          { key: 'max_team_members', label: 'الفريق' },
                          { key: 'max_ai_replies', label: 'ردود AI' },
                          { key: 'max_template_replies', label: 'القوالب' },
                          { key: 'max_qr_codes', label: 'رموز QR' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-xs text-slate-400 mb-1">{label}</div>
                            {editingLimits === plan.id ? (
                              <input
                                type="number"
                                value={(limitEdits as Record<string, number>)[key] ?? (planLimits as Record<string, number>)[key]}
                                onChange={e => setLimitEdits(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                className="w-full text-center bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white text-sm"
                              />
                            ) : (
                              <div className="text-white font-semibold text-sm">
                                {formatLimit((planLimits as Record<string, number>)[key])}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feature Toggles */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">الميزات</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(featureLabels).map(([key, label]) => {
                        const isOn = planFeatures[key] === 'true';
                        return (
                          <button
                            key={key}
                            onClick={() => toggleFeature(plan.id, key)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm ${
                              isOn
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/5'
                            }`}
                          >
                            <span>{label}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOn ? 'ltr:translate-x-4 rtl:-translate-x-4' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
