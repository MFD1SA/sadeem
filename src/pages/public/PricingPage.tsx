// ============================================================================
// SENDA — Pricing Page (الباقات) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X as XIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'الخطط والأسعار',
    heroH1: 'ابدأ بالخطة المناسبة لعملك',
    heroSub: 'جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة',
    heroBtn: 'ابدأ تجربتك المجانية',
    mo: 'ر.س/شهر',
    mostPopular: 'الأكثر طلبًا',
    contactSales: 'تواصل مع المبيعات',
    ctaDefault: 'اشترك الآن',
    ctaHighlight: 'اشترك الآن',
    plans: [
      { name: 'Orbit', nameAr: 'مدار', price: '99', features: ['1 فرع', '1 عضو فريق', '50 رد ذكي شهريًا', '100 رد قالب', 'ربط Google Business', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية'] },
      { name: 'Nova', nameAr: 'نوفا', price: '199', popular: true, features: ['3 فروع', '3 أعضاء فريق', '300 رد ذكي شهريًا', '500 رد قالب', 'ربط Google Business', 'الرد الآلي بالذكاء الاصطناعي', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية', 'إدارة المهام', 'إدارة الفروع', 'التحليلات المتقدمة', 'صفحة هبوط QR', 'تحليلات رموز QR'] },
      { name: 'Galaxy', nameAr: 'جالكسي', price: '399', features: ['10 فروع', '10 أعضاء فريق', '1,500 رد ذكي شهريًا', 'ردود قوالب غير محدودة', 'ربط Google Business', 'الرد الآلي بالذكاء الاصطناعي', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية', 'إدارة المهام', 'إدارة الفريق', 'التحليلات المتقدمة', 'مقارنة الفروع', 'الدعم المميز 24/7', 'صفحة هبوط QR', 'تحليلات رموز QR'] },
      { name: 'Infinity', nameAr: 'إنفينيتي', price: null, features: ['فروع غير محدودة', 'أعضاء غير محدودين', 'ردود ذكية غير محدودة', 'ردود قوالب غير محدودة', 'حلول مخصصة بلا حدود', 'دعم وتخصيص أعلى'] },
    ],
    compareTitle: 'مقارنة شاملة بين الخطط',
    compareFeatureCol: 'الميزة',
    compareRows: [
      { label: 'عدد الفروع', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'أعضاء الفريق', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'ردود الذكاء الاصطناعي', vals: ['50', '300', '1,500', 'غير محدود'] },
      { label: 'ردود القوالب', vals: ['100', '500', 'غير محدود', 'غير محدود'] },
      { label: 'ربط Google Business', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الرد الآلي بالذكاء الاصطناعي', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الرد اليدوي', vals: ['check', 'check', 'check', 'check'] },
      { label: 'قوالب الردود', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الإشعارات الفورية', vals: ['check', 'check', 'check', 'check'] },
      { label: 'إدارة المهام', vals: ['x', 'check', 'check', 'check'] },
      { label: 'إدارة الفروع', vals: ['x', 'check', 'check', 'check'] },
      { label: 'إدارة الفريق', vals: ['x', 'x', 'check', 'check'] },
      { label: 'التحليلات المتقدمة', vals: ['x', 'check', 'check', 'check'] },
      { label: 'مقارنة الفروع', vals: ['x', 'x', 'check', 'check'] },
      { label: 'الدعم المميز 24/7', vals: ['x', 'x', 'check', 'check'] },
      { label: 'صفحة هبوط QR', vals: ['x', 'check', 'check', 'check'] },
      { label: 'تحليلات رموز QR', vals: ['x', 'check', 'check', 'check'] },
      { label: 'التخصيص', vals: ['x', 'x', 'x', 'check'] },
      { label: 'الحلول الخاصة', vals: ['x', 'x', 'x', 'check'] },
    ],
  },
  en: {
    heroTag: 'Plans & Pricing',
    heroH1: 'Start with the Right Plan for Your Business',
    heroSub: 'All plans include a free trial — no credit card required',
    heroBtn: 'Start Your Free Trial',
    mo: 'SAR/mo',
    mostPopular: 'Most Popular',
    contactSales: 'Contact Sales',
    ctaDefault: 'Subscribe Now',
    ctaHighlight: 'Subscribe Now',
    plans: [
      { name: 'Orbit', nameAr: 'Orbit', price: '99', features: ['1 branch', '1 team member', '50 AI replies/mo', '100 template replies', 'Google Business link', 'Manual replies', 'Reply templates', 'Instant notifications'] },
      { name: 'Nova', nameAr: 'Nova', price: '199', popular: true, features: ['3 branches', '3 team members', '300 AI replies/mo', '500 template replies', 'Google Business link', 'AI auto-replies', 'Manual replies', 'Reply templates', 'Instant notifications', 'Task management', 'Branch management', 'Advanced analytics', 'QR landing page', 'QR analytics'] },
      { name: 'Galaxy', nameAr: 'Galaxy', price: '399', features: ['10 branches', '10 team members', '1,500 AI replies/mo', 'Unlimited templates', 'Google Business link', 'AI auto-replies', 'Manual replies', 'Reply templates', 'Instant notifications', 'Task management', 'Team management', 'Advanced analytics', 'Branch comparison', 'Premium 24/7 support', 'QR landing page', 'QR analytics'] },
      { name: 'Infinity', nameAr: 'Infinity', price: null, features: ['Unlimited branches', 'Unlimited members', 'Unlimited AI replies', 'Unlimited templates', 'Custom solutions', 'Premium support'] },
    ],
    compareTitle: 'Full Plan Comparison',
    compareFeatureCol: 'Feature',
    compareRows: [
      { label: 'Branches', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'Team Members', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'AI Replies', vals: ['50', '300', '1,500', 'Unlimited'] },
      { label: 'Template Replies', vals: ['100', '500', 'Unlimited', 'Unlimited'] },
      { label: 'Google Business', vals: ['check', 'check', 'check', 'check'] },
      { label: 'AI Auto-Replies', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Manual Replies', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Reply Templates', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Notifications', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Task Management', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Branch Management', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Team Management', vals: ['x', 'x', 'check', 'check'] },
      { label: 'Advanced Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Branch Comparison', vals: ['x', 'x', 'check', 'check'] },
      { label: '24/7 Support', vals: ['x', 'x', 'check', 'check'] },
      { label: 'QR Landing Page', vals: ['x', 'check', 'check', 'check'] },
      { label: 'QR Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Customization', vals: ['x', 'x', 'x', 'check'] },
      { label: 'Custom Solutions', vals: ['x', 'x', 'x', 'check'] },
    ],
  },
};

const PLAN_NAMES = ['Orbit', 'Nova', 'Galaxy', 'Infinity'];

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];
  const isAr = lang === 'ar';
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — الباقات' : 'SENDA | سيندا — Pricing'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{t.heroSub}</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
            {t.heroBtn}
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>

      {/* ═══════════ PLAN CARDS ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {t.plans.map((plan: any, i: number) => (
            <div key={i} className={`relative rounded-2xl p-7 border flex flex-col transition-all hover:shadow-lg ${plan.popular ? 'border-blue-200 shadow-lg ring-1 ring-blue-100 bg-white' : 'border-slate-200 shadow-sm bg-white'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-[#0F1A2E] px-4 py-1 rounded-full">{t.mostPopular}</span>
              )}
              <div className="text-center mb-6 min-h-[100px]">
                <h3 className="text-lg font-bold text-slate-900">{isAr ? plan.nameAr : plan.name}</h3>
                {plan.price ? (
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-400 mx-1">{t.mo}</span>
                  </div>
                ) : (
                  <p className="text-sm text-blue-900 font-semibold mt-2">{t.contactSales}</p>
                )}
              </div>
              <div className="h-px bg-slate-100 mb-5" />
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-800 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.price ? '/register' : '/contact-us'}
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors mt-auto ${plan.popular ? 'bg-[#0F1A2E] text-white hover:bg-[#162032]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
              >
                {plan.popular ? t.ctaHighlight : plan.price ? t.ctaDefault : t.contactSales}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">{t.compareTitle}</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className={`py-3.5 px-5 font-semibold text-slate-700 border-b border-slate-100 ${isAr ? 'text-right' : 'text-left'}`}>{t.compareFeatureCol}</th>
                  {t.plans.map((p: any, i: number) => <th key={i} className={`py-3.5 px-4 font-semibold text-center border-b border-slate-100 ${p.popular ? 'text-blue-900 bg-blue-50/50' : 'text-slate-700'}`}>{isAr ? p.nameAr : p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.compareRows.map((row: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                    <td className={`py-3 px-5 font-medium text-slate-700 ${isAr ? 'text-right' : 'text-left'}`}>{row.label}</td>
                    {row.vals.map((v: string, j: number) => (
                      <td key={j} className={`py-3 px-4 text-center ${t.plans[j]?.popular ? 'bg-blue-50/30' : ''}`}>
                        {v === 'check' ? <CheckCircle2 size={16} className="text-blue-800 mx-auto" />
                          : v === 'x' ? <XIcon size={16} className="text-slate-300 mx-auto" />
                          : <span className="text-slate-700 font-medium">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
