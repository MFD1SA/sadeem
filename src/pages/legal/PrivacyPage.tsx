// ============================================================================
// SENDA — Privacy Policy (سياسة الخصوصية)
// ============================================================================
import { useState, useEffect } from 'react';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'قانوني',
    heroH1: 'سياسة الخصوصية',
    heroSub: 'آخر تحديث: مارس 2026',
    sections: [
      { title: 'المقدمة', content: 'تلتزم سيندا بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع المعلومات واستخدامها وحمايتها عند استخدامك لخدماتنا.' },
      { title: 'المعلومات التي نجمعها', content: 'نجمع المعلومات التالية عند استخدامك لسيندا:', list: ['معلومات الحساب: الاسم، البريد الإلكتروني، اسم الشركة', 'بيانات الاستخدام: التقييمات، الردود، إحصاءات الأداء', 'معلومات الفواتير: بيانات الاشتراك (دون تخزين بيانات البطاقة مباشرة)', 'بيانات تقنية: عنوان IP، نوع المتصفح، سجلات الاستخدام'] },
      { title: 'كيف نستخدم بياناتك', list: ['تقديم خدمات سيندا وتحسينها باستمرار', 'إرسال إشعارات متعلقة بحسابك وتقييماتك', 'تحسين تجربة المستخدم بناءً على أنماط الاستخدام', 'الامتثال للمتطلبات القانونية والتنظيمية'] },
      { title: 'حماية بياناتك', content: 'نستخدم معايير تشفير SSL/TLS لحماية البيانات أثناء النقل. يتم تخزين البيانات على خوادم آمنة مع نسخ احتياطية تلقائية يومية. لا نبيع بياناتك أو نشاركها مع أطراف ثالثة لأغراض تجارية.' },
      { title: 'ملفات تعريف الارتباط (Cookies)', content: 'نستخدم ملفات تعريف الارتباط الأساسية للحفاظ على جلسة تسجيل الدخول وتحسين أداء الخدمة. يمكنك إدارة إعدادات ملفات تعريف الارتباط من إعدادات متصفحك.' },
      { title: 'حقوقك', list: ['الحق في الاطلاع على بياناتك الشخصية المخزنة', 'الحق في تصحيح أي معلومات غير دقيقة', 'الحق في طلب حذف حسابك وبياناتك', 'الحق في نقل بياناتك لخدمة أخرى'] },
      { title: 'التواصل معنا', content: 'لأي استفسار يتعلق بخصوصيتك أو بياناتك، يمكنك التواصل معنا عبر نموذج التواصل في الصفحة الرئيسية. سنرد على استفساراتك خلال 48 ساعة عمل.' },
    ],
  },
  en: {
    heroTag: 'Legal',
    heroH1: 'Privacy Policy',
    heroSub: 'Last updated: March 2026',
    sections: [
      { title: 'Introduction', content: 'SENDA is committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect information when you use our platform.' },
      { title: 'Information We Collect', content: 'We collect the following information when you use the platform:', list: ['Account information: name, email, company name', 'Usage data: reviews, responses, performance statistics', 'Billing information: subscription data (without directly storing card details)', 'Technical data: IP address, browser type, usage logs'] },
      { title: 'How We Use Your Data', list: ['Providing and continuously improving platform services', 'Sending notifications related to your account and reviews', 'Improving user experience based on usage patterns', 'Compliance with legal and regulatory requirements'] },
      { title: 'Protecting Your Data', content: 'We use SSL/TLS encryption standards to protect data in transit. Data is stored on secure servers with automatic daily backups. We do not sell or share your data with third parties for commercial purposes.' },
      { title: 'Cookies', content: 'We use essential cookies to maintain your login session and improve platform performance. You can manage cookie settings from your browser settings.' },
      { title: 'Your Rights', list: ['Right to access your stored personal data', 'Right to correct any inaccurate information', 'Right to request deletion of your account and data', 'Right to transfer your data to another platform'] },
      { title: 'Contact Us', content: 'For any inquiries regarding your privacy or data, you can contact us through the contact form on the main page. We will respond to your inquiries within 48 business hours.' },
    ],
  },
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const t = T[lang];

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — سياسة الخصوصية' : 'SENDA | سيندا — Privacy Policy'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => { const next = l === 'ar' ? 'en' : 'ar'; saveLang(next); return next; })}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">{t.heroSub}</p>
        </div>
      </section>

      {/* Sections */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {t.sections.map((s: any, i: number) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-7 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0F1A2E] flex items-center justify-center text-xs font-bold text-blue-300">{i + 1}</span>
                <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h2>
              {s.content && <p className="text-sm text-slate-500 leading-relaxed mb-3">{s.content}</p>}
              {s.list && (
                <ul className="space-y-2 text-sm text-slate-500 leading-relaxed">
                  {s.list.map((item: string, j: number) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-800 mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
