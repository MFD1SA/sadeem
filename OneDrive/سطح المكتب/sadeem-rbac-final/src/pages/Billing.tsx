// ============================================================================
// SADEEM — Billing & Subscription Page
// Shows orbit/nova/galaxy/infinity plans with full feature comparison
// ============================================================================

import { useState, useEffect } from 'react';
import { Check, Zap, Globe, BarChart3, Shield, Infinity as InfinityIcon } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { plansService, type DbPlan, type DbPlanLimits } from '@/services/plans';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PLAN_ICONS: Record<string, React.ElementType<any>> = {
  orbit: Globe,
  nova: Zap,
  galaxy: BarChart3,
  infinity: InfinityIcon,
};

const PLAN_GRADIENTS: Record<string, string> = {
  orbit:    'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  nova:     'from-purple-500/10 to-pink-500/10 border-purple-500/30',
  galaxy:   'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  infinity: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
};

const PLAN_ICON_COLORS: Record<string, string> = {
  orbit:    'text-blue-400 bg-blue-500/10',
  nova:     'text-purple-400 bg-purple-500/10',
  galaxy:   'text-amber-400 bg-amber-500/10',
  infinity: 'text-emerald-400 bg-emerald-500/10',
};

const FEATURE_LABELS: Record<string, string> = {
  google_integration: 'ربط Google Business',
  ai_auto_reply:      'الرد الآلي بالذكاء الاصطناعي',
  manual_reply:       'الرد اليدوي',
  templates:          'قوالب الردود',
  notifications:      'الإشعارات الفورية',
  tasks:              'إدارة المهام',
  team_management:    'إدارة الفريق',
  api_access:         'وصول API الكامل',
  advanced_analytics: 'التحليلات المتقدمة',
  branch_comparison:  'مقارنة الفروع',
  premium_support:    'الدعم المميز 24/7',
  qr_landing_page:    'صفحة هبوط QR',
  qr_analytics:       'تحليلات رموز QR',
};

export default function Billing() {
  const { subscription, plan: currentPlan, trial } = usePlan();
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [limitsMap, setLimitsMap] = useState<Record<string, DbPlanLimits>>({});
  const [featuresMap, setFeaturesMap] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const ps = await plansService.listActive();
        setPlans(ps);
        const lm: Record<string, DbPlanLimits> = {};
        const fm: Record<string, Record<string, string>> = {};
        await Promise.all(ps.map(async (p) => {
          const [l, f] = await Promise.all([plansService.getLimits(p.id), plansService.getFeatures(p.id)]);
          if (l) lm[p.id] = l;
          fm[p.id] = f;
        }));
        setLimitsMap(lm);
        setFeaturesMap(fm);
      } catch {
        // Fall back to static plans if DB not yet set up
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatLimit = (v: number) =>
    v === -1 || v >= 999999 ? 'غير محدود' : v.toLocaleString('ar-SA');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">الخطط والأسعار</h1>
        <p className="text-slate-400">اختر الخطة المناسبة لنشاطك التجاري</p>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-300">
            <Shield size={14} />
            خطتك الحالية: <strong>{currentPlan}</strong>
            {trial.isTrial && ` — تجريبية (${trial.hoursRemaining} ساعة)`}
          </div>
        )}

        {/* Billing Toggle */}
        {plans.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>شهري</span>
            <button
              onClick={() => setYearly(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? 'ltr:translate-x-7 rtl:-translate-x-7' : 'ltr:translate-x-1 rtl:-translate-x-1'}`} />
            </button>
            <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>
              سنوي <span className="text-emerald-400 text-xs">وفّر 15%</span>
            </span>
          </div>
        )}
      </div>

      {plans.length === 0 ? (
        <StaticPlansView currentPlan={currentPlan} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id ||
              (currentPlan === 'starter' && plan.id === 'orbit') ||
              (currentPlan === 'growth' && plan.id === 'nova') ||
              (currentPlan === 'pro' && plan.id === 'galaxy') ||
              (currentPlan === 'enterprise' && plan.id === 'infinity');
            const limits = limitsMap[plan.id];
            const feats = featuresMap[plan.id] || {};
            const Icon = PLAN_ICONS[plan.id] || Star;
            const gradient = PLAN_GRADIENTS[plan.id] || 'from-slate-500/10 to-slate-600/10 border-slate-500/20';
            const iconColor = PLAN_ICON_COLORS[plan.id] || 'text-slate-400 bg-slate-500/10';
            const isPopular = plan.id === 'nova';
            const isCustom = plan.id === 'infinity' && plan.price_monthly === 0;
            const price = yearly ? plan.price_yearly : plan.price_monthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-gradient-to-br ${gradient} p-5 flex flex-col ${isCurrentPlan ? 'ring-2 ring-cyan-500/50' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs text-white font-medium whitespace-nowrap">
                    ⭐ الأكثر شعبية
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 px-2 py-0.5 bg-cyan-500 rounded-full text-xs text-white font-medium">
                    خطتك الحالية
                  </div>
                )}

                {/* Plan identity */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColor}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-0.5">{plan.name_ar}</h3>
                <p className="text-xs text-slate-400 mb-4">{plan.desc_ar || ''}</p>

                {/* Price */}
                <div className="mb-5">
                  {isCustom ? (
                    <div className="text-2xl font-bold text-white">تسعير مخصص</div>
                  ) : (
                    <>
                      <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold text-white">{price.toLocaleString('ar-SA')}</span>
                        <span className="text-sm text-slate-400 pb-1">ريال/{yearly ? 'سنة' : 'شهر'}</span>
                      </div>
                      {yearly && plan.price_monthly > 0 && (
                        <div className="text-xs text-emerald-400 mt-0.5">
                          وفّر {((plan.price_monthly * 12) - plan.price_yearly).toLocaleString('ar-SA')} ريال
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Key limits */}
                {limits && (
                  <div className="space-y-1.5 mb-5">
                    <LimitRow label="الفروع" value={formatLimit(limits.max_branches)} />
                    <LimitRow label="أعضاء الفريق" value={formatLimit(limits.max_team_members)} />
                    <LimitRow label="ردود AI شهرياً" value={formatLimit(limits.max_ai_replies)} />
                    <LimitRow label="قوالب الردود" value={formatLimit(limits.max_template_replies)} />
                  </div>
                )}

                {/* Features */}
                <div className="space-y-1.5 flex-1 mb-5">
                  {Object.entries(FEATURE_LABELS)
                    .filter(([key]) => feats[key] === 'true')
                    .slice(0, 6)
                    .map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check size={12} className="text-emerald-400 flex-shrink-0" />
                        {label}
                      </div>
                    ))}
                </div>

                {/* CTA */}
                <button
                  disabled={isCurrentPlan}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-white/5 text-slate-500 cursor-default'
                      : isCustom
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20'
                        : isPopular
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {isCurrentPlan ? 'خطتك الحالية' : isCustom ? 'تواصل معنا' : 'ترقية الخطة'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

// Fallback if DB plans not loaded yet
function StaticPlansView({ currentPlan }: { currentPlan: string }) {
  const staticPlans = [
    { id: 'orbit', nameAr: 'مدار', price: 99, icon: Globe, color: 'text-blue-400', features: ['1 فرع', '50 رد AI/شهر', '100 قالب'] },
    { id: 'nova', nameAr: 'نوفا', price: 199, icon: Zap, color: 'text-purple-400', popular: true, features: ['3 فروع', '300 رد AI/شهر', '500 قالب', 'إدارة فريق'] },
    { id: 'galaxy', nameAr: 'جالاكسي', price: 399, icon: BarChart3, color: 'text-amber-400', features: ['10 فروع', '1500 رد AI/شهر', 'قوالب لا محدودة', 'دعم مميز'] },
    { id: 'infinity', nameAr: 'إنفينيتي', price: 0, icon: InfinityIcon, color: 'text-emerald-400', features: ['فروع لا محدودة', 'ردود AI لا محدودة', 'وصول API كامل', 'دعم VIP'] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {staticPlans.map((p) => {
        const Icon = p.icon;
        const isCurrent = currentPlan === p.id;
        return (
          <div key={p.id} className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col relative ${isCurrent ? 'ring-2 ring-cyan-500/50' : ''}`}>
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs text-white font-medium whitespace-nowrap">
                ⭐ الأكثر شعبية
              </div>
            )}
            <Icon size={24} className={`${p.color} mb-3`} />
            <h3 className="text-lg font-bold text-white mb-1">{p.nameAr}</h3>
            <div className="text-xl font-bold text-white mb-4">
              {p.price > 0 ? `${p.price} ريال/شهر` : 'تسعير مخصص'}
            </div>
            <div className="space-y-2 flex-1">
              {p.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <Check size={12} className="text-emerald-400" /> {f}
                </div>
              ))}
            </div>
            <button disabled={isCurrent} className={`mt-4 w-full py-2.5 rounded-xl text-sm font-medium ${isCurrent ? 'bg-white/5 text-slate-500' : 'bg-white/10 text-white hover:bg-white/15'}`}>
              {isCurrent ? 'خطتك الحالية' : 'اختيار'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
