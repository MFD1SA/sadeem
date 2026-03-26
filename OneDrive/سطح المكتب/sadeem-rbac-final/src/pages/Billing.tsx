// ============================================================================
// SADEEM — Billing & Subscription Page (Light Theme)
// ============================================================================
import { useState, useEffect } from 'react';
import { Check, Zap, Globe, BarChart3, Infinity as InfinityIcon, Shield, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { plansService, type DbPlan, type DbPlanLimits } from '@/services/plans';
import { useLanguage } from '@/i18n';

const PLAN_ICONS: Record<string, React.ElementType> = {
  orbit: Globe, nova: Zap, galaxy: BarChart3, infinity: InfinityIcon,
};

const PLAN_COLORS: Record<string, { border: string; bg: string; badge: string; btn: string }> = {
  orbit:    { border: 'border-blue-200',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  nova:     { border: 'border-purple-300', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700' },
  galaxy:   { border: 'border-amber-200',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700',  btn: 'bg-amber-600 hover:bg-amber-700' },
  infinity: { border: 'border-emerald-200',bg: 'bg-emerald-50',badge: 'bg-emerald-100 text-emerald-700',btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

const FEATURE_LABELS: Record<string, string> = {
  google_integration: 'ربط Google Business',
  ai_auto_reply: 'الرد الآلي بالذكاء الاصطناعي',
  manual_reply: 'الرد اليدوي',
  templates: 'قوالب الردود',
  notifications: 'الإشعارات الفورية',
  tasks: 'إدارة المهام',
  team_management: 'إدارة الفريق',
  api_access: 'وصول API الكامل',
  advanced_analytics: 'التحليلات المتقدمة',
  branch_comparison: 'مقارنة الفروع',
  premium_support: 'الدعم المميز 24/7',
  qr_landing_page: 'صفحة هبوط QR',
  qr_analytics: 'تحليلات رموز QR',
};

export default function Billing() {
  const { subscription, plan: currentPlan, trial } = usePlan();
  const { lang } = useLanguage();
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [limitsMap, setLimitsMap] = useState<Record<string, DbPlanLimits>>({});
  const [featuresMap, setFeaturesMap] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
      } catch { /* fall back to static */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const fmt = (v: number) => v === -1 || v >= 999999 ? (lang === 'ar' ? 'غير محدود' : 'Unlimited') : v.toLocaleString('ar-SA');

  if (loading) return (
    <div className="card"><div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" /></div></div>
  );

  return (
    <div className="space-y-5">
      {/* Current plan banner */}
      {subscription && (
        <div className="card card-body">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-content-primary">
                {lang === 'ar' ? 'خطتك الحالية:' : 'Current plan:'} <span className="text-brand-600">{currentPlan}</span>
                {trial.isTrial && <span className="mr-2 text-xs text-amber-600 font-normal">({lang === 'ar' ? `تجريبية — ${trial.hoursRemaining} ساعة متبقية` : `Trial — ${trial.hoursRemaining}h left`})</span>}
              </div>
              <div className="text-xs text-content-tertiary mt-0.5">
                {lang === 'ar' ? `استخدام AI: ${trial.aiUsed} رد` : `AI usage: ${trial.aiUsed} replies`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content-primary">{lang === 'ar' ? 'الخطط المتاحة' : 'Available Plans'}</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={!yearly ? 'text-content-primary font-medium' : 'text-content-tertiary'}>{lang === 'ar' ? 'شهري' : 'Monthly'}</span>
          <button onClick={() => setYearly(v => !v)} className={`relative w-10 h-5 rounded-full transition-colors ${yearly ? 'bg-brand-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'}`} />
          </button>
          <span className={yearly ? 'text-content-primary font-medium' : 'text-content-tertiary'}>
            {lang === 'ar' ? 'سنوي' : 'Yearly'} <span className="text-emerald-600">{lang === 'ar' ? 'وفّر 15%' : 'Save 15%'}</span>
          </span>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {(plans.length > 0 ? plans : STATIC_PLANS).map((plan) => {
          const isCurrent = currentPlan === plan.id || (currentPlan === 'pro' && plan.id === 'galaxy');
          const limits = limitsMap[plan.id];
          const feats = featuresMap[plan.id] || {};
          const Icon = PLAN_ICONS[plan.id] || Globe;
          const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.orbit;
          const isPopular = plan.id === 'nova';
          const isCustom = plan.id === 'infinity' && plan.price_monthly === 0;
          const price = yearly ? plan.price_yearly : plan.price_monthly;
          const isExpanded = expanded === plan.id;

          return (
            <div key={plan.id} className={`card relative flex flex-col border-2 ${isCurrent ? 'border-brand-400' : colors.border}`}>
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-600 rounded-full text-[10px] text-white font-medium whitespace-nowrap flex items-center gap-1">
                  <Star size={9} /> {lang === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-3 px-3 py-0.5 bg-brand-600 rounded-full text-[10px] text-white font-medium whitespace-nowrap">
                  ✓ {lang === 'ar' ? 'خطتك الحالية' : 'Current Plan'}
                </div>
              )}

              <div className={`p-4 rounded-t-xl ${colors.bg}`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.badge}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-content-primary text-sm">{plan.name_ar}</div>
                    <div className="text-[10px] text-content-tertiary">{plan.desc_ar}</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-content-primary">
                  {isCustom ? (lang === 'ar' ? 'تسعير مخصص' : 'Custom') : `${price} ${lang === 'ar' ? 'ر.س' : 'SAR'}`}
                  {!isCustom && <span className="text-xs font-normal text-content-tertiary">/{yearly ? (lang === 'ar' ? 'سنة' : 'yr') : (lang === 'ar' ? 'شهر' : 'mo')}</span>}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                {limits && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { l: lang === 'ar' ? 'فروع' : 'Branches', v: fmt(limits.max_branches) },
                      { l: lang === 'ar' ? 'فريق' : 'Team', v: fmt(limits.max_team_members) },
                      { l: lang === 'ar' ? 'ردود AI' : 'AI replies', v: fmt(limits.max_ai_replies) },
                      { l: lang === 'ar' ? 'قوالب' : 'Templates', v: fmt(limits.max_template_replies) },
                    ].map(({ l, v }) => (
                      <div key={l} className="bg-surface-secondary rounded-lg px-2 py-1.5 text-center">
                        <div className="text-xs font-semibold text-content-primary">{v}</div>
                        <div className="text-[10px] text-content-tertiary">{l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features toggle */}
                <button onClick={() => setExpanded(isExpanded ? null : plan.id)} className="flex items-center justify-between text-xs text-content-secondary hover:text-content-primary transition-colors">
                  <span>{lang === 'ar' ? 'الميزات المتاحة' : 'Features'}</span>
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {isExpanded && (
                  <div className="space-y-1 border-t border-border pt-2">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                      const on = feats[key] === 'true';
                      return (
                        <div key={key} className={`flex items-center gap-1.5 text-xs ${on ? 'text-content-primary' : 'text-content-tertiary line-through'}`}>
                          <Check size={11} className={on ? 'text-emerald-500' : 'text-gray-300'} />
                          {label}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-auto pt-2">
                  <button disabled={isCurrent} className={`w-full py-2 rounded-lg text-xs font-medium text-white transition-colors ${isCurrent ? 'bg-gray-200 text-gray-400 cursor-default' : colors.btn}`}>
                    {isCurrent ? (lang === 'ar' ? 'خطتك الحالية' : 'Current Plan') : isCustom ? (lang === 'ar' ? 'تواصل معنا' : 'Contact Us') : (lang === 'ar' ? 'ترقية' : 'Upgrade')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATIC_PLANS: DbPlan[] = [
  { id: 'orbit', name_ar: 'مدار', name_en: 'Orbit', desc_ar: 'للأنشطة الناشئة', desc_en: 'For small businesses', price_monthly: 99, price_yearly: 990, is_active: true, sort_order: 1, created_at: '', updated_at: '' },
  { id: 'nova', name_ar: 'نوفا', name_en: 'Nova', desc_ar: 'للأنشطة المتنامية', desc_en: 'For growing businesses', price_monthly: 199, price_yearly: 1990, is_active: true, sort_order: 2, created_at: '', updated_at: '' },
  { id: 'galaxy', name_ar: 'جالاكسي', name_en: 'Galaxy', desc_ar: 'للشركات المتقدمة', desc_en: 'For advanced companies', price_monthly: 399, price_yearly: 3990, is_active: true, sort_order: 3, created_at: '', updated_at: '' },
  { id: 'infinity', name_ar: 'إنفينيتي', name_en: 'Infinity', desc_ar: 'حلول مخصصة', desc_en: 'Custom solutions', price_monthly: 0, price_yearly: 0, is_active: true, sort_order: 4, created_at: '', updated_at: '' },
];
