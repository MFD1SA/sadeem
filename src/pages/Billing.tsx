// ============================================================================
// SADEEM — Billing & Subscription Page
// Plan cards: vertical layout, all features always visible, English numbers.
// ============================================================================
import { useState, useEffect } from 'react';
import {
  Check, X, Zap, Globe, BarChart3, Infinity as InfinityIcon,
  Shield, Star, Phone,
} from 'lucide-react';
import { usePlan } from '@/hooks/usePlan';
import { plansService, type DbPlan, type DbPlanLimits } from '@/services/plans';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n';

const PLAN_ICONS: Record<string, React.ElementType> = {
  orbit: Globe, nova: Zap, galaxy: BarChart3, infinity: InfinityIcon,
};

const PLAN_COLORS: Record<string, {
  border: string; headerBg: string; iconBg: string; iconText: string;
  badge: string; btn: string; popular?: boolean;
}> = {
  orbit: {
    border: 'border-slate-200',
    headerBg: 'bg-slate-50',
    iconBg: 'bg-slate-100', iconText: 'text-slate-600',
    badge: 'bg-slate-100 text-slate-600',
    btn: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  nova: {
    border: 'border-violet-300',
    headerBg: 'bg-gradient-to-b from-violet-50 to-white',
    iconBg: 'bg-violet-100', iconText: 'text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
    popular: true,
  },
  galaxy: {
    border: 'border-amber-300',
    headerBg: 'bg-gradient-to-b from-amber-50 to-white',
    iconBg: 'bg-amber-100', iconText: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  infinity: {
    border: 'border-emerald-300',
    headerBg: 'bg-gradient-to-b from-emerald-50 to-white',
    iconBg: 'bg-emerald-100', iconText: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

const FEATURE_LABELS: Record<string, { ar: string; en: string }> = {
  google_integration: { ar: 'ربط Google Business', en: 'Google Business integration' },
  ai_auto_reply:      { ar: 'الرد الآلي بالذكاء الاصطناعي', en: 'AI auto-reply' },
  manual_reply:       { ar: 'الرد اليدوي', en: 'Manual reply' },
  templates:          { ar: 'قوالب الردود', en: 'Reply templates' },
  notifications:      { ar: 'الإشعارات الفورية', en: 'Real-time notifications' },
  tasks:              { ar: 'إدارة المهام', en: 'Task management' },
  team_management:    { ar: 'إدارة الفريق', en: 'Team management' },
  api_access:         { ar: 'وصول API الكامل', en: 'Full API access' },
  advanced_analytics: { ar: 'التحليلات المتقدمة', en: 'Advanced analytics' },
  branch_comparison:  { ar: 'مقارنة الفروع', en: 'Branch comparison' },
  premium_support:    { ar: 'الدعم المميز 24/7', en: 'Premium support 24/7' },
  qr_landing_page:    { ar: 'صفحة هبوط QR', en: 'QR landing page' },
  qr_analytics:       { ar: 'تحليلات رموز QR', en: 'QR analytics' },
};

// English number formatting (always en-US regardless of UI language)
const fmt = (v: number, unlimitedLabel: string) =>
  v === -1 || v >= 999999
    ? unlimitedLabel
    : v.toLocaleString('en-US');

export default function Billing() {
  const { subscription, plan: currentPlan, trial } = usePlan();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [limitsMap, setLimitsMap] = useState<Record<string, DbPlanLimits>>({});
  const [featuresMap, setFeaturesMap] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState(15);

  useEffect(() => {
    async function load() {
      try {
        const [ps, vatResult] = await Promise.all([
          plansService.listActive(),
          supabase.rpc('get_billing_settings'),
        ]);
        setPlans(ps);
        if (vatResult.data) {
          setVatEnabled(vatResult.data.vat_enabled ?? false);
          setVatRate(vatResult.data.vat_rate ?? 15);
        }
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

  if (loading) return (
    <div className="card">
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
      </div>
    </div>
  );

  const displayPlans = plans.length > 0 ? plans : STATIC_PLANS;

  return (
    <div className="space-y-5">

      {/* ── Current plan banner ── */}
      {subscription && (
        <div className="card card-body">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-content-primary">
                {t.billingPage.currentPlan + ':'}{' '}
                <span className="text-brand-600">{currentPlan}</span>
                {trial.isTrial && (
                  <span className="mr-2 text-xs text-amber-600 font-normal">
                    ({t.billingExt?.trial || (isAr ? 'تجريبية' : 'Trial')} — {trial.hoursRemaining} {t.billingExt?.hoursLeft || (isAr ? 'ساعة متبقية' : 'h left')})
                  </span>
                )}
              </div>
              <div className="text-xs text-content-tertiary mt-0.5">
                {(t.billingExt?.aiUsage || (isAr ? 'استخدام AI' : 'AI usage')) + `: ${trial.aiUsed.toLocaleString('en-US')} ${t.billingExt.aiReplies}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly / Yearly toggle ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content-primary">
          {t.billingPage.title}
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className={!yearly ? 'text-content-primary font-medium' : 'text-content-tertiary'}>
            {t.billingExt.monthly}
          </span>
          <button
            onClick={() => setYearly(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors focus:outline-2 focus:outline-brand-500 focus:outline-offset-2 ${yearly ? 'bg-brand-600' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={yearly}
            aria-label={t.billingExt?.toggleBilling || (isAr ? 'تبديل الفوترة السنوية' : 'Toggle yearly billing')}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${yearly ? 'ltr:translate-x-5 rtl:-translate-x-5' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'}`} />
          </button>
          <span className={yearly ? 'text-content-primary font-medium' : 'text-content-tertiary'}>
            {t.billingExt.annual}{' '}
            <span className="text-emerald-600">{t.billingExt.annualDiscount}</span>
          </span>
        </div>
      </div>

      {/* ── Plans grid — vertical cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {displayPlans.map((plan) => {
          const isCurrent = currentPlan === plan.id || (currentPlan === 'pro' && plan.id === 'galaxy');
          const limits    = limitsMap[plan.id];
          const feats     = featuresMap[plan.id] || {};
          const Icon      = PLAN_ICONS[plan.id] || Globe;
          const colors    = PLAN_COLORS[plan.id] || PLAN_COLORS.orbit;
          const isCustom  = plan.id === 'infinity' && plan.price_monthly === 0;
          const price     = yearly ? plan.price_yearly : plan.price_monthly;

          return (
            <div
              key={plan.id}
              className={`card flex flex-col border-2 relative ${isCurrent ? 'border-brand-500 shadow-md' : colors.border}`}
            >
              {/* Popular badge */}
              {colors.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 rounded-full text-[10px] text-white font-medium whitespace-nowrap flex items-center gap-1">
                  <Star size={9} /> {t.billingExt?.mostPopular || (isAr ? 'الأكثر شعبية' : 'Most Popular')}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 ltr:right-3 rtl:left-3 px-3 py-0.5 bg-brand-600 rounded-full text-[10px] text-white font-medium whitespace-nowrap">
                  ✓ {t.billingExt.currentPlan}
                </div>
              )}

              {/* Card header */}
              <div className={`p-4 rounded-t-xl ${colors.headerBg}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
                    <Icon size={17} className={colors.iconText} />
                  </div>
                  <div>
                    <div className="font-bold text-content-primary text-sm">{t.billingPage.plans?.[plan.id as keyof typeof t.billingPage.plans] || (isAr ? plan.name_ar : plan.name_en)}</div>
                    <div className="text-[10px] text-content-tertiary">{isAr ? plan.desc_ar : plan.desc_en}</div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-extrabold text-content-primary leading-none">
                    {isCustom ? (t.billingExt?.custom || (isAr ? 'مخصص' : 'Custom')) : price.toLocaleString('en-US')}
                  </span>
                  {!isCustom && (
                    <span className="text-xs text-content-tertiary mb-0.5">
                      {t.common.sar}/{yearly ? (t.billingExt?.perYear || (isAr ? 'سنة' : 'yr')) : (t.billingExt.perMonth || (isAr ? 'شهر' : 'mo'))}
                    </span>
                  )}
                </div>
                {!isCustom && (
                  <div className="text-[10px] text-content-tertiary">
                    {t.billingExt?.beforeVat || (isAr ? 'غير شامل الضريبة' : 'Before VAT')}
                  </div>
                )}
                {yearly && !isCustom && (
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    {(t.billingExt?.saves || (isAr ? 'يوفر' : 'Saves')) + ` ${(plan.price_monthly * 12 - plan.price_yearly).toLocaleString('en-US')} ${t.common.sar}/${t.billingExt?.perYear || (isAr ? 'سنة' : 'yr')}`}
                  </div>
                )}
                {/* VAT breakdown */}
                {vatEnabled && !isCustom && price > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                    <div className="flex justify-between text-[11px] text-content-tertiary">
                      <span>{t.billingExt?.subtotal || (isAr ? 'المبلغ قبل الضريبة' : 'Subtotal')}</span>
                      <span dir="ltr">{price.toLocaleString('en-US')} {t.common.sar}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-content-tertiary">
                      <span>{(t.billingExt?.vat || 'VAT') + ` (${vatRate}%)`}</span>
                      <span dir="ltr">{(price * vatRate / 100).toFixed(2)} {t.common.sar}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-content-primary pt-0.5 border-t border-gray-100">
                      <span>{t.billingExt?.totalInclVat || (isAr ? 'الإجمالي شامل الضريبة' : 'Total incl. VAT')}</span>
                      <span dir="ltr">{(price * (1 + vatRate / 100)).toFixed(2)} {t.common.sar}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4 flex-1 flex flex-col gap-4">

                {/* Limits grid */}
                {limits && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { l: t.billingExt.branches,        v: fmt(limits.max_branches, t.billingExt.unlimited) },
                      { l: t.billingExt.teamMembers,     v: fmt(limits.max_team_members, t.billingExt.unlimited) },
                      { l: t.billingExt.aiReplies,       v: fmt(limits.max_ai_replies, t.billingExt.unlimited) },
                      { l: t.billingExt.templateReplies,  v: fmt(limits.max_template_replies, t.billingExt.unlimited) },
                    ].map(({ l, v }) => (
                      <div key={l} className="bg-surface-secondary rounded-lg px-2 py-1.5 text-center">
                        <div className="text-xs font-bold text-content-primary">{v}</div>
                        <div className="text-[10px] text-content-tertiary">{l}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features — always visible */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-content-secondary mb-1">
                    {t.billingExt.features}
                  </div>
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const on = feats[key] === 'true';
                    return (
                      <div key={key} className={`flex items-center gap-2 text-xs ${on ? 'text-content-primary' : 'text-content-tertiary'}`}>
                        {on
                          ? <Check size={13} className="text-emerald-500 flex-shrink-0" />
                          : <X     size={13} className="text-gray-300 flex-shrink-0" />}
                        <span className={on ? '' : 'line-through'}>{isAr ? label.ar : label.en}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA button */}
                <div className="mt-auto pt-1">
                  <button
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : isCustom
                          ? `${colors.btn}`
                          : colors.btn
                    }`}
                  >
                    {isCurrent
                      ? `✓ ${t.billingExt.currentPlan}`
                      : isCustom
                        ? <><Phone size={13} />{t.billingExt.contactSales}</>
                        : t.billingExt.upgrade}
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
  { id: 'orbit',    name_ar: 'مدار',      name_en: 'Orbit',    desc_ar: 'للأنشطة الناشئة',    desc_en: 'For small businesses',   price_monthly: 99,  price_yearly: 990,  is_active: true, sort_order: 1 },
  { id: 'nova',     name_ar: 'نوفا',      name_en: 'Nova',     desc_ar: 'للأنشطة المتنامية',  desc_en: 'For growing businesses', price_monthly: 199, price_yearly: 1990, is_active: true, sort_order: 2 },
  { id: 'galaxy',   name_ar: 'جالكسي',  name_en: 'Galaxy',   desc_ar: 'للشركات المتقدمة',   desc_en: 'For advanced companies', price_monthly: 399, price_yearly: 3990, is_active: true, sort_order: 3 },
  { id: 'infinity', name_ar: 'إنفينيتي', name_en: 'Infinity', desc_ar: 'حلول مخصصة للمؤسسات', desc_en: 'Custom enterprise solutions', price_monthly: 0, price_yearly: 0, is_active: true, sort_order: 4 },
];
