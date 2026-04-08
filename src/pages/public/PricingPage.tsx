// ============================================================================
// SENDA — Pricing Page (الباقات)
// Light theme · Teal accent · Premium · Elegant
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X as XIcon } from 'lucide-react';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'EN',
    nav: ['من نحن', 'المميزات', 'الباقات', 'الأسئلة الشائعة', 'المدونة', 'تواصل معنا'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'دخول',
    heroTag: 'الخطط والأسعار',
    heroH1: 'ابدأ بالخطة المناسبة لعملك',
    heroSub: 'جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة',
    mo: 'ر.س/شهر',
    mostPopular: 'الأكثر طلبًا',
    contactSales: 'تواصل مع المبيعات',
    ctaDefault: 'ابدأ مجانًا',
    ctaHighlight: 'ابدأ مجانًا الآن',
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
    footer: '© 2025 سيندا — جميع الحقوق محفوظة',
  },
  en: {
    dir: 'ltr',
    langToggle: 'ع',
    nav: ['About', 'Features', 'Pricing', 'FAQ', 'Blog', 'Contact'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'Login',
    heroTag: 'Plans & Pricing',
    heroH1: 'Start with the Right Plan for Your Business',
    heroSub: 'All plans include a free trial — no credit card required',
    mo: 'SAR/mo',
    mostPopular: 'Most Popular',
    contactSales: 'Contact Sales',
    ctaDefault: 'Start Free',
    ctaHighlight: 'Start Free Now',
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
    footer: '© 2025 SENDA — All rights reserved',
  },
};

const PLAN_NAMES = ['Orbit', 'Nova', 'Galaxy', 'Infinity'];

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];
  const isAr = lang === 'ar';

  return (
    <div dir={t.dir} className="min-h-screen bg-white text-slate-800 font-[IBM_Plex_Sans_Arabic,sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2"><img src="/senda-logo.png" alt="SENDA" className="h-8" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} className="hover:text-teal-600 transition-colors">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-teal-600">{t.langToggle}</button>
            <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700">{t.loginBtn}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full mb-4">{t.heroTag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">{t.heroH1}</h1>
          <p className="text-base text-slate-500 leading-relaxed">{t.heroSub}</p>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.plans.map((plan: any, i: number) => (
            <div key={i} className={`relative rounded-2xl p-6 border transition-all ${plan.popular ? 'border-teal-300 shadow-lg shadow-teal-100/50 scale-[1.02]' : 'border-slate-100 hover:border-teal-200'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-teal-600 px-4 py-1 rounded-full">{t.mostPopular}</span>
              )}
              <div className="text-center mb-5">
                <p className="text-xs text-slate-400 mb-1">{plan.name}</p>
                <h3 className="text-lg font-bold text-slate-900">{isAr ? plan.nameAr : plan.name}</h3>
                {plan.price ? (
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-400 mr-1 ml-1">{t.mo}</span>
                  </div>
                ) : (
                  <p className="text-sm text-teal-600 font-semibold mt-2">{t.contactSales}</p>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 size={15} className="text-teal-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={plan.price ? '/register' : '/contact-us'}
                className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.popular ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border border-teal-200 text-teal-600 hover:bg-teal-50'}`}
              >
                {plan.popular ? t.ctaHighlight : plan.price ? t.ctaDefault : t.contactSales}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">{t.compareTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-start py-3 px-4 font-semibold text-slate-600">{t.compareFeatureCol}</th>
                  {PLAN_NAMES.map(n => <th key={n} className="py-3 px-4 font-semibold text-slate-700 text-center">{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {t.compareRows.map((row: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : ''}>
                    <td className="py-3 px-4 text-slate-700 font-medium">{row.label}</td>
                    {row.vals.map((v: string, j: number) => (
                      <td key={j} className="py-3 px-4 text-center">
                        {v === 'check' ? <CheckCircle2 size={16} className="text-teal-500 mx-auto" />
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

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">{t.footer}</footer>
    </div>
  );
}
