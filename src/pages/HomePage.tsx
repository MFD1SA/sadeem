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
    heroTag: 'منصة إدارة التقييمات الأولى في السعودية',
    heroH1Line1: 'تقييم',
    heroH1Line2: 'سمعة رقمية',
    heroSub: 'نحوّل تقييمات عملائك إلى قوة حقيقية تبني سمعتك وتنمّي أعمالك',
    heroCtaPrimary: 'ابدأ تجربتك المجانية',
    heroCtaSecondary: 'تعرّف على المميزات',
    scrollDown: 'مرّر للأسفل',
    whatLabel: 'ماذا تقدم سيندا',
    whatH2: 'كل أدوات إدارة السمعة في منصة واحدة',
    whatDesc: 'سيندا تحوّل إدارة التقييمات والردود والفروع والتحليلات إلى قوة تدعم سمعة نشاطك وترفع ثقة عملائك',
    featureCards: [
      { title: 'إدارة التقييمات', desc: 'تتبع وإدارة جميع تقييمات عملائك من مكان واحد مع إمكانية الفلترة والتنظيم', icon: 'BarChart3' },
      { title: 'الردود الذكية', desc: 'ردود آلية ذكية باستخدام الذكاء الاصطناعي تتناسب مع كل تقييم وتعكس هوية علامتك', icon: 'Brain' },
      { title: 'الرد اليدوي', desc: 'تحكم كامل في صياغة ردودك يدويًا بأسلوبك الخاص على كل تقييم', icon: 'MessageSquare' },
      { title: 'قوالب الردود', desc: 'مكتبة من القوالب الجاهزة يمكنك تخصيصها لتناسب نبرة علامتك التجارية', icon: 'FileText' },
      { title: 'التحليلات المتقدمة', desc: 'بيانات حقيقية عن أداء سمعتك واتجاهات التقييمات لاتخاذ قرارات أذكى', icon: 'BarChart3' },
      { title: 'إدارة الفروع', desc: 'أدر جميع فروعك ومواقعك من لوحة تحكم مركزية واحدة بسهولة', icon: 'Building2' },
      { title: 'الإشعارات الفورية', desc: 'تلقي إشعارات فورية بكل تقييم جديد حتى لا تفوتك أي فرصة للتحسين', icon: 'BellRing' },
      { title: 'إدارة المهام', desc: 'وزّع المهام على فريقك وتابع تقدم العمل بتنظيم واحترافية', icon: 'ListChecks' },
      { title: 'الفوترة والاشتراكات', desc: 'إدارة مرنة للاشتراكات والمدفوعات مع دعم كامل للضريبة', icon: 'CreditCard' },
      { title: 'إدارة الفريق', desc: 'تعاون فعال مع فريق العمل مع صلاحيات مخصصة لكل عضو', icon: 'Users' },
      { title: 'حلول QR', desc: 'حوّل كل لقاء مع عميل إلى تقييم جوجل بمجرد مسح رمز بسيط', icon: 'QrCode' },
    ],
    howLabel: 'كيف تعمل المنصة',
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
    footerTagline: 'منصة متكاملة لإدارة تقييمات جوجل وتحسين السمعة الرقمية',
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
    whatLabel: 'What SENDA Offers',
    whatH2: 'All Reputation Tools in One Platform',
    whatDesc: 'SENDA transforms management of reviews, replies, branches, and analytics into a force that supports your business reputation and drives growth',
    featureCards: [
      { title: 'Reviews Management', desc: 'Track and manage all your customer reviews from one place with filtering and organization', icon: 'BarChart3' },
      { title: 'Smart Replies', desc: 'Intelligent automated replies using AI that suit each review and reflect your brand', icon: 'Brain' },
      { title: 'Manual Reply', desc: 'Full control to craft your own replies manually for each review', icon: 'MessageSquare' },
      { title: 'Reply Templates', desc: 'A library of ready templates you can customize to match your brand tone', icon: 'FileText' },
      { title: 'Advanced Analytics', desc: 'Real data about your reputation performance and review trends for smarter decisions', icon: 'BarChart3' },
      { title: 'Branch Management', desc: 'Manage all your branches from a single centralized dashboard easily', icon: 'Building2' },
      { title: 'Instant Notifications', desc: 'Receive instant notifications for every new review so you never miss an opportunity', icon: 'BellRing' },
      { title: 'Task Management', desc: 'Distribute tasks to your team and track work progress professionally', icon: 'ListChecks' },
      { title: 'Billing & Subscriptions', desc: 'Flexible subscription and payment management with full VAT support', icon: 'CreditCard' },
      { title: 'Team Management', desc: 'Effective collaboration with custom permissions for each team member', icon: 'Users' },
      { title: 'QR Solutions', desc: 'Turn every customer interaction into a Google review with a simple scan', icon: 'QrCode' },
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
    footerTagline: 'A complete platform for Google review management and digital reputation',
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
  const [lang, setLang] = useState<Lang>('ar');
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
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${scrolled ? 'text-slate-500 border border-slate-200 hover:bg-slate-50' : 'text-white/70 border border-white/20 hover:bg-white/10'}`}>{t.langToggle}</button>
            <Link to="/login" className={`text-sm transition-colors px-3 py-1.5 ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>{t.loginBtn}</Link>
            <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm">{t.ctaBtn}</Link>
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
              <button onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMobileOpen(false); }} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-500">{t.langToggle}</button>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 bg-[#0F1A2E] text-white text-sm font-medium py-2 rounded-lg text-center">{t.ctaBtn}</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO — Dark immersive ═══════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        {/* Decorative grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(20, 184, 166, 0.08)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(20, 184, 166, 0.05)' }} />

        {/* Floating doodle elements */}
        <svg className="absolute top-[18%] right-[8%] w-16 h-16 text-blue-400/20 animate-pulse" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[25%] left-[10%] w-10 h-10 text-blue-400/15" viewBox="0 0 40 40" fill="none"><rect x="5" y="5" width="30" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <svg className="absolute top-[30%] left-[15%] w-6 h-6 text-white/10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" /></svg>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
          {/* Main headline — two lines with animated wave SVG between */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.15] tracking-tight mb-6">
            {t.heroH1Line1}
            {/* Animated wave connector */}
            <span className="inline-block mx-3 align-middle">
              <svg width="80" height="32" viewBox="0 0 80 32" fill="none" className="inline-block">
                <path d="M4 16C12 4 20 28 28 16C36 4 44 28 52 16C60 4 68 28 76 16" stroke="url(#waveGrad)" strokeWidth="3" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite]" strokeDasharray="120" strokeDashoffset="0" />
                <defs><linearGradient id="waveGrad" x1="4" y1="16" x2="76" y2="16"><stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#2DD4BF" /></linearGradient></defs>
              </svg>
            </span>
            {t.heroH1Line2}
          </h1>

          <p className="text-base sm:text-lg text-white/50 leading-relaxed mb-10 max-w-xl mx-auto">{t.heroSub}</p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#0F1A2E]/20 inline-flex items-center gap-2">
              {t.heroCtaPrimary}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link to="/features" className="border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 font-medium px-8 py-3.5 rounded-xl text-sm transition-all inline-flex items-center gap-2">
              {t.heroCtaSecondary}
            </Link>
          </div>
        </div>

        {/* Scroll down indicator — glass vertical pill */}
        <button
          onClick={() => document.getElementById('senda-content')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer"
        >
          <span className="text-[10px] text-white/30 tracking-widest uppercase group-hover:text-white/50 transition-colors">{t.scrollDown}</span>
          <div className="w-7 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex flex-col items-center justify-start pt-2 group-hover:border-white/30 group-hover:bg-white/10 transition-all">
            <div className="w-1 h-2.5 rounded-full bg-white/50 animate-[scrollPulse_1.5s_ease-in-out_infinite]" />
          </div>
        </button>
      </section>

      {/* ═══════════════════ WHAT IS SENDA ═══════════════════ */}
      <section id="senda-content" className="py-24 bg-white relative overflow-hidden">
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
                <div key={i} className="group relative p-7 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
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
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">{s.num.replace('0', '')}</div>
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
            <svg className="absolute top-[10%] right-[5%] w-16 h-16 text-blue-400/10 animate-pulse" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
            <svg className="absolute bottom-[10%] left-[5%] w-12 h-12 text-blue-400/10" viewBox="0 0 48 48" fill="none"><rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>

            <div className="relative px-8 sm:px-12 md:px-16 py-16 md:py-20 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight mb-5 leading-tight">{t.ctaSectionH2}</h2>
              <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto">{t.ctaSectionDesc}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 inline-flex items-center gap-2">
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
