// ============================================================================
// SENDA — About Page (من نحن)
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Eye, Gem, Users, Rocket, ShieldCheck } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'من نحن',
    heroH1: 'نبني مستقبل إدارة السمعة الرقمية',
    heroSub: 'سيندا منصة سعودية تمكّن الأنشطة التجارية من إدارة تقييماتها وتحسين حضورها الرقمي بذكاء وكفاءة',
    missionLabel: 'رسالتنا',
    missionTitle: 'تمكين كل نشاط تجاري من بناء سمعة رقمية قوية',
    missionDesc: 'نؤمن بأن كل تقييم هو فرصة للنمو. سيندا تساعدك على تحويل آراء العملاء إلى محرّك حقيقي لتطوير أعمالك وبناء ثقة دائمة مع جمهورك.',
    visionLabel: 'رؤيتنا',
    visionTitle: 'أن نكون المنصة الأولى لإدارة التقييمات في المنطقة',
    visionDesc: 'نطمح لأن تكون سيندا الخيار الأول لكل نشاط تجاري يسعى لإدارة سمعته الرقمية باحترافية، من المتاجر الصغيرة إلى السلاسل الكبرى.',
    valuesTitle: 'قيمنا الأساسية',
    values: [
      { title: 'الابتكار', desc: 'نستخدم أحدث تقنيات الذكاء الاصطناعي لتقديم حلول ذكية ومبتكرة', icon: 'Rocket' },
      { title: 'الموثوقية', desc: 'نلتزم بأعلى معايير الأمان والخصوصية لحماية بيانات عملائنا', icon: 'ShieldCheck' },
      { title: 'البساطة', desc: 'نصمم تجربة سهلة وبديهية تمكّن أي مستخدم من البدء فورًا', icon: 'Gem' },
      { title: 'التعاون', desc: 'نبني أدوات تعزز العمل الجماعي وتوحّد جهود الفريق في مكان واحد', icon: 'Users' },
    ],
    whyTitle: 'لماذا سيندا؟',
    whyItems: [
      'منصة سعودية مصممة للسوق المحلي والعربي',
      'ذكاء اصطناعي متقدم يفهم اللغة العربية',
      'دعم فني متخصص على مدار الساعة',
      'تكامل سلس مع Google Business Profile',
      'تحديثات مستمرة ومميزات جديدة كل شهر',
      'أسعار تنافسية مع فترة تجريبية مجانية',
    ],
    ctaTitle: 'انضم إلى مئات الأنشطة التجارية التي تثق بسيندا',
    ctaBtn: 'ابدأ تجربتك المجانية',
  },
  en: {
    heroTag: 'About Us',
    heroH1: 'Building the Future of Reputation Management',
    heroSub: 'SENDA is a Saudi platform empowering businesses to manage reviews and enhance their digital presence with intelligence and efficiency',
    missionLabel: 'Our Mission',
    missionTitle: 'Empower every business to build a strong digital reputation',
    missionDesc: 'We believe every review is a growth opportunity. SENDA helps you turn customer feedback into a real engine for business development and lasting trust with your audience.',
    visionLabel: 'Our Vision',
    visionTitle: 'To be the leading review management platform in the region',
    visionDesc: 'We aspire for SENDA to be the first choice for every business seeking professional reputation management, from small shops to large chains.',
    valuesTitle: 'Our Core Values',
    values: [
      { title: 'Innovation', desc: 'We leverage the latest AI technologies to deliver smart, innovative solutions', icon: 'Rocket' },
      { title: 'Reliability', desc: 'We uphold the highest security and privacy standards to protect our clients\' data', icon: 'ShieldCheck' },
      { title: 'Simplicity', desc: 'We design intuitive experiences that enable anyone to get started immediately', icon: 'Gem' },
      { title: 'Collaboration', desc: 'We build tools that enhance teamwork and unify team efforts in one place', icon: 'Users' },
    ],
    whyTitle: 'Why SENDA?',
    whyItems: [
      'Saudi platform designed for the local and Arab market',
      'Advanced AI that understands Arabic language',
      'Dedicated 24/7 technical support',
      'Seamless Google Business Profile integration',
      'Continuous updates and new features every month',
      'Competitive pricing with a free trial period',
    ],
    ctaTitle: 'Join hundreds of businesses that trust SENDA',
    ctaBtn: 'Start Your Free Trial',
  },
};

const ICONS: Record<string, any> = { Rocket, ShieldCheck, Gem, Users };

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">{t.heroTag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">{t.heroH1}</h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto">{t.heroSub}</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Target size={20} className="text-blue-600" /></div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t.missionLabel}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t.missionTitle}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.missionDesc}</p>
          </div>
          <div className="bg-[#FAFBFC] rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Eye size={20} className="text-blue-600" /></div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t.visionLabel}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{t.visionTitle}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.visionDesc}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">{t.valuesTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.values.map((v: any, i: number) => {
              const Icon = ICONS[v.icon] || Gem;
              return (
                <div key={i} className="text-center p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors bg-white">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-4"><Icon size={22} className="text-blue-600" /></div>
                  <h4 className="font-bold text-slate-900 mb-2">{v.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why SENDA */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">{t.whyTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.whyItems.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-3 bg-[#FAFBFC] p-4 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t.ctaTitle}</h2>
          <Link to="/register" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            {t.ctaBtn}
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
