// ============================================================================
// SENDA — FAQ Page (الأسئلة الشائعة) — Premium Design
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'الأسئلة الشائعة',
    heroH1: 'إجابات على أهم تساؤلاتك',
    heroSub: 'لم تجد إجابتك؟ تواصل معنا مباشرة وسنسعد بمساعدتك',
    heroBtn: 'تواصل معنا',
    faqs: [
      { q: 'ما هي سيندا؟', a: 'سيندا هي منصة سعودية متكاملة لإدارة تقييمات Google Business، الردود الذكية بالذكاء الاصطناعي، تحليلات الأداء، وإدارة الفروع والفريق من مكان واحد.' },
      { q: 'هل يمكنني تجربة المنصة مجانًا؟', a: 'نعم، جميع الخطط تتضمن فترة تجريبية مجانية بدون الحاجة لبطاقة ائتمان. يمكنك البدء فورًا واستكشاف جميع المميزات.' },
      { q: 'كيف يعمل الرد الذكي بالذكاء الاصطناعي؟', a: 'يقوم الذكاء الاصطناعي بتحليل نص التقييم وصياغة رد احترافي يتناسب مع محتوى التقييم ونبرة علامتك التجارية تلقائيًا، مع إمكانية التعديل قبل النشر.' },
      { q: 'هل أحتاج خبرة تقنية لاستخدام المنصة؟', a: 'لا، سيندا مصممة لتكون سهلة الاستخدام. كل ما تحتاجه هو ربط حساب Google Business الخاص بك والبدء في إدارة تقييماتك فورًا.' },
      { q: 'هل يمكنني إدارة أكثر من فرع؟', a: 'نعم، خطط نوفا وجالكسي وإنفينيتي تدعم إدارة فروع متعددة من لوحة تحكم مركزية واحدة مع إمكانية المقارنة بين أداء الفروع.' },
      { q: 'كيف يتم حماية بياناتي؟', a: 'نستخدم أعلى معايير الأمان بما في ذلك تشفير البيانات، حماية الجلسات، نظام صلاحيات متقدم، وسياسات أمان صارمة تضمن خصوصية بياناتك.' },
      { q: 'ما هي طرق الدفع المتاحة؟', a: 'ندعم الدفع عبر البطاقات الائتمانية (فيزا وماستركارد) والتحويل البنكي، مع إصدار فواتير إلكترونية متوافقة مع ضريبة القيمة المضافة.' },
      { q: 'هل يمكنني تغيير خطتي لاحقًا؟', a: 'نعم، يمكنك الترقية أو تغيير خطتك في أي وقت من لوحة التحكم. التغييرات تسري فورًا ويتم احتساب الفرق بشكل تناسبي.' },
      { q: 'هل تدعم المنصة اللغة الإنجليزية؟', a: 'نعم، المنصة تدعم العربية والإنجليزية بالكامل ويمكنك التبديل بين اللغتين في أي وقت.' },
      { q: 'كيف أتواصل مع الدعم الفني؟', a: 'يمكنك التواصل معنا عبر نموذج التواصل في الموقع أو من خلال نظام التذاكر داخل لوحة التحكم. فريق الدعم متاح على مدار الساعة للخطط المميزة.' },
    ],
    ctaTitle: 'لم تجد إجابتك؟',
    ctaDesc: 'فريقنا جاهز لمساعدتك والإجابة على جميع استفساراتك',
    ctaBtn: 'تواصل معنا',
  },
  en: {
    heroTag: 'FAQ',
    heroH1: 'Answers to Your Most Common Questions',
    heroSub: 'Can\'t find your answer? Contact us directly and we\'ll be happy to help',
    heroBtn: 'Contact Us',
    faqs: [
      { q: 'What is SENDA?', a: 'SENDA is a comprehensive Saudi platform for managing Google Business reviews, AI-powered smart replies, performance analytics, and branch & team management from one place.' },
      { q: 'Can I try the platform for free?', a: 'Yes, all plans include a free trial without requiring a credit card. You can start immediately and explore all features.' },
      { q: 'How does the AI smart reply work?', a: 'The AI analyzes the review text and crafts a professional response that matches the review content and your brand tone automatically, with the ability to edit before publishing.' },
      { q: 'Do I need technical experience?', a: 'No, SENDA is designed to be user-friendly. All you need is to connect your Google Business account and start managing your reviews immediately.' },
      { q: 'Can I manage multiple branches?', a: 'Yes, Nova, Galaxy, and Infinity plans support managing multiple branches from a single centralized dashboard with branch performance comparison.' },
      { q: 'How is my data protected?', a: 'We use the highest security standards including data encryption, session protection, advanced permission systems, and strict security policies ensuring your data privacy.' },
      { q: 'What payment methods are available?', a: 'We support credit card payments (Visa and Mastercard) and bank transfers, with electronic invoicing compliant with VAT regulations.' },
      { q: 'Can I change my plan later?', a: 'Yes, you can upgrade or change your plan at any time from the dashboard. Changes take effect immediately with prorated billing.' },
      { q: 'Does the platform support English?', a: 'Yes, the platform fully supports both Arabic and English and you can switch between languages at any time.' },
      { q: 'How do I contact support?', a: 'You can reach us via the contact form on the website or through the ticket system in the dashboard. Support is available 24/7 for premium plans.' },
    ],
    ctaTitle: 'Can\'t find your answer?',
    ctaDesc: 'Our team is ready to help you and answer all your questions',
    ctaBtn: 'Contact Us',
  },
};

export default function FaqPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const t = T[lang];
  const isRtl = lang === 'ar';

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden py-28 md:py-36" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-semibold text-blue-300/80 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-2 rounded-full mb-6 tracking-wide">{t.heroTag}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{t.heroSub}</p>
          <Link to="/contact-us" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
            {t.heroBtn}
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>

      {/* ═══════════ FAQ ACCORDION ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {t.faqs.map((faq: any, i: number) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className={`rounded-xl border transition-all ${isOpen ? 'border-slate-200 bg-white shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-start">
                  <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-[#0F1A2E]' : 'bg-slate-100'}`}>
                    {isOpen ? <ChevronUp size={16} className="text-white" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </button>
                {isOpen && <div className="px-5 pb-5"><p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p></div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative text-center px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t.ctaTitle}</h2>
            <p className="text-sm text-slate-400 mb-8">{t.ctaDesc}</p>
            <Link to="/contact-us" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
              {t.ctaBtn}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
