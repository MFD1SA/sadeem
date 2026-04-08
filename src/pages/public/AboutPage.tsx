// ============================================================================
// SENDA — About Page (من نحن) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Gem, Users, Rocket, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'من نحن',
    heroH1: 'نبني مستقبل إدارة السمعة الرقمية',
    heroSub: 'سيندا حل سعودي ذكي يساعد الأنشطة التجارية على تعزيز حضورها الرقمي وإدارة سمعتها بكفاءة واحترافية',
    heroBtn: 'ابدأ تجربتك المجانية',
    storyTitle: 'قصتنا',
    storyP1: 'وُلدت سيندا من قناعة راسخة بأن السمعة الرقمية هي العملة الأهم في عالم الأعمال الحديث. في سوق تتسارع فيه التحولات الرقمية، رأينا أن الأنشطة التجارية السعودية تستحق أدوات مبنية لفهم واقعها وتحدياتها — لا حلولاً عامة مترجمة من أسواق أخرى.',
    storyP2: 'اليوم، يثق بسيندا مئات الأنشطة التجارية في المملكة — من المتاجر المحلية إلى السلاسل الكبرى — لأنها تجمع بين قوة الذكاء الاصطناعي، وعمق التحليلات، وبساطة التجربة، في نظام واحد صُمم ليعمل من اللحظة الأولى.',
    missionLabel: 'رسالتنا',
    missionTitle: 'تمكين كل نشاط تجاري من بناء سمعة رقمية لا تُنسى',
    missionDesc: 'نؤمن بأن كل تقييم يحمل بذرة نمو حقيقية. سيندا تحوّل آراء عملائك إلى رؤى قابلة للتنفيذ، وردود تبني الثقة، وبيانات تقود قراراتك الاستراتيجية.',
    visionLabel: 'رؤيتنا',
    visionTitle: 'أن نكون الحل الأذكى لإدارة السمعة الرقمية في المنطقة',
    visionDesc: 'نطمح أن يكون سيندا المعيار الذي تُقاس عليه حلول إدارة السمعة الرقمية في العالم العربي — بتقنية متقدمة وتجربة لا مثيل لها.',
    valuesTitle: 'قيمنا الأساسية',
    valuesDesc: 'المبادئ التي توجّه كل قرار نتخذه وكل ميزة نبنيها',
    values: [
      { title: 'الابتكار', desc: 'نوظّف أحدث تقنيات الذكاء الاصطناعي لتمكين عملائنا من التفوّق في سوق يتطور كل يوم', icon: 'Rocket' },
      { title: 'الموثوقية', desc: 'بياناتك أمانة. نطبّق أعلى معايير التشفير والحماية لضمان أمان معلوماتك في كل لحظة', icon: 'ShieldCheck' },
      { title: 'البساطة', desc: 'نؤمن أن القوة الحقيقية تكمن في البساطة. تجربة سلسة تبدأ من اللحظة الأولى دون تعقيد', icon: 'Gem' },
      { title: 'التعاون', desc: 'أدوات مصممة لتوحيد جهود فريقك وتعزيز التناغم بين جميع أعضاء المؤسسة', icon: 'Users' },
    ],
    whyTitle: 'لماذا تختار سيندا؟',
    whyDesc: 'مميزات تجعلنا الخيار الأمثل لإدارة سمعتك الرقمية',
    whyItems: [
      'حل سعودي مصمم للسوق المحلي والعربي',
      'ذكاء اصطناعي متقدم يفهم اللغة العربية',
      'دعم فني متخصص على مدار الساعة',
      'تكامل سلس مع Google Business Profile',
      'تحديثات مستمرة ومميزات جديدة كل شهر',
      'أسعار تنافسية مع فترة تجريبية مجانية',
    ],
    ctaTitle: 'جاهز لتحويل تقييماتك إلى قوة حقيقية؟',
    ctaDesc: 'انضم إلى مئات الأنشطة التجارية التي تثق بسيندا',
    ctaBtn: 'ابدأ تجربتك المجانية',
    ctaSecondary: 'تعرّف على الباقات',
  },
  en: {
    heroTag: 'About Us',
    heroH1: 'Building the Future of Reputation Management',
    heroSub: 'SENDA is a smart Saudi solution empowering businesses to manage reviews and enhance their digital presence with intelligence and efficiency',
    heroBtn: 'Start Your Free Trial',
    storyTitle: 'Our Story',
    storyP1: 'SENDA was born from a deep belief that every review holds a real opportunity for growth. In a market increasingly reliant on digital reviews, we realized businesses need smart, reliable tools to manage their reputation.',
    storyP2: 'Today, SENDA serves hundreds of businesses across Saudi Arabia, from small shops to large chains, providing integrated solutions that combine artificial intelligence with advanced analytics.',
    missionLabel: 'Our Mission',
    missionTitle: 'Empower every business to build a strong digital reputation',
    missionDesc: 'We believe every review is a growth opportunity. SENDA helps you turn customer feedback into a real engine for business development and lasting trust with your audience.',
    visionLabel: 'Our Vision',
    visionTitle: 'To be the leading review management platform in the region',
    visionDesc: 'We aspire for SENDA to be the first choice for every business seeking professional reputation management, from small shops to large chains.',
    valuesTitle: 'Our Core Values',
    valuesDesc: 'The principles that guide every decision we make and every feature we build',
    values: [
      { title: 'Innovation', desc: 'We leverage the latest AI technologies to deliver smart, innovative solutions', icon: 'Rocket' },
      { title: 'Reliability', desc: 'We uphold the highest security and privacy standards to protect our clients\' data', icon: 'ShieldCheck' },
      { title: 'Simplicity', desc: 'We design intuitive experiences that enable anyone to get started immediately', icon: 'Gem' },
      { title: 'Collaboration', desc: 'We build tools that enhance teamwork and unify team efforts in one place', icon: 'Users' },
    ],
    whyTitle: 'Why Choose SENDA?',
    whyDesc: 'Features that make us the ideal choice for managing your digital reputation',
    whyItems: [
      'Saudi solution designed for the local and Arab market',
      'Advanced AI that understands Arabic language',
      'Dedicated 24/7 technical support',
      'Seamless Google Business Profile integration',
      'Continuous updates and new features every month',
      'Competitive pricing with a free trial period',
    ],
    ctaTitle: 'Ready to turn your reviews into real power?',
    ctaDesc: 'Join hundreds of businesses that trust SENDA',
    ctaBtn: 'Start Your Free Trial',
    ctaSecondary: 'View Plans',
  },
};

const ICONS: Record<string, any> = { Rocket, ShieldCheck, Gem, Users };

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — من نحن' : 'SENDA | سيندا — About'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => { const next = l === 'ar' ? 'en' : 'ar'; saveLang(next); return next; })}>

      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <img src="/heroes/about.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/60 via-[#0F1A2E]/70 to-[#0F1A2E]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{t.heroSub}</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-[#0F1A2E] hover:bg-[#1a2d45] text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-black/10">
            {t.heroBtn}
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>

      </section>

      {/* ═══════════ OUR STORY ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Image / visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1a2d45 50%, #162032 100%)' }}>
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <img src="/senda-logo.png" alt="SENDA" className="h-16 brightness-0 invert mb-6 opacity-90" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="text-white/60 text-sm font-medium tracking-wide">SINCE 2024</div>
                <div className="mt-4 flex gap-3">
                  <div className="w-10 h-1 rounded-full bg-blue-500/40" />
                  <div className="w-10 h-1 rounded-full bg-blue-500/20" />
                  <div className="w-10 h-1 rounded-full bg-blue-500/10" />
                </div>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 md:-left-6 bg-white rounded-xl shadow-lg border border-slate-100 px-5 py-3">
              <div className="text-lg font-bold text-slate-900">🇸🇦</div>
              <div className="text-[10px] text-slate-500 font-medium">{isRtl ? 'صنع في السعودية' : 'Made in Saudi'}</div>
            </div>
          </div>
          {/* Text */}
          <div>
            <span className="text-xs font-semibold text-blue-900 tracking-widest uppercase">{t.storyTitle}</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-3 mb-6 leading-tight">{t.heroH1}</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{t.storyP1}</p>
            <p className="text-sm text-slate-500 leading-relaxed">{t.storyP2}</p>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-14 px-6 bg-gradient-to-b from-white to-[#FAFBFC]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '+500', label: isRtl ? 'نشاط تجاري' : 'Businesses' },
            { value: '98%', label: isRtl ? 'رضا العملاء' : 'Satisfaction' },
            { value: '+1M', label: isRtl ? 'تقييم تمت إدارته' : 'Reviews Managed' },
            { value: '24/7', label: isRtl ? 'دعم متواصل' : 'Support' },
          ].map((s, i) => (
            <div key={i} className="text-center py-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="text-2xl md:text-3xl font-bold text-[#0F1A2E] mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ MISSION & VISION ═══════════ */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl p-8 border border-slate-100 bg-gradient-to-br from-white to-[#FAFBFC] hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#0F1A2E] flex items-center justify-center"><Target size={20} className="text-blue-300" /></div>
              <span className="text-xs font-bold text-[#0F1A2E] uppercase tracking-widest">{t.missionLabel}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{t.missionTitle}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.missionDesc}</p>
          </div>
          <div className="rounded-2xl p-8 border border-slate-100 bg-gradient-to-br from-[#FAFBFC] to-white hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#0F1A2E] flex items-center justify-center"><Eye size={20} className="text-blue-300" /></div>
              <span className="text-xs font-bold text-[#0F1A2E] uppercase tracking-widest">{t.visionLabel}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{t.visionTitle}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.visionDesc}</p>
          </div>
        </div>
      </section>

      {/* ═══════════ VALUES ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{t.valuesTitle}</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">{t.valuesDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.values.map((v: any, i: number) => {
              const Icon = ICONS[v.icon] || Gem;
              return (
                <div key={i} className="group text-center p-7 rounded-2xl border border-slate-100 hover:border-[#162032]/20 hover:shadow-lg transition-all bg-white">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F1A2E] flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform">
                    <Icon size={24} className="text-blue-300" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{v.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY SENDA ═══════════ */}
      <section className="py-20 px-6 bg-[#FAFBFC]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{t.whyTitle}</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">{t.whyDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.whyItems.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-3.5 bg-[#FAFBFC] p-5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <CheckCircle2 size={18} className="text-[#0F1A2E] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative text-center px-8 py-16 md:py-20">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t.ctaTitle}</h2>
            <p className="text-sm text-slate-400 mb-8">{t.ctaDesc}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 bg-white text-[#0F1A2E] hover:bg-white/90 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg">
                {t.ctaBtn}
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
