// ============================================================================
// SENDA — Terms of Service (شروط الاستخدام)
// ============================================================================
import { useState, useEffect } from 'react';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'قانوني',
    heroH1: 'شروط الاستخدام',
    heroSub: 'آخر تحديث: مارس 2026 — تسري على جميع مستخدمي سيندا',
    sections: [
      { title: 'قبول الشروط', content: 'باستخدامك لسيندا، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على أي من هذه الشروط، يرجى التوقف عن استخدام الخدمة.' },
      { title: 'وصف الخدمة', content: 'سيندا نظام SaaS متخصص في إدارة تقييمات جوجل، ويشمل الخدمات: الرد التلقائي بالذكاء الاصطناعي، إنشاء رموز QR لجمع التقييمات، تقارير الأداء، وإدارة الفريق والفروع.' },
      { title: 'التزامات المستخدم', list: ['تقديم معلومات صحيحة ودقيقة عند التسجيل', 'عدم استخدام الخدمة لأي نشاط مخالف للقانون أو السياسات', 'عدم محاولة اختراق أو التدخل في أنظمة سيندا', 'المسؤولية الكاملة عن محتوى الردود التي تنشرها عبر سيندا', 'الحفاظ على سرية بيانات تسجيل الدخول'] },
      { title: 'الاشتراكات والدفع', content: 'تُدار الاشتراكات على أساس شهري أو سنوي. يحق للمستخدم إلغاء اشتراكه في أي وقت. تُحتسب الرسوم مقدمًا ولا تُرد في حال الإلغاء خلال الفترة الحالية إلا وفق سياسة الاسترداد المعمول بها.' },
      { title: 'الملكية الفكرية', content: 'جميع حقوق الملكية الفكرية لسيندا — بما يشمل الكود والتصاميم والمحتوى — محفوظة لسيندا. يُمنح المستخدم رخصة استخدام محدودة وغير قابلة للتحويل.' },
      { title: 'حدود المسؤولية', content: 'لا تتحمل سيندا مسؤولية أي أضرار غير مباشرة تنجم عن استخدام أو عدم إمكانية استخدام الخدمة. نسعى للحفاظ على مستوى خدمة بنسبة 99.9% لعملاء خطة Galaxy وInfinity.' },
      { title: 'تعديل الشروط', content: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو داخل لوحة التحكم قبل 30 يومًا من سريانها.' },
      { title: 'القانون الحاكم', content: 'تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاع يُحكم وفق الأنظمة السعودية المعمول بها.' },
    ],
  },
  en: {
    heroTag: 'Legal',
    heroH1: 'Terms of Service',
    heroSub: 'Last updated: March 2026 — applies to all SENDA platform users',
    sections: [
      { title: 'Acceptance of Terms', content: 'By using the SENDA platform, you agree to comply with these terms. If you do not agree to any of these terms, please stop using the platform.' },
      { title: 'Service Description', content: 'SENDA is a SaaS platform specialized in Google review management, including services such as AI auto-replies, QR code creation for collecting reviews, performance reports, and team and branch management.' },
      { title: 'User Obligations', list: ['Provide accurate and truthful information during registration', 'Do not use the platform for any activity that violates laws or policies', 'Do not attempt to hack or interfere with platform systems', 'Full responsibility for the content of responses published through the platform', 'Maintain the confidentiality of login credentials'] },
      { title: 'Subscriptions & Payment', content: 'Subscriptions are managed on a monthly or annual basis. Users may cancel their subscription at any time. Fees are charged in advance and are non-refundable for the current period except as per the applicable refund policy.' },
      { title: 'Intellectual Property', content: 'All intellectual property rights of the SENDA platform — including code, designs, and content — are reserved for SENDA. Users are granted a limited, non-transferable license to use the platform.' },
      { title: 'Limitation of Liability', content: 'SENDA is not responsible for any indirect damages resulting from the use or inability to use the service. We strive to maintain a 99.9% service level for Galaxy and Infinity plan customers.' },
      { title: 'Modification of Terms', content: 'We reserve the right to modify these terms at any time. Users will be notified of any material changes via email or within the platform 30 days before they take effect.' },
      { title: 'Governing Law', content: 'These terms are governed by the laws of the Kingdom of Saudi Arabia. Any dispute shall be resolved in accordance with applicable Saudi regulations.' },
    ],
  },
};

export default function TermsPage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const t = T[lang];

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — شروط الاستخدام' : 'SENDA | سيندا — Terms of Service'; }, [lang]);

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
