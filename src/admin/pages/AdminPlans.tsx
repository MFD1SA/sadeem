// ============================================================================
// SENDA Admin — Plans Management
// Full CRUD for pricing plans, limits, and features
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Package, Edit2, Check, X, ChevronDown, ChevronUp, Star, AlertTriangle } from 'lucide-react';
import { adminSupabase } from '../services/adminSupabase';
import type { DbPlan, DbPlanLimits } from '@/services/plans';

export default function AdminPlans() {
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [limits, setLimits] = useState<Record<string, DbPlanLimits>>({});
  const [features, setFeatures] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingLimits, setEditingLimits] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [planEdits, setPlanEdits] = useState<Partial<DbPlan>>({});
  const [limitEdits, setLimitEdits] = useState<Partial<DbPlanLimits>>({});
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data: ps, error: plansErr } = await adminSupabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (plansErr) throw plansErr;
      const planList: DbPlan[] = ps || [];
      setPlans(planList);

      const limitsMap: Record<string, DbPlanLimits> = {};
      const featuresMap: Record<string, Record<string, string>> = {};
      await Promise.all(planList.map(async (p) => {
        const [{ data: lData }, { data: fData }] = await Promise.all([
          adminSupabase.from('plan_limits').select('*').eq('plan_id', p.id).single(),
          adminSupabase.from('plan_features').select('feature_key,feature_value').eq('plan_id', p.id),
        ]);
        if (lData) limitsMap[p.id] = lData as DbPlanLimits;
        featuresMap[p.id] = Object.fromEntries(
          ((fData as { feature_key: string; feature_value: string }[]) || [])
            .map(f => [f.feature_key, f.feature_value])
        );
      }));
      setLimits(limitsMap);
      setFeatures(featuresMap);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'فشل في تحميل الخطط');
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
    setSaveError('');
    try {
      const { error } = await adminSupabase.from('plans').update(planEdits).eq('id', planId);
      if (error) throw error;
      setEditingPlan(null);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'فشل حفظ الخطة');
    } finally { setSaving(false); }
  };

  const startEditLimits = (planId: string) => {
    setEditingLimits(planId);
    const l = limits[planId];
    if (l) setLimitEdits({ max_branches: l.max_branches, max_team_members: l.max_team_members, max_ai_replies: l.max_ai_replies, max_template_replies: l.max_template_replies, max_qr_codes: l.max_qr_codes });
  };

  const saveLimits = async (planId: string) => {
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await adminSupabase.from('plan_limits').update(limitEdits).eq('plan_id', planId);
      if (error) throw error;
      setEditingLimits(null);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'فشل حفظ الحدود');
    } finally { setSaving(false); }
  };

  const toggleFeature = async (planId: string, featureKey: string) => {
    const current = features[planId]?.[featureKey] || 'false';
    const newVal = current === 'true' ? 'false' : 'true';
    try {
      const { error } = await adminSupabase
        .from('plan_features')
        .upsert({ plan_id: planId, feature_key: featureKey, feature_value: newVal }, { onConflict: 'plan_id,feature_key' });
      if (error) throw error;
      setFeatures(prev => ({
        ...prev,
        [planId]: { ...prev[planId], [featureKey]: newVal },
      }));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'فشل تحديث الميزة');
    }
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
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-600 rounded-full animate-spin" />
    </div>
  );

  if (loadError) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-600 mb-3">{loadError}</p>
      <button onClick={load} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Package size={20} className="text-cyan-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة الخطط والأسعار</h1>
          <p className="text-sm text-gray-500">تحكم كامل في خطط الاشتراك وحدودها وميزاتها</p>
        </div>
      </div>

      {saveError && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl p-3.5 mb-4">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{saveError}</span>
          <button onClick={() => setSaveError('')} className="mr-auto text-red-600/60 hover:text-red-600"><X size={14} /></button>
        </div>
      )}

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
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm"
                          />
                          <input
                            value={planEdits.name_en || ''}
                            onChange={e => setPlanEdits(prev => ({ ...prev, name_en: e.target.value }))}
                            placeholder="Name in English"
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm"
                            dir="ltr"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={planEdits.price_monthly || 0}
                            onChange={e => setPlanEdits(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                            placeholder="السعر الشهري (ريال)"
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm"
                          />
                          <input
                            type="number"
                            value={planEdits.price_yearly || 0}
                            onChange={e => setPlanEdits(prev => ({ ...prev, price_yearly: Number(e.target.value) }))}
                            placeholder="السعر السنوي (ريال)"
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => savePlan(plan.id)} disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">
                            <Check size={14} /> حفظ
                          </button>
                          <button onClick={() => setEditingPlan(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                            <X size={14} /> إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{plan.name_ar}</h3>
                          <span className="text-sm text-gray-500">/ {plan.name_en}</span>
                          {plan.id === 'nova' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full text-[10px] font-medium">
                              <Star size={10} /> الأكثر شعبية
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {plan.price_monthly > 0 ? (
                            <>
                              <span className="text-gray-900 font-semibold">{plan.price_monthly} ريال<span className="text-gray-500 text-xs font-normal">/شهر</span></span>
                              <span className="text-gray-500">{plan.price_yearly} ريال/سنة</span>
                            </>
                          ) : (
                            <span className="text-gray-900 font-semibold">تسعير مخصص</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingPlan !== plan.id && (
                      <button onClick={() => startEditPlan(plan)}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                        <Edit2 size={15} />
                      </button>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : plan.id)}
                      className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
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
                      <div key={item.label} className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg text-xs">
                        <span className="text-gray-900 font-semibold">{item.val}</span>
                        <span className="text-gray-500">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-5 space-y-6">
                  {/* Limits Editor */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">الحدود الكمية</h4>
                      {editingLimits !== plan.id ? (
                        <button onClick={() => startEditLimits(plan.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                          <Edit2 size={12} /> تعديل
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => saveLimits(plan.id)} disabled={saving}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs hover:bg-emerald-500/20">
                            <Check size={12} /> حفظ
                          </button>
                          <button onClick={() => setEditingLimits(null)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs hover:bg-gray-100">
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
                          <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">{label}</div>
                            {editingLimits === plan.id ? (
                              <input
                                type="number"
                                value={(limitEdits as unknown as Record<string, number>)[key] ?? (planLimits as unknown as Record<string, number>)[key]}
                                onChange={e => setLimitEdits(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                className="w-full text-center bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-gray-900 text-sm"
                              />
                            ) : (
                              <div className="text-gray-900 font-semibold text-sm">
                                {formatLimit((planLimits as unknown as Record<string, number>)[key])}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feature Toggles */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">الميزات</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(featureLabels).map(([key, label]) => {
                        const isOn = planFeatures[key] === 'true';
                        return (
                          <button
                            key={key}
                            onClick={() => toggleFeature(plan.id, key)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm ${
                              isOn
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <span>{label}</span>
                            <div className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-gray-300'}`}>
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
