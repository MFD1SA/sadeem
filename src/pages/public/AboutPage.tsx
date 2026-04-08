// ============================================================================
// SENDA — About Page (من نحن) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Gem, Users, Rocket, ShieldCheck, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'من نحن',
    heroH1: 'نبني مستقبل إدارة السمعة الرقمية',
    heroSub: 'سيندا منصة سعودية تمكّن الأنشطة التجارية من إدارة تقييماتها وتحسين حضورها الرقمي بذكاء وكفاءة',
    heroBtn: 'ابدأ تجربتك المجانية',
    storyTitle: 'قصتنا',
    storyP1: 'بدأت سيندا من إيمان عميق بأن كل تقييم يحمل فرصة حقيقية للنمو. في سوق يزداد فيه الاعتماد على التقييمات الرقمية، أدركنا أن الأنشطة التجارية تحتاج إلى أدوات ذكية وموثوقة لإدارة سمعتها.',
    storyP2: 'اليوم، سيندا تخدم مئات الأنشطة التجارية في المملكة العربية السعودية، من المتاجر الصغيرة إلى السلاسل الكبرى، مقدمةً حلولًا متكاملة تجمع بين الذكاء الاصطناعي والتحليلات المتقدمة.',
    missionLabel: 'رسالتنا',
    missionTitle: 'تمكين كل نشاط تجاري من بناء سمعة رقمية قوية',
    missionDesc: 'نؤمن بأن كل تقييم هو فرصة للنمو. سيندا تساعدك على تحويل آراء العملاء إلى محرّك حقيقي لتطوير أعمالك وبناء ثقة دائمة مع جمهورك.',
    visionLabel: 'رؤيتنا',
    visionTitle: 'أن نكون المنصة الأولى لإدارة التقييمات في المنطقة',
    visionDesc: 'نطمح لأن تكون سيندا الخيار الأول لكل نشاط تجاري يسعى لإدارة سمعته الرقمية باحترافية، من المتاجر الصغيرة إلى السلاسل الكبرى.',
    valuesTitle: 'قيمنا الأساسية',
    valuesDesc: 'المبادئ التي توجّه كل قرار نتخذه وكل ميزة نبنيها',
    values: [
      { title: 'الابتكار', desc: 'نستخدم أحدث تقنيات الذكاء الاصطناعي لتقديم حلول ذكية ومبتكرة', icon: 'Rocket' },
      { title: 'الموثوقية', desc: 'نلتزم بأعلى معايير الأمان والخصوصية لحماية بيانات عملائنا', icon: 'ShieldCheck' },
      { title: 'البساطة', desc: 'نصمم تجربة سهلة وبديهية تمكّن أي مستخدم من البدء فورًا', icon: 'Gem' },
      { title: 'التعاون', desc: 'نبني أدوات تعزز العمل الجماعي وتوحّد جهود الفريق في مكان واحد', icon: 'Users' },
    ],
    whyTitle: 'لماذا تختار سيندا؟',
    whyDesc: 'مميزات تجعلنا الخيار الأمثل لإدارة سمعتك الرقمية',
    whyItems: [
      'منصة سعودية مصممة للسوق المحلي والعربي',
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
    heroSub: 'SENDA is a Saudi platform empowering businesses to manage reviews and enhance their digital presence with intelligence and efficiency',
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
      'Saudi platform designed for the local and Arab market',
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
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — من نحن' : 'SENDA | سيندا — About'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>

      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Decorative elements */}
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <svg className="absolute top-[60%] right-[15%] w-8 h-8 text-white/5" viewBox="0 0 32 32" fill="none"><polygon points="16,2 20,12 30,14 22,22 24,32 16,26 8,32 10,22 2,14 12,12" stroke="currentColor" strokeWidth="1.5" /></svg>
        {/* Glow */}
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

      {/* ═══════════ MISSION & VISION ═══════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl p-8 border border-slate-100 bg-gradient-to-br from-[#FAFBFC] to-white hover:shadow-lg transition-shadow">
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
      <section className="py-20 px-6 bg-white">
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
              <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
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
