// ============================================================================
// SENDA — Public Marketing Homepage
// Light theme · Teal accent · Premium · Elegant · Clean
// ============================================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  CheckCircle2, Menu, X,
  Sparkles, Shield, Clock, ArrowLeft, ArrowRight,
  Star, MessageSquare, BellRing, ListChecks, CreditCard,
  Link2, RefreshCw, MessageCircle,
} from 'lucide-react';
import { getSavedLang, saveLang } from '@/lib/lang';

// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'English',
    nav: ['الرئيسية', 'من نحن', 'المميزات', 'الباقات', 'الأسئلة الشائعة', 'المدونة', 'تواصل معنا'],
    navPaths: ['/', '/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'دخول',
    ctaBtn: 'ابدأ الآن',
    heroTag: 'الحل الأول لإدارة التقييمات في السعودية',
    heroH1Line1: 'تقييم',
    heroH1Line2: 'سمعة رقمية',
    heroSub: 'نحوّل تقييمات عملائك إلى قوة حقيقية تبني سمعتك وتنمّي أعمالك',
    heroCtaPrimary: 'ابدأ تجربتك المجانية',
    heroCtaSecondary: 'تعرّف على المميزات',
    scrollDown: 'مرّر للأسفل',
    showcaseBlocks: [
      { title: 'رؤية شاملة. تحكّم مطلق.', desc: 'لوحة تحكم ذكية تمنحك نظرة فورية على أداء سمعتك الرقمية، مع إحصائيات حية ومؤشرات أداء دقيقة تساعدك على اتخاذ قرارات أسرع وأذكى لنمو نشاطك.' },
      { title: 'كل تقييم فرصة. كل رد يصنع الفارق.', desc: 'استقبل تقييمات عملائك فورياً وردّ عليها بذكاء — سواء بالذكاء الاصطناعي أو يدوياً — بسرعة واحترافية تعزز ثقة العملاء.' },
      { title: 'ردود تعكس هويتك. ثقة تُبنى مع كل تفاعل.', desc: 'كل رد يحمل بصمة نشاطك التجاري. سيندا تضمن أن تفاعلك مع العملاء يعكس هوية علامتك ويبني علاقة ثقة طويلة الأمد.' },
      { title: 'من تجربة سلبية إلى ولاء دائم', desc: 'حوّل التقييمات المنخفضة إلى قصص نجاح. سيندا تساعدك على معالجة كل تجربة سلبية بأسلوب احترافي يرفع رضا العملاء ويعزز نمو أعمالك.' },
    ],
    whatLabel: 'ماذا تقدم سيندا',
    whatH2: 'كل أدوات إدارة السمعة في مكان واحد',
    whatDesc: 'سيندا تحوّل إدارة التقييمات والردود والفروع والتحليلات إلى قوة تدعم سمعة نشاطك وترفع ثقة عملائك',
    featureCards: [
      { title: 'إدارة السمعة', desc: 'مركز قيادة متكامل لإدارة جميع تقييماتك من مكان واحد، مع أدوات فلترة وتنظيم ذكية تمنحك تحكماً كاملاً بسمعتك الرقمية', icon: 'BarChart3' },
      { title: 'الردود الذكية', desc: 'ردود آلية مدعومة بالذكاء الاصطناعي، مصممة لتتناسب مع سياق كل تقييم وتعكس صوت علامتك التجارية بدقة واحترافية', icon: 'Brain' },
      { title: 'الرد اليدوي', desc: 'صِغ ردودك بأسلوبك الخاص مع تحكم كامل في كل كلمة، لتضمن تواصلاً شخصياً يترك أثراً حقيقياً', icon: 'MessageSquare' },
      { title: 'قوالب الردود', desc: 'مكتبة احترافية من القوالب الجاهزة قابلة للتخصيص الكامل، تناسب نبرة علامتك وتسرّع عملية الاستجابة', icon: 'FileText' },
      { title: 'التحليلات المتقدمة', desc: 'رؤى عميقة مبنية على بيانات حقيقية تكشف اتجاهات أداء سمعتك وتدعم قراراتك الاستراتيجية', icon: 'BarChart3' },
      { title: 'إدارة الفروع', desc: 'لوحة تحكم مركزية واحدة لإدارة جميع فروعك ومواقعك بكفاءة، مع مقارنة أداء فورية بين الفروع', icon: 'Building2' },
      { title: 'الإشعارات الفورية', desc: 'تنبيهات لحظية بكل تقييم جديد تضمن استجابة سريعة ولا تفوّت أي فرصة لتحسين تجربة عملائك', icon: 'BellRing' },
      { title: 'إدارة المهام', desc: 'نظام ذكي لتوزيع المهام على فريقك ومتابعة تقدم العمل بشفافية وتنظيم احترافي', icon: 'ListChecks' },
      { title: 'الفوترة والاشتراكات', desc: 'إدارة مرنة وشفافة للاشتراكات والمدفوعات مع دعم كامل لضريبة القيمة المضافة', icon: 'CreditCard' },
      { title: 'إدارة الفريق', desc: 'أدوات تعاون متقدمة مع صلاحيات مخصصة لكل عضو، تضمن كفاءة الأداء وأمان البيانات', icon: 'Users' },
      { title: 'حلول QR', desc: 'رموز QR ذكية تحوّل كل تفاعل مع عميل إلى تقييم إيجابي على جوجل بتجربة سلسة ومبتكرة', icon: 'QrCode' },
    ],
    howLabel: 'كيف يعمل سيندا',
    howH2: 'أربع خطوات لإدارة سمعتك',
    howSteps: [
      { num: '01', title: 'ربط النشاط', desc: 'اربط حساب Google Business الخاص بك في دقائق وأضف فروعك', icon: 'Link2' },
      { num: '02', title: 'مزامنة التقييمات', desc: 'يتم سحب جميع تقييماتك تلقائيًا وعرضها في لوحة التحكم', icon: 'RefreshCw' },
      { num: '03', title: 'إدارة الردود', desc: 'رد على التقييمات يدويًا أو بالذكاء الاصطناعي واستخدم القوالب', icon: 'MessageCircle' },
      { num: '04', title: 'قياس الأداء', desc: 'تابع التحليلات وقارن أداء فروعك وحسّن تجربة عملائك', icon: 'BarChart3' },
    ],
    ctaSectionH2: 'حوّل نشاطك إلى مستوى جديد',
    ctaSectionDesc: 'ابدأ تجربة مجانية وانطلق بثقة كاملة في إدارة سمعتك الرقمية',
    ctaSectionBtn: 'ابدأ تجربتك المجانية',
    footerTagline: 'حلك المتكامل لإدارة تقييمات جوجل وتحسين السمعة الرقمية',
    footerProduct: 'المنتج',
    footerProductLinks: ['المميزات', 'الباقات', 'من نحن'],
    footerProductPaths: ['/features', '/pricing', '/about'],
    footerSupport: 'الدعم',
    footerSupportLinks: ['الأسئلة الشائعة', 'تواصل معنا'],
    footerSupportPaths: ['/faq', '/contact-us'],
    footerLegal: 'قانوني',
    footerLegalLinks: [
      { label: 'سياسة الخصوصية', path: '/privacy' },
      { label: 'شروط الاستخدام', path: '/terms' },
    ],
    copyright: 'جميع الحقوق محفوظة لـ © 2025 SENDA',
  },
  en: {
    dir: 'ltr',
    langToggle: 'العربية',
    nav: ['Home', 'About', 'Features', 'Pricing', 'FAQ', 'Blog', 'Contact'],
    navPaths: ['/', '/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'Login',
    ctaBtn: 'Get Started',
    heroTag: 'The Leading Review Management Platform in Saudi Arabia',
    heroH1Line1: 'Review',
    heroH1Line2: 'Digital Reputation',
    heroSub: 'We transform your customer reviews into a real force that builds your reputation and grows your business',
    heroCtaPrimary: 'Start Your Free Trial',
    heroCtaSecondary: 'Explore Features',
    scrollDown: 'Scroll Down',
    showcaseBlocks: [
      { title: 'Complete Visibility. Total Control.', desc: 'A smart dashboard that gives you an instant overview of your digital reputation, with live statistics and precise performance indicators to help you make faster, smarter decisions for growth.' },
      { title: 'Every Review Is an Opportunity. Every Reply Makes a Difference.', desc: 'Receive customer reviews instantly and respond intelligently from within the platform — with AI or manually — with speed and professionalism that builds customer trust.' },
      { title: 'Replies That Reflect Your Brand. Trust Built with Every Interaction.', desc: 'Every reply carries your business identity. SENDA ensures your customer interactions reflect your brand and build long-lasting trust.' },
      { title: 'From Negative Experience to Lasting Loyalty', desc: 'Turn low ratings into success stories. SENDA helps you address every negative experience professionally, boosting customer satisfaction and driving business growth.' },
    ],
    whatLabel: 'What SENDA Offers',
    whatH2: 'All Reputation Tools in One Platform',
    whatDesc: 'SENDA transforms management of reviews, replies, branches, and analytics into a force that supports your business reputation and drives growth',
    featureCards: [
      { title: 'Reputation Management', desc: 'A unified command center to manage all your reviews from one place, with smart filtering and organization tools for full control over your digital reputation', icon: 'BarChart3' },
      { title: 'Smart Replies', desc: 'AI-powered automated replies designed to match the context of each review and precisely reflect your brand voice with professionalism', icon: 'Brain' },
      { title: 'Manual Reply', desc: 'Craft your responses in your own style with full control over every word, ensuring personal communication that leaves a real impact', icon: 'MessageSquare' },
      { title: 'Reply Templates', desc: 'A professional library of fully customizable templates that match your brand tone and accelerate your response workflow', icon: 'FileText' },
      { title: 'Advanced Analytics', desc: 'Deep insights built on real data that reveal reputation performance trends and support your strategic decisions', icon: 'BarChart3' },
      { title: 'Branch Management', desc: 'A single centralized dashboard to manage all your branches efficiently, with instant cross-branch performance comparison', icon: 'Building2' },
      { title: 'Instant Notifications', desc: 'Real-time alerts for every new review ensuring swift response and never missing an opportunity to improve customer experience', icon: 'BellRing' },
      { title: 'Task Management', desc: 'A smart system for distributing tasks to your team and tracking progress with transparency and professional organization', icon: 'ListChecks' },
      { title: 'Billing & Subscriptions', desc: 'Flexible and transparent subscription and payment management with full VAT support', icon: 'CreditCard' },
      { title: 'Team Management', desc: 'Advanced collaboration tools with custom permissions for each member, ensuring performance efficiency and data security', icon: 'Users' },
      { title: 'QR Solutions', desc: 'Smart QR codes that turn every customer interaction into a positive Google review with a seamless, innovative experience', icon: 'QrCode' },
    ],
    howLabel: 'How It Works',
    howH2: 'Four Steps to Manage Your Reputation',
    howSteps: [
      { num: '01', title: 'Connect Business', desc: 'Link your Google Business account in minutes and add your branches', icon: 'Link2' },
      { num: '02', title: 'Sync Reviews', desc: 'All your reviews are pulled automatically and displayed in your dashboard', icon: 'RefreshCw' },
      { num: '03', title: 'Manage Replies', desc: 'Reply to reviews manually or with AI and use templates', icon: 'MessageCircle' },
      { num: '04', title: 'Measure Performance', desc: 'Track analytics, compare branches, and improve customer experience', icon: 'BarChart3' },
    ],
    ctaSectionH2: 'Elevate Your Business to the Next Level',
    ctaSectionDesc: 'Start your free trial and launch with full confidence in managing your digital reputation',
    ctaSectionBtn: 'Start Your Free Trial',
    footerTagline: 'Your complete solution for Google review management and digital reputation',
    footerProduct: 'Product',
    footerProductLinks: ['Features', 'Pricing', 'About'],
    footerProductPaths: ['/features', '/pricing', '/about'],
    footerSupport: 'Support',
    footerSupportLinks: ['FAQ', 'Contact Us'],
    footerSupportPaths: ['/faq', '/contact-us'],
    footerLegal: 'Legal',
    footerLegalLinks: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
    copyright: 'All rights reserved © 2025 SENDA',
  },
};

// ─── Icon map ──────────────────────────────────────────────────────────────────
const IconMap: Record<string, any> = {
  Brain, QrCode, BarChart3, Building2, Users, FileText, Clock, Star, Shield,
  MessageSquare, BellRing, ListChecks, CreditCard, Link2, RefreshCw, MessageCircle,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    document.title = lang === 'ar' ? 'سيندا | SENDA' : 'SENDA | سيندا';
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);


  return (
    <div dir={t.dir} className="min-h-screen bg-[#FAFBFC] text-slate-800" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif" }}>

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[72px]">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/senda-logo.png" alt="SENDA" className={`h-9 transition-all duration-500 ${scrolled ? '' : 'brightness-0 invert'}`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-7">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-blue-900' : 'text-white/70 hover:text-white'}`}>{label}</Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => { const next = lang === 'ar' ? 'en' : 'ar'; saveLang(next); setLang(next); }} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${scrolled ? 'text-slate-500 border border-slate-200 hover:bg-slate-50' : 'text-white/70 border border-white/20 hover:bg-white/10'}`}>{t.langToggle}</button>
            <Link to="/login" className={`text-sm transition-colors px-3 py-1.5 ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>{t.loginBtn}</Link>
            <Link to="/login" className="bg-[#0F1A2E] hover:bg-[#1a2d45] text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm">{t.ctaBtn}</Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 ${scrolled ? 'text-slate-600' : 'text-white'}`}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 shadow-lg px-6 py-4">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} onClick={() => setMobileOpen(false)} className="block py-3 text-sm text-slate-600 border-b border-slate-50">{label}</Link>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { const next = lang === 'ar' ? 'en' : 'ar'; saveLang(next); setLang(next); setMobileOpen(false); }} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-500">{t.langToggle}</button>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 bg-[#0F1A2E] text-white text-sm font-medium py-2 rounded-lg text-center">{t.ctaBtn}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO — Dark immersive ═══════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-20 lg:pt-0 lg:pb-0" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        {/* Decorative grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(20, 184, 166, 0.08)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(20, 184, 166, 0.05)' }} />

        {/* ── Hero Grid: Text + Illustration side by side ── */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Text side */}
          <div className={`${isRtl ? 'lg:order-1' : 'lg:order-1'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight mb-6">
              {t.heroH1Line1}
              <span className="inline-block mx-2 sm:mx-3 align-middle">
                <svg width="60" height="24" viewBox="0 0 80 32" fill="none" className="inline-block sm:w-[80px] sm:h-[32px]">
                  <path d="M4 16C12 4 20 28 28 16C36 4 44 28 52 16C60 4 68 28 76 16" stroke="url(#waveGrad)" strokeWidth="3" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite]" strokeDasharray="120" strokeDashoffset="0" />
                  <defs><linearGradient id="waveGrad" x1="4" y1="16" x2="76" y2="16"><stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#2DD4BF" /></linearGradient></defs>
                </svg>
              </span>
              {t.heroH1Line2}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-white/50 leading-relaxed mb-8 max-w-lg">{t.heroSub}</p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link to="/register" className="bg-white text-[#0F1A2E] hover:bg-white/90 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-black/10 inline-flex items-center gap-2">
                {t.heroCtaPrimary}
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </Link>
              <Link to="/features" className="border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 font-medium px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm transition-all inline-flex items-center gap-2">
                {t.heroCtaSecondary}
              </Link>
            </div>
          </div>

          {/* Illustration side */}
          <div className={`${isRtl ? 'lg:order-2' : 'lg:order-2'}`}>
            <div className="relative">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/30">
                <div className="h-7 bg-white/[0.05] border-b border-white/[0.06] flex items-center px-3 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/50" /><div className="w-2 h-2 rounded-full bg-yellow-400/50" /><div className="w-2 h-2 rounded-full bg-green-400/50" />
                  <div className="flex-1 mx-6"><div className="h-3 rounded bg-white/[0.05] max-w-[140px] mx-auto" /></div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3">
                      <div className="text-[8px] sm:text-[9px] text-blue-300/60 mb-0.5">{isRtl ? 'إجمالي التقييمات' : 'Total Reviews'}</div>
                      <div className="text-base sm:text-xl font-bold text-white/90">2,847</div>
                      <div className="text-[8px] sm:text-[9px] text-emerald-400/70">↑ 12.5%</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3">
                      <div className="text-[8px] sm:text-[9px] text-blue-300/60 mb-0.5">{isRtl ? 'متوسط التقييم' : 'Avg Rating'}</div>
                      <div className="text-base sm:text-xl font-bold text-white/90">4.8 <span className="text-yellow-400 text-[10px] sm:text-xs">★</span></div>
                      <div className="text-[8px] sm:text-[9px] text-emerald-400/70">{isRtl ? 'ممتاز' : 'Excellent'}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3">
                      <div className="text-[8px] sm:text-[9px] text-blue-300/60 mb-0.5">{isRtl ? 'معدل الاستجابة' : 'Response Rate'}</div>
                      <div className="text-base sm:text-xl font-bold text-white/90">98%</div>
                      <div className="text-[8px] sm:text-[9px] text-emerald-400/70">↑ 3.2%</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5 sm:p-3">
                      <div className="text-[8px] sm:text-[9px] text-blue-300/60 mb-0.5">{isRtl ? 'الفروع النشطة' : 'Active Branches'}</div>
                      <div className="text-base sm:text-xl font-bold text-white/90">12</div>
                      <div className="text-[8px] sm:text-[9px] text-blue-300/50">{isRtl ? 'متصل' : 'Online'}</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-2.5 sm:p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[8px] sm:text-[9px] text-blue-300/50">{isRtl ? 'نمو التقييمات الإيجابية' : 'Positive Reviews Growth'}</div>
                      <div className="text-[8px] sm:text-[9px] text-emerald-400/60">{isRtl ? 'آخر 6 أشهر' : 'Last 6 months'}</div>
                    </div>
                    <svg className="w-full h-[40px] sm:h-[50px]" viewBox="0 0 400 50" fill="none" preserveAspectRatio="none">
                      <defs><linearGradient id="heroChartG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(59,130,246,0.25)" /><stop offset="100%" stopColor="rgba(59,130,246,0)" /></linearGradient></defs>
                      <path d="M0,42 C30,38 60,35 100,30 C140,25 180,32 220,24 C260,16 300,18 340,10 L400,6 L400,50 L0,50 Z" fill="url(#heroChartG)" />
                      <path d="M0,42 C30,38 60,35 100,30 C140,25 180,32 220,24 C260,16 300,18 340,10 L400,6" stroke="rgba(59,130,246,0.5)" strokeWidth="2" fill="none" />
                      <circle cx="400" cy="6" r="3" fill="#3b82f6" className="animate-pulse" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-blue-500/8 rounded-full blur-xl" />
            </div>
          </div>
        </div>

        {/* Scroll down indicator — glass vertical pill */}
        <button
          onClick={() => document.getElementById('senda-content')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 group cursor-pointer hidden lg:flex"
        >
          <span className="text-[10px] text-white/30 tracking-widest uppercase group-hover:text-white/50 transition-colors">{t.scrollDown}</span>
          <div className="w-7 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex flex-col items-center justify-start pt-2 group-hover:border-white/30 group-hover:bg-white/10 transition-all">
            <div className="w-1 h-2.5 rounded-full bg-white/50 animate-[scrollPulse_1.5s_ease-in-out_infinite]" />
          </div>
        </button>
      </section>

      {/* ═══════════════════ SHOWCASE — 4 Alternating Blocks ═══════════════════ */}
      <section id="senda-content" className="py-0 [&>div]:border-t-0">

          {/* ── Block 1 ── */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50/80 py-14 sm:py-18 px-6">
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className={`${isRtl ? 'md:order-2' : ''}`}>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">{t.showcaseBlocks[0].title}</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{t.showcaseBlocks[0].desc}</p>
            </div>
            <div className={`${isRtl ? 'md:order-1' : ''}`}>
              {/* Dashboard Mockup */}
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden">
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-300" /><div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 text-center">
                      <div className="text-[10px] text-blue-600/70 mb-0.5">{isRtl ? 'التقييمات' : 'Reviews'}</div>
                      <div className="text-lg font-bold text-blue-900">1,284</div>
                      <div className="text-[9px] text-emerald-600 font-medium">+18%</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 text-center">
                      <div className="text-[10px] text-emerald-600/70 mb-0.5">{isRtl ? 'المتوسط' : 'Average'}</div>
                      <div className="text-lg font-bold text-emerald-900">4.7 ★</div>
                      <div className="text-[9px] text-emerald-600 font-medium">+0.3</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 text-center">
                      <div className="text-[10px] text-purple-600/70 mb-0.5">{isRtl ? 'الاستجابة' : 'Response'}</div>
                      <div className="text-lg font-bold text-purple-900">96%</div>
                      <div className="text-[9px] text-emerald-600 font-medium">+5%</div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] text-slate-400 mb-2">{isRtl ? 'أداء الأشهر الأخيرة' : 'Recent Performance'}</div>
                    <svg className="w-full h-[48px]" viewBox="0 0 300 48" fill="none" preserveAspectRatio="none">
                      <defs><linearGradient id="blockChart1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(37,99,235,0.15)" /><stop offset="100%" stopColor="rgba(37,99,235,0)" /></linearGradient></defs>
                      <path d="M0,38 C50,32 80,28 120,22 C160,18 200,24 240,14 L300,8 L300,48 L0,48 Z" fill="url(#blockChart1)" />
                      <path d="M0,38 C50,32 80,28 120,22 C160,18 200,24 240,14 L300,8" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* ── Block 2 ── */}
          <div className="bg-slate-50 py-14 sm:py-18 px-6">
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className={`${isRtl ? '' : 'md:order-2'}`}>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">{t.showcaseBlocks[1].title}</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{t.showcaseBlocks[1].desc}</p>
            </div>
            <div className={`${isRtl ? '' : 'md:order-1'}`}>
              {/* Review & Reply Mockup */}
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden">
                <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-300" /><div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                </div>
                <div className="p-4 space-y-3">
                  {/* Customer Review */}
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">{isRtl ? 'أ' : 'A'}</div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{isRtl ? 'أحمد محمد' : 'Ahmed M.'}</div>
                        <div className="flex gap-0.5">{'★★★★★'.split('').map((s, i) => <span key={i} className="text-[10px] text-yellow-400">{s}</span>)}</div>
                      </div>
                      <div className="mr-auto text-[9px] text-slate-400">{isRtl ? 'قبل 3 دقائق' : '3 min ago'}</div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{isRtl ? 'تجربة ممتازة! الخدمة سريعة والجودة عالية جداً. أنصح الجميع بزيارتهم.' : 'Excellent experience! Fast service and very high quality. Highly recommend visiting them.'}</p>
                  </div>
                  {/* AI Reply */}
                  <div className="rounded-xl bg-blue-50/60 border border-blue-100/80 p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md bg-[#0F1A2E] flex items-center justify-center"><Brain size={12} className="text-blue-300" /></div>
                      <span className="text-[10px] font-semibold text-blue-900">{isRtl ? 'رد ذكي — مقترح' : 'Smart Reply — Suggested'}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{isRtl ? 'شكراً لك أحمد! سعداء بتجربتك المميزة. نتطلع لخدمتك مجدداً 🌟' : 'Thank you Ahmed! We\'re happy with your great experience. Looking forward to serving you again 🌟'}</p>
                    <div className="flex gap-2 mt-2.5">
                      <div className="text-[9px] font-semibold text-white bg-[#0F1A2E] px-3 py-1 rounded-md">{isRtl ? 'نشر الرد' : 'Publish'}</div>
                      <div className="text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-md">{isRtl ? 'تعديل' : 'Edit'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* ── Block 3 ── */}
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 py-14 sm:py-18 px-6">
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className={`${isRtl ? 'md:order-2' : ''}`}>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">{t.showcaseBlocks[2].title}</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{t.showcaseBlocks[2].desc}</p>
            </div>
            <div className={`${isRtl ? 'md:order-1' : ''}`}>
              {/* Interaction Scene — Customer + Business Reply */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white shadow-xl overflow-hidden p-5">
                {/* Customer card with sky bg */}
                <div className="rounded-xl overflow-hidden mb-3">
                  <div className="h-16 bg-gradient-to-r from-sky-400 via-blue-300 to-sky-200 relative">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.8) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.6) 0%, transparent 40%)' }} />
                  </div>
                  <div className="bg-white px-4 pb-3 -mt-5 relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-white flex items-center justify-center text-white text-sm font-bold shadow-md">{isRtl ? 'م' : 'M'}</div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold text-slate-800">{isRtl ? 'محمد العتيبي' : 'Mohammed A.'}</div>
                      <div className="flex gap-0.5 mt-0.5">{'★★★★★'.split('').map((s, i) => <span key={i} className="text-[10px] text-yellow-400">{s}</span>)}</div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{isRtl ? 'المكان رائع والموظفين محترفين. بالتأكيد راح أرجع مرة ثانية!' : 'Great place and professional staff. I\'ll definitely be back!'}</p>
                    </div>
                  </div>
                </div>
                {/* Business reply */}
                <div className="rounded-xl bg-[#0F1A2E] p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-bold text-blue-300">S</div>
                    <div>
                      <div className="text-[10px] font-bold text-white/90">{isRtl ? 'فريق سيندا كافيه' : 'Senda Cafe Team'}</div>
                      <div className="text-[8px] text-white/40">{isRtl ? 'صاحب النشاط' : 'Business Owner'}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">{isRtl ? 'شكراً محمد! يسعدنا أن تجربتك كانت مميزة. ننتظر زيارتك القادمة بشوق 💙' : 'Thank you Mohammed! We\'re glad you had a great experience. Looking forward to your next visit 💙'}</p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* ── Block 4 ── */}
          <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/40 py-14 sm:py-18 px-6">
          <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className={`${isRtl ? '' : 'md:order-2'}`}>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">{t.showcaseBlocks[3].title}</h3>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">{t.showcaseBlocks[3].desc}</p>
            </div>
            <div className={`${isRtl ? '' : 'md:order-1'}`}>
              {/* Before/After Rating Improvement */}
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl overflow-hidden p-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="rounded-xl bg-red-50/50 border border-red-100/50 p-4 text-center">
                    <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-2">{isRtl ? 'قبل سيندا' : 'Before'}</div>
                    <div className="text-3xl font-bold text-red-500 mb-1">3.2</div>
                    <div className="flex justify-center gap-0.5 mb-2">{'★★★'.split('').map((s, i) => <span key={i} className="text-xs text-yellow-400">{s}</span>)}{'★★'.split('').map((s, i) => <span key={i} className="text-xs text-slate-200">{s}</span>)}</div>
                    <div className="text-[9px] text-red-400">{isRtl ? '47 تقييم' : '47 reviews'}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-red-100"><div className="h-full rounded-full bg-red-300 w-[32%]" /></div>
                  </div>
                  {/* After */}
                  <div className="rounded-xl bg-emerald-50/50 border border-emerald-100/50 p-4 text-center relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">↑ 50%</div>
                    <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide mb-2">{isRtl ? 'بعد سيندا' : 'After'}</div>
                    <div className="text-3xl font-bold text-emerald-600 mb-1">4.8</div>
                    <div className="flex justify-center gap-0.5 mb-2">{'★★★★★'.split('').map((s, i) => <span key={i} className="text-xs text-yellow-400">{s}</span>)}</div>
                    <div className="text-[9px] text-emerald-500">{isRtl ? '312 تقييم' : '312 reviews'}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-400 w-[96%]" /></div>
                  </div>
                </div>
                {/* Satisfaction indicator */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">{isRtl ? 'رضا العملاء' : 'Customer Satisfaction'}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 w-[92%]" /></div>
                    <span className="text-[10px] font-bold text-emerald-600">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

      </section>

      {/* ═══════════════════ WHAT IS SENDA ═══════════════════ */}
      <section className="py-24 bg-[#FAFBFC] relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full blur-[100px] opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full blur-[100px] opacity-40" />

        <div className="relative max-w-3xl mx-auto px-6 text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#0F1A2E]/5 rounded-full px-4 py-1.5 mb-6">
            <Sparkles size={14} className="text-blue-900" />
            <span className="text-xs font-semibold text-blue-900 tracking-wide">{t.whatLabel}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">{t.whatH2}</h2>
          <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">{t.whatDesc}</p>
        </div>

        {/* ═══════════════════ FEATURES ═══════════════════ */}
        <div className="relative max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.featureCards.map((f: any, i: number) => {
              const Icon = IconMap[f.icon] || Sparkles;
              return (
                <div key={i} className="group relative p-7 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:bg-blue-50/30 transition-all duration-500 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F1A2E] to-[#1a2d45] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                    <Icon size={20} className="text-blue-300" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-2.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-semibold text-blue-300 tracking-wide">{t.howLabel}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">{t.howH2}</h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line (desktop only) */}
            <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {t.howSteps.map((s: any, i: number) => {
                const Icon = IconMap[s.icon] || Sparkles;
                return (
                  <div key={i} className="text-center group relative">
                    <div className="relative mx-auto mb-6">
                      <div className="w-[104px] h-[104px] rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto group-hover:bg-white/[0.06] group-hover:border-white/15 transition-all duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                          <Icon size={26} className="text-blue-400" />
                        </div>
                      </div>
                      {/* step number removed per request */}
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-[220px] mx-auto">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="relative py-24 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 to-white" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
            {/* Decorative elements inside card */}
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />

            <div className="relative px-8 sm:px-12 md:px-16 py-16 md:py-20 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-5 leading-tight">{t.ctaSectionH2}</h2>
              <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto">{t.ctaSectionDesc}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link to="/register" className="bg-white text-[#0F1A2E] hover:bg-white/90 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg inline-flex items-center gap-2">
                  {t.ctaSectionBtn}
                  {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </Link>
                <Link to="/pricing" className="border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 font-medium px-8 py-3.5 rounded-xl text-sm transition-all">
                  {isRtl ? 'اطلع على الباقات' : 'View Pricing'}
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 text-slate-400 text-xs font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-400" />{isRtl ? 'بدون تعقيد' : 'No Setup Fee'}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-blue-400" />{isRtl ? 'دعم فني 24/7' : '24/7 Support'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/senda-logo.png" alt="SENDA" className="h-8 brightness-0 invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[260px]">{t.footerTagline}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerProduct}</h4>
              <ul className="space-y-2.5">
                {t.footerProductLinks.map((link: string, i: number) => (
                  <li key={i}><Link to={t.footerProductPaths[i]} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerSupport}</h4>
              <ul className="space-y-2.5">
                {t.footerSupportLinks.map((link: string, i: number) => (
                  <li key={i}><Link to={t.footerSupportPaths[i]} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerLegal}</h4>
              <ul className="space-y-2.5">
                {t.footerLegalLinks.map((link: any, i: number) => (
                  <li key={i}><Link to={link.path} className="text-sm text-slate-400 hover:text-blue-400 transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 py-6 text-center">
            <p className="text-xs text-slate-500">{t.copyright}</p>
          </div>
        </div>
      </footer>

      {/* Scroll padding + wave animation */}
      <style>{`
        html { scroll-behavior: smooth; scroll-padding-top: 80px; }
        ::selection { background: rgba(13, 148, 136, 0.15); }
        @keyframes dash { 0%,100% { stroke-dashoffset: 0; } 50% { stroke-dashoffset: 60; } }
      `}</style>
    </div>
  );
}
