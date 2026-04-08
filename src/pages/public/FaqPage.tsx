// ============================================================================
// SENDA — FAQ Page (الأسئلة الشائعة)
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'الأسئلة الشائعة',
    heroH1: 'إجابات على أهم تساؤلاتك',
    heroSub: 'لم تجد إجابتك؟ تواصل معنا مباشرة وسنسعد بمساعدتك',
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
    ctaBtn: 'تواصل معنا',
  },
  en: {
    heroTag: 'FAQ',
    heroH1: 'Answers to Your Most Common Questions',
    heroSub: 'Can\'t find your answer? Contact us directly and we\'ll be happy to help',
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
    ctaBtn: 'Contact Us',
  },
};

export default function FaqPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const t = T[lang];

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold text-blue-900 bg-blue-50 px-4 py-1.5 rounded-full mb-4">{t.heroTag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">{t.heroH1}</h1>
          <p className="text-base text-slate-500 leading-relaxed">{t.heroSub}</p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {t.faqs.map((faq: any, i: number) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className={`rounded-xl border transition-colors ${isOpen ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-white'}`}>
                <button onClick={() => setOpenIdx(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-start">
                  <span className="font-semibold text-slate-900 text-sm">{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} className="text-blue-900 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
                </button>
                {isOpen && <div className="px-5 pb-5"><p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p></div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.ctaTitle}</h2>
          <Link to="/contact-us" className="inline-block bg-[#0F1A2E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#162032] transition-colors">{t.ctaBtn}</Link>
        </div>
      </section>
    </PublicLayout>
  );
}
