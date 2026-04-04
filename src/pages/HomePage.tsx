// ============================================================================
// SENDA — Public Marketing Homepage (Light Theme, Gold Accent)
// Background: #F8F9FB · Cards: #FFFFFF · Text: #1A1A2E · Gold: #B8965A
// Routing: دخول → /login  |  ابدأ مجانًا → /login
// Contact form submits to Edge Function (destination email never exposed)
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  CheckCircle2, Send, Loader2, Menu, X,
  Sparkles, Shield, Clock, ArrowLeft, ArrowRight,
  Star, LayoutDashboard,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F8F9FB',
  card: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#6B7280',
  gold: '#B8965A',
  goldLight: '#D4AF6A',
  dark: '#1A1A2E',
  border: '#E8E8EC',
  greenCheck: '#22C55E',
  red: '#EF4444',
};
const GOLD_GRAD = 'linear-gradient(135deg, #B8965A, #D4AF6A)';

// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'EN',
    nav: ['الرئيسية', 'المميزات', 'كيف يعمل', 'الأسعار', 'اتصل بنا'],
    navIds: ['hero', 'features', 'how-it-works', 'pricing', 'contact'],
    loginBtn: 'دخول',
    ctaBtn: 'ابدأ مجانًا',
    heroH1: 'إدارة تقييمات جوجل بذكاء اصطناعي',
    heroSub: 'منصة متكاملة للرد الذكي وجمع التقييمات وتحليل السمعة الرقمية لجميع فروعك',
    heroCtaPrimary: 'ابدأ تجربتك المجانية',
    heroCtaSecondary: 'تعرف على المميزات',
    dashPreviewTitle: 'لوحة تحكم سيندا',
    dashSidebar: ['التقييمات', 'التحليلات', 'الفروع', 'الفريق', 'الإعدادات'],
    dashStats: [
      { label: 'إجمالي التقييمات', value: '1,284' },
      { label: 'متوسط التقييم', value: '4.7' },
      { label: 'ردود AI هذا الشهر', value: '186' },
      { label: 'تقييمات جديدة', value: '24' },
    ],
    dashReviews: [
      { initials: 'أ', stars: 5, text: 'خدمة رائعة وسريعة، أنصح بها بشدة', status: 'تم الرد' },
      { initials: 'س', stars: 4, text: 'جيد جدًا، التوصيل كان ممتاز', status: 'بانتظار' },
      { initials: 'خ', stars: 5, text: 'تجربة لا مثيل لها، شكرًا لكم', status: 'تم الرد' },
    ],
    featuresLabel: 'ماذا يقدم سيندا',
    featuresH2: 'كل أدوات إدارة السمعة في منصة واحدة',
    featureCards: [
      { title: 'ردود بالذكاء الاصطناعي', desc: 'ردود مخصصة لكل تقييم تعكس هوية علامتك التجارية في ثوانٍ معدودة', icon: 'Brain' },
      { title: 'جمع تقييمات بـ QR', desc: 'حوّل كل لقاء مع عميل إلى تقييم جوجل بمجرد مسح رمز بسيط', icon: 'QrCode' },
      { title: 'تحليلات متقدمة', desc: 'بيانات حقيقية عن أداء سمعتك لاتخاذ قرارات أذكى وأسرع', icon: 'BarChart3' },
      { title: 'إدارة متعددة الفروع', desc: 'أدر جميع فروعك ومواقعك من لوحة تحكم مركزية واحدة', icon: 'Building2' },
      { title: 'إدارة الفريق', desc: 'وزّع المهام وراقب أداء الفريق مع صلاحيات مخصصة لكل عضو', icon: 'Users' },
      { title: 'قوالب ردود احترافية', desc: 'مكتبة من القوالب الجاهزة يمكنك تخصيصها لتناسب نبرة علامتك', icon: 'FileText' },
    ],
    benefitsLabel: 'المزايا',
    benefitsH2: 'لماذا تختار سيندا؟',
    benefits: [
      { title: 'توفير الوقت', desc: 'وفّر ساعات أسبوعيًا بالرد التلقائي الذكي على جميع تقييماتك بدلًا من الصياغة اليدوية', icon: 'Clock' },
      { title: 'زيادة التقييمات الإيجابية', desc: 'اجمع تقييمات أكثر من عملائك السعداء عبر أكواد QR الذكية الموزعة في فروعك', icon: 'Star' },
      { title: 'قرارات مبنية على بيانات', desc: 'حلّل أداء كل فرع وموظف واتخذ قرارات محسوبة لتحسين تجربة العملاء', icon: 'BarChart3' },
      { title: 'حماية سمعتك', desc: 'تنبيهات فورية للتقييمات السلبية مع ردود ذكية تحافظ على صورة علامتك التجارية', icon: 'Shield' },
    ],
    howLabel: 'كيف يعمل',
    howH2: 'ثلاث خطوات لإدارة سمعتك',
    howSteps: [
      { num: '1', title: 'اربط حسابك', desc: 'اربط حساب جوجل للأعمال الخاص بك في دقائق وأضف فروعك' },
      { num: '2', title: 'فعّل الذكاء الاصطناعي', desc: 'خصص نبرة الردود واضبط إعدادات الرد التلقائي حسب علامتك' },
      { num: '3', title: 'راقب وحسّن', desc: 'تابع التقييمات والتحليلات وحسّن سمعتك الرقمية باستمرار' },
    ],
    pricingLabel: 'الخطط والأسعار',
    pricingH2: 'ابدأ بالخطة المناسبة لعملك',
    pricingDesc: 'جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة',
    pricingMo: 'ر.س/شهر',
    pricingMostPopular: 'الأكثر طلبًا',
    pricingContactUs: 'تواصل معنا',
    pricingCtaDefault: 'ابدأ مجانًا',
    pricingCtaHighlight: 'ابدأ مجانًا الآن',
    plans: [
      { name: 'Orbit', nameAr: 'مدار', price: '99', features: ['1 فرع', '1 عضو', '50 رد AI شهريًا', '100 قالب', '1 كود QR'] },
      { name: 'Nova', nameAr: 'نوفا', price: '199', popular: true, features: ['3 فروع', '3 أعضاء', '300 رد AI شهريًا', '500 قالب', '3 أكواد QR'] },
      { name: 'Galaxy', nameAr: 'جالكسي', price: '399', features: ['10 فروع', '10 أعضاء', '1,500 رد AI شهريًا', 'قوالب غير محدودة', '10 أكواد QR'] },
      { name: 'Infinity', nameAr: 'إنفينيتي', price: null, features: ['فروع غير محدودة', 'أعضاء غير محدودين', 'ردود AI غير محدودة', 'قوالب غير محدودة', 'أكواد QR غير محدودة'] },
    ],
    compareTitle: 'مقارنة شاملة بين الخطط',
    compareFeatureCol: 'الميزة',
    compareRows: [
      { label: 'عدد الفروع', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'أعضاء الفريق', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'ردود AI شهريًا', vals: ['50', '300', '1,500', 'غير محدود'] },
      { label: 'ردود القوالب', vals: ['100', '500', 'غير محدود', 'غير محدود'] },
      { label: 'أكواد QR', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'QR لكل فرع', vals: ['x', 'check', 'check', 'check'] },
      { label: 'صفحة QR مخصصة', vals: ['x', 'check', 'check', 'check'] },
      { label: 'تحليلات QR', vals: ['x', 'check', 'check', 'check'] },
      { label: 'تحليلات متقدمة', vals: ['x', 'check', 'check', 'check'] },
      { label: 'مقارنة الفروع', vals: ['x', 'check', 'check', 'check'] },
      { label: 'تقارير متقدمة', vals: ['x', 'x', 'check', 'check'] },
      { label: 'إدارة الفريق', vals: ['x', 'check', 'check', 'check'] },
      { label: 'المهام', vals: ['x', 'check', 'check', 'check'] },
      { label: 'رفع الشعار', vals: ['x', 'check', 'check', 'check'] },
      { label: 'وصول API', vals: ['x', 'x', 'x', 'check'] },
      { label: 'دعم مميز', vals: ['x', 'x', 'check', 'check'] },
      { label: 'رد تلقائي AI', vals: ['check', 'check', 'check', 'check'] },
    ],
    ctaSectionH2: 'ابدأ بتحسين سمعتك الرقمية اليوم',
    ctaSectionDesc: 'انضم إلى الأعمال التي تدير سمعتها بذكاء مع سيندا',
    ctaSectionBtn: 'ابدأ تجربتك المجانية',
    contactLabel: 'تواصل معنا',
    contactH2: 'نحب أن نسمع منك',
    contactDesc: 'سواء كان لديك سؤال، طلب تجربة، أو تريد معرفة المزيد — فريقنا هنا',
    contactFields: { name: 'الاسم الكامل *', email: 'البريد الإلكتروني *', phone: 'رقم الهاتف', company: 'اسم الشركة', message: 'رسالتك *' },
    contactPlaceholders: { name: 'الاسم الكامل', email: 'email@example.com', phone: '+966 5XXXXXXXX', company: 'اسم الشركة', message: 'اكتب رسالتك هنا...' },
    contactSubmit: 'إرسال الرسالة',
    contactSending: 'جاري الإرسال...',
    contactSuccessTitle: 'تم إرسال رسالتك بنجاح!',
    contactSuccessDesc: 'سيتواصل معك فريقنا في أقرب وقت ممكن',
    contactSuccessRetry: 'إرسال رسالة أخرى',
    contactError: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.',
    footerTagline: 'منصة متكاملة لإدارة تقييمات جوجل وتحسين السمعة الرقمية',
    footerProduct: 'المنتج',
    footerProductLinks: ['المميزات', 'الأسعار', 'كيف يعمل'],
    footerSupport: 'الدعم',
    footerSupportLinks: ['مركز المساعدة', 'تواصل معنا'],
    footerLegal: 'قانوني',
    footerLegalLinks: [
      { label: 'سياسة الخصوصية', path: '/privacy' },
      { label: 'شروط الاستخدام', path: '/terms' },
    ],
    copyright: '© 2025 SENDA. جميع الحقوق محفوظة.',
  },
  en: {
    dir: 'ltr',
    langToggle: 'عربي',
    nav: ['Home', 'Features', 'How it Works', 'Pricing', 'Contact'],
    navIds: ['hero', 'features', 'how-it-works', 'pricing', 'contact'],
    loginBtn: 'Login',
    ctaBtn: 'Start Free',
    heroH1: 'AI-Powered Google Review Management',
    heroSub: 'A complete platform for smart replies, review collection, and reputation analytics across all your branches',
    heroCtaPrimary: 'Start Your Free Trial',
    heroCtaSecondary: 'Explore Features',
    dashPreviewTitle: 'SENDA Dashboard',
    dashSidebar: ['Reviews', 'Analytics', 'Branches', 'Team', 'Settings'],
    dashStats: [
      { label: 'Total Reviews', value: '1,284' },
      { label: 'Avg Rating', value: '4.7' },
      { label: 'AI Replies This Month', value: '186' },
      { label: 'New Reviews', value: '24' },
    ],
    dashReviews: [
      { initials: 'A', stars: 5, text: 'Great service, highly recommend!', status: 'Replied' },
      { initials: 'S', stars: 4, text: 'Very good, delivery was excellent', status: 'Pending' },
      { initials: 'K', stars: 5, text: 'Outstanding experience, thank you', status: 'Replied' },
    ],
    featuresLabel: 'What SENDA Offers',
    featuresH2: 'All Reputation Tools in One Platform',
    featureCards: [
      { title: 'AI-Powered Replies', desc: 'Custom replies for each review that reflect your brand identity in seconds', icon: 'Brain' },
      { title: 'QR Review Collection', desc: 'Turn every customer interaction into a Google review with a simple scan', icon: 'QrCode' },
      { title: 'Advanced Analytics', desc: 'Real data about your reputation performance for smarter decisions', icon: 'BarChart3' },
      { title: 'Multi-Branch Management', desc: 'Manage all your branches from a single centralized dashboard', icon: 'Building2' },
      { title: 'Team Management', desc: 'Assign tasks and monitor team performance with custom permissions', icon: 'Users' },
      { title: 'Reply Templates', desc: 'A library of ready templates you can customize to match your brand tone', icon: 'FileText' },
    ],
    benefitsLabel: 'Benefits',
    benefitsH2: 'Why Choose SENDA?',
    benefits: [
      { title: 'Save Time', desc: 'Save hours weekly with smart auto-replies on all your reviews instead of manual drafting', icon: 'Clock' },
      { title: 'Increase Positive Reviews', desc: 'Collect more reviews from happy customers via smart QR codes across your branches', icon: 'Star' },
      { title: 'Data-Driven Decisions', desc: 'Analyze every branch and team member performance for informed customer experience decisions', icon: 'BarChart3' },
      { title: 'Protect Your Reputation', desc: 'Instant alerts for negative reviews with smart replies that preserve your brand image', icon: 'Shield' },
    ],
    howLabel: 'How It Works',
    howH2: 'Three Steps to Manage Your Reputation',
    howSteps: [
      { num: '1', title: 'Connect Your Account', desc: 'Link your Google Business account in minutes and add your branches' },
      { num: '2', title: 'Activate AI', desc: 'Customize reply tone and configure auto-reply settings for your brand' },
      { num: '3', title: 'Monitor & Improve', desc: 'Track reviews and analytics to continuously improve your digital reputation' },
    ],
    pricingLabel: 'Plans & Pricing',
    pricingH2: 'Start with the Right Plan',
    pricingDesc: 'All plans include a free trial - no credit card required',
    pricingMo: 'SAR/mo',
    pricingMostPopular: 'Most Popular',
    pricingContactUs: 'Contact Us',
    pricingCtaDefault: 'Start Free',
    pricingCtaHighlight: 'Start Free Now',
    plans: [
      { name: 'Orbit', nameAr: 'Orbit', price: '99', features: ['1 Branch', '1 Member', '50 AI Replies/mo', '100 Templates', '1 QR Code'] },
      { name: 'Nova', nameAr: 'Nova', price: '199', popular: true, features: ['3 Branches', '3 Members', '300 AI Replies/mo', '500 Templates', '3 QR Codes'] },
      { name: 'Galaxy', nameAr: 'Galaxy', price: '399', features: ['10 Branches', '10 Members', '1,500 AI Replies/mo', 'Unlimited Templates', '10 QR Codes'] },
      { name: 'Infinity', nameAr: 'Infinity', price: null, features: ['Unlimited Branches', 'Unlimited Members', 'Unlimited AI Replies', 'Unlimited Templates', 'Unlimited QR Codes'] },
    ],
    compareTitle: 'Full Plan Comparison',
    compareFeatureCol: 'Feature',
    compareRows: [
      { label: 'Branches', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'Team Members', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'AI Replies/mo', vals: ['50', '300', '1,500', 'Unlimited'] },
      { label: 'Template Replies', vals: ['100', '500', 'Unlimited', 'Unlimited'] },
      { label: 'QR Codes', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'QR per Branch', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Custom QR Page', vals: ['x', 'check', 'check', 'check'] },
      { label: 'QR Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Advanced Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Branch Comparison', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Advanced Reports', vals: ['x', 'x', 'check', 'check'] },
      { label: 'Team Management', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Tasks', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Logo Upload', vals: ['x', 'check', 'check', 'check'] },
      { label: 'API Access', vals: ['x', 'x', 'x', 'check'] },
      { label: 'Premium Support', vals: ['x', 'x', 'check', 'check'] },
      { label: 'Auto AI Reply', vals: ['check', 'check', 'check', 'check'] },
    ],
    ctaSectionH2: 'Start Improving Your Digital Reputation Today',
    ctaSectionDesc: 'Join businesses that manage their reputation smartly with SENDA',
    ctaSectionBtn: 'Start Your Free Trial',
    contactLabel: 'Contact Us',
    contactH2: 'We\'d Love to Hear from You',
    contactDesc: 'Whether you have a question, want a demo, or want to learn more - our team is here',
    contactFields: { name: 'Full Name *', email: 'Email *', phone: 'Phone', company: 'Company', message: 'Your Message *' },
    contactPlaceholders: { name: 'Full name', email: 'email@example.com', phone: '+966 5XXXXXXXX', company: 'Company name', message: 'Write your message here...' },
    contactSubmit: 'Send Message',
    contactSending: 'Sending...',
    contactSuccessTitle: 'Message Sent Successfully!',
    contactSuccessDesc: 'Our team will get back to you as soon as possible',
    contactSuccessRetry: 'Send Another Message',
    contactError: 'An error occurred. Please try again.',
    footerTagline: 'A complete platform for Google review management and digital reputation',
    footerProduct: 'Product',
    footerProductLinks: ['Features', 'Pricing', 'How it Works'],
    footerSupport: 'Support',
    footerSupportLinks: ['Help Center', 'Contact Us'],
    footerLegal: 'Legal',
    footerLegalLinks: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
    ],
    copyright: '© 2025 SENDA. All rights reserved.',
  },
};

// ─── Icon map ──────────────────────────────────────────────────────────────────
const IconMap: Record<string, any> = { Brain, QrCode, BarChart3, Building2, Users, FileText, Clock, Star, Shield };

// ─── Shared styles ────────────────────────────────────────────────────────────
const sectionPadding: React.CSSProperties = { padding: '100px 24px', maxWidth: 1200, margin: '0 auto' };
const sectionTitle = (): React.CSSProperties => ({
  fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 600, color: C.text, marginBottom: 16,
  textAlign: 'center', lineHeight: 1.3,
});
const sectionSub: React.CSSProperties = { fontSize: 17, color: C.muted, textAlign: 'center', maxWidth: 640, margin: '0 auto 56px', lineHeight: 1.7, fontWeight: 400 };
const goldBtn: React.CSSProperties = {
  background: GOLD_GRAD, color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px',
  fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8,
};
const outlineBtn: React.CSSProperties = {
  background: 'transparent', color: C.gold, border: `2px solid ${C.gold}`, borderRadius: 10, padding: '12px 28px',
  fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8,
};
const cardStyle: React.CSSProperties = {
  background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)', transition: 'all 0.25s',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('ar');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const t = T[lang];

  useEffect(() => {
    document.title = lang === 'ar' ? 'سيندا — إدارة تقييمات جوجل بذكاء اصطناعي' : 'SENDA — AI Google Review Management';
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setFormError('');
    try {
      const { error } = await supabase.functions.invoke('send-contact', { body: form });
      if (error) throw error;
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (err) {
      console.error('[Contact]', err);
      setStatus('error');
      setFormError(t.contactError);
    }
  };

  const dir = t.dir;
  const isRtl = lang === 'ar';

  // ─── Stars helper ───────────────────────────────────────────────────────────
  const Stars = ({ count }: { count: number }) => (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill={C.gold} color={C.gold} />
      ))}
    </span>
  );

  // ─── Check / X for comparison table ──────────────────────────────────────
  const CellVal = ({ v }: { v: string }) => {
    if (v === 'check') return <span style={{ color: C.greenCheck, fontSize: 18, fontWeight: 700 }}>&#10003;</span>;
    if (v === 'x') return <span style={{ color: '#D1D5DB', fontSize: 18, fontWeight: 700 }}>&#10005;</span>;
    return <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{v}</span>;
  };

  // ─── Logo component ─────────────────────────────────────────────────────────
  // Logo helper — no wrapper needed (white-bg logo)
  const LogoImg = ({ height = 32, invert = false }: { height?: number; invert?: boolean }) => (
    <img src="/senda-logo.png" alt="SENDA" style={{ height, ...(invert ? { filter: 'brightness(0) invert(1)' } : {}) }} />
  );

  return (
    <div style={{ direction: dir, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <LogoImg height={40} />
            <span style={{ fontSize: 20, fontWeight: 600, color: C.text, letterSpacing: '-0.3px' }}>SENDA</span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
            {t.nav.map((label: string, i: number) => (
              <button key={i} onClick={() => scrollTo(t.navIds[i])} style={{
                background: 'none', border: 'none', color: C.muted, fontSize: 15, fontWeight: 400,
                cursor: 'pointer', padding: '4px 0', transition: 'color 0.2s',
              }}
                onMouseOver={e => (e.currentTarget.style.color = C.gold)}
                onMouseOut={e => (e.currentTarget.style.color = C.muted)}
              >{label}</button>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="nav-ctas">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 14px',
              fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer',
            }}>{t.langToggle}</button>
            <button onClick={() => navigate('/login')} style={{
              background: 'none', border: 'none', color: C.text, fontSize: 15, fontWeight: 400, cursor: 'pointer', padding: '8px 16px',
            }}>{t.loginBtn}</button>
            <button onClick={() => navigate('/login')} style={{
              ...goldBtn, padding: '10px 22px', fontSize: 14, borderRadius: 8,
            }}>{t.ctaBtn}</button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            display: 'none', background: 'none', border: 'none', color: C.text, cursor: 'pointer', padding: 8,
          }} className="nav-mobile-toggle">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            position: 'absolute', top: 72, left: 0, right: 0, background: C.card,
            borderBottom: `1px solid ${C.border}`, padding: '16px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}>
            {t.nav.map((label: string, i: number) => (
              <button key={i} onClick={() => scrollTo(t.navIds[i])} style={{
                display: 'block', width: '100%', textAlign: isRtl ? 'right' : 'left', background: 'none',
                border: 'none', color: C.text, fontSize: 16, fontWeight: 400, padding: '12px 0',
                borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
              }}>{label}</button>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); setMobileOpen(false); }} style={{
                background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 16px',
                fontSize: 14, color: C.muted, cursor: 'pointer', fontWeight: 600,
              }}>{t.langToggle}</button>
              <button onClick={() => { navigate('/login'); setMobileOpen(false); }} style={{
                ...goldBtn, padding: '10px 20px', fontSize: 14, borderRadius: 8, flex: 1, justifyContent: 'center',
              }}>{t.ctaBtn}</button>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section id="hero" style={{ paddingTop: 140, paddingBottom: 80, background: `linear-gradient(180deg, #FFFFFF 0%, ${C.bg} 100%)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* Text center */}
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto', marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              <span style={{ fontSize: 40, fontWeight: 600, color: C.gold, letterSpacing: '-1px' }}>S</span>
              <span style={{ fontSize: 28, fontWeight: 600, color: C.text, letterSpacing: '-0.5px' }}>SENDA</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 600, color: C.text, lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.5px',
            }}>
              {t.heroH1}
            </h1>
            <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.7, marginBottom: 36, fontWeight: 400 }}>
              {t.heroSub}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
              <button onClick={() => navigate('/login')} style={goldBtn}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(184,150,90,0.35)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {t.heroCtaPrimary}
                {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </button>
              <button onClick={() => scrollTo('features')} style={outlineBtn}
                onMouseOver={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.gold; }}
              >
                {t.heroCtaSecondary}
              </button>
            </div>
          </div>

          {/* ── CSS-only Dashboard Mockup ── */}
          <div style={{
            maxWidth: 960, margin: '0 auto',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)',
            border: `1px solid ${C.border}`,
            background: C.card,
          }}>
            {/* Browser chrome bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: '#F3F4F6', borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22C55E' }} />
              <div style={{
                flex: 1, marginInlineStart: 12, background: '#fff', borderRadius: 6, padding: '5px 14px',
                fontSize: 12, color: C.muted, border: `1px solid ${C.border}`,
              }}>gandx.net/dashboard</div>
            </div>

            {/* App body: sidebar + main */}
            <div style={{ display: 'flex', minHeight: 360 }}>
              {/* Sidebar */}
              <div className="dash-sidebar" style={{
                width: 200, background: '#1A1A2E', padding: '20px 0', flexShrink: 0,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <div style={{ padding: '0 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
                  <span style={{ color: C.gold, fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>SENDA</span>
                </div>
                {t.dashSidebar.map((item: string, i: number) => (
                  <div key={i} style={{
                    padding: '9px 16px', fontSize: 13, fontWeight: i === 0 ? 600 : 400,
                    color: i === 0 ? C.gold : 'rgba(255,255,255,0.5)',
                    background: i === 0 ? 'rgba(184,150,90,0.12)' : 'transparent',
                    borderInlineStart: i === 0 ? `3px solid ${C.gold}` : '3px solid transparent',
                  }}>{item}</div>
                ))}
              </div>

              {/* Main content area */}
              <div style={{ flex: 1, padding: 20, background: '#FAFBFC', overflow: 'hidden' }}>
                {/* Topbar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>{t.dashPreviewTitle}</span>
                  <LayoutDashboard size={18} color={C.gold} />
                </div>

                {/* Stats cards row */}
                <div className="dash-stats-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20,
                }}>
                  {t.dashStats.map((s: any, i: number) => (
                    <div key={i} style={{
                      background: '#fff', borderRadius: 10, padding: '14px 12px',
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: C.text }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Reviews list */}
                <div style={{
                  background: '#fff', borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
                    fontSize: 13, fontWeight: 600, color: C.text,
                  }}>
                    {lang === 'ar' ? 'آخر التقييمات' : 'Recent Reviews'}
                  </div>
                  {t.dashReviews.map((r: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: i < t.dashReviews.length - 1 ? `1px solid ${C.border}` : 'none',
                      background: i % 2 === 1 ? '#FAFBFC' : '#fff',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: GOLD_GRAD,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0,
                        }}>{r.initials}</div>
                        <div>
                          <Stars count={r.stars} />
                          <div style={{ fontSize: 12, color: C.muted, fontWeight: 400, marginTop: 2 }}>{r.text}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: r.status === (lang === 'ar' ? 'تم الرد' : 'Replied') ? 'rgba(184,150,90,0.1)' : 'rgba(107,114,128,0.1)',
                        color: r.status === (lang === 'ar' ? 'تم الرد' : 'Replied') ? C.gold : C.muted,
                        whiteSpace: 'nowrap',
                      }}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" style={{ background: C.bg }}>
        <div style={sectionPadding}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            {t.featuresLabel}
          </p>
          <h2 style={sectionTitle()}>{t.featuresH2}</h2>
          <div style={{ height: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {t.featureCards.map((f: any, i: number) => {
              const Icon = IconMap[f.icon] || Sparkles;
              return (
                <div key={i} style={{ ...cardStyle, cursor: 'default' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = cardStyle.boxShadow as string; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'rgba(184,150,90,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                  }}>
                    <Icon size={24} color={C.gold} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BENEFITS ═══════════════════ */}
      <section style={{ background: '#FFFFFF' }}>
        <div style={sectionPadding}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            {t.benefitsLabel}
          </p>
          <h2 style={sectionTitle()}>{t.benefitsH2}</h2>
          <div style={{ height: 24 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 32 }}>
            {t.benefits.map((b: any, i: number) => {
              const Icon = IconMap[b.icon] || Sparkles;
              return (
                <div key={i} style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: GOLD_GRAD,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    boxShadow: '0 4px 16px rgba(184,150,90,0.3)',
                  }}>
                    <Icon size={28} color="#fff" />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>{b.title}</h3>
                  <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" style={{ background: C.bg }}>
        <div style={sectionPadding}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            {t.howLabel}
          </p>
          <h2 style={sectionTitle()}>{t.howH2}</h2>
          <div style={{ height: 24 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 40 }}>
            {t.howSteps.map((s: any, i: number) => (
              <div key={i} style={{ flex: '1 1 280px', maxWidth: 340, textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: i === 1 ? GOLD_GRAD : C.card,
                  border: i !== 1 ? `2px solid ${C.gold}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  fontSize: 24, fontWeight: 600, color: i === 1 ? '#fff' : C.gold,
                  boxShadow: i === 1 ? '0 4px 16px rgba(184,150,90,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {s.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0, fontWeight: 400 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="pricing" style={{ background: '#FFFFFF' }}>
        <div style={sectionPadding}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            {t.pricingLabel}
          </p>
          <h2 style={sectionTitle()}>{t.pricingH2}</h2>
          <p style={sectionSub}>{t.pricingDesc}</p>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, marginBottom: 80 }}>
            {t.plans.map((plan: any, i: number) => {
              const isPopular = plan.popular;
              return (
                <div key={i} style={{
                  ...cardStyle,
                  border: isPopular ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                  position: 'relative',
                  transform: isPopular ? 'scale(1.03)' : 'none',
                  boxShadow: isPopular ? '0 8px 32px rgba(184,150,90,0.15)' : cardStyle.boxShadow as string,
                }}
                  onMouseOver={e => { e.currentTarget.style.transform = isPopular ? 'scale(1.05)' : 'translateY(-4px)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = isPopular ? 'scale(1.03)' : 'none'; }}
                >
                  {isPopular && (
                    <div style={{
                      position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                      background: GOLD_GRAD, color: '#fff', fontSize: 12, fontWeight: 600,
                      padding: '5px 18px', borderRadius: 20, whiteSpace: 'nowrap',
                    }}>{t.pricingMostPopular}</div>
                  )}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>{plan.name}</h3>
                    <p style={{ fontSize: 14, color: C.gold, fontWeight: 600, marginBottom: 16 }}>{plan.nameAr}</p>
                    {plan.price ? (
                      <div>
                        <span style={{ fontSize: 42, fontWeight: 600, color: C.text }}>{plan.price}</span>
                        <span style={{ fontSize: 15, color: C.muted, marginInlineStart: 4, fontWeight: 400 }}>{t.pricingMo}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 24, fontWeight: 600, color: C.gold, padding: '10px 0' }}>{t.pricingContactUs}</div>
                    )}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plan.features.map((f: string, fi: number) => (
                      <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.text, fontWeight: 400 }}>
                        <CheckCircle2 size={16} color={C.greenCheck} style={{ flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => plan.price ? navigate('/login') : scrollTo('contact')} style={{
                    ...(isPopular ? goldBtn : outlineBtn),
                    width: '100%', justifyContent: 'center', borderRadius: 10,
                    padding: '12px 0',
                  }}
                    onMouseOver={e => { if (!isPopular) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#fff'; } }}
                    onMouseOut={e => { if (!isPopular) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.gold; } }}
                  >
                    {plan.price ? (isPopular ? t.pricingCtaHighlight : t.pricingCtaDefault) : t.pricingContactUs}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Comparison table ── */}
          <h3 style={{ fontSize: 24, fontWeight: 600, color: C.text, textAlign: 'center', marginBottom: 32 }}>{t.compareTitle}</h3>
          <div style={{ overflowX: 'auto', borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#F3F4F6', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{
                    padding: '14px 20px', textAlign: isRtl ? 'right' : 'left', fontWeight: 600, color: C.text,
                    borderBottom: `2px solid ${C.border}`, background: '#F3F4F6',
                  }}>
                    {t.compareFeatureCol}
                  </th>
                  {t.plans.map((p: any, i: number) => (
                    <th key={i} style={{
                      padding: '14px 16px', textAlign: 'center', fontWeight: 600,
                      borderBottom: `2px solid ${C.border}`,
                      color: p.popular ? C.gold : C.text,
                      background: p.popular ? 'rgba(184,150,90,0.06)' : '#F3F4F6',
                      position: 'relative',
                    }}>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 400, color: C.muted, marginTop: 2 }}>
                        {p.price ? `${p.price} ${t.pricingMo}` : t.pricingContactUs}
                      </div>
                      {p.popular && (
                        <div style={{
                          position: 'absolute', top: -1, left: 0, right: 0, height: 3,
                          background: GOLD_GRAD, borderRadius: '0 0 3px 3px',
                        }} />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.compareRows.map((row: any, ri: number) => (
                  <tr key={ri} style={{
                    borderBottom: ri < t.compareRows.length - 1 ? `1px solid ${C.border}` : 'none',
                    background: ri % 2 === 0 ? '#fff' : '#FAFBFC',
                  }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500, color: C.text }}>{row.label}</td>
                    {row.vals.map((v: string, vi: number) => (
                      <td key={vi} style={{
                        padding: '12px 16px', textAlign: 'center',
                        background: t.plans[vi]?.popular ? (ri % 2 === 0 ? 'rgba(184,150,90,0.03)' : 'rgba(184,150,90,0.06)') : undefined,
                      }}><CellVal v={v} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA SECTION ═══════════════════ */}
      <section style={{ background: C.dark }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, color: '#fff', marginBottom: 16, lineHeight: 1.3 }}>
            {t.ctaSectionH2}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.7, fontWeight: 400 }}>
            {t.ctaSectionDesc}
          </p>
          <button onClick={() => navigate('/login')} style={{
            ...goldBtn, padding: '16px 40px', fontSize: 17, borderRadius: 12,
          }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(184,150,90,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {t.ctaSectionBtn}
            {isRtl ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </section>

      {/* ═══════════════════ CONTACT ═══════════════════ */}
      <section id="contact" style={{ background: '#FFFFFF' }}>
        <div style={sectionPadding}>
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            {t.contactLabel}
          </p>
          <h2 style={sectionTitle()}>{t.contactH2}</h2>
          <p style={sectionSub}>{t.contactDesc}</p>

          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {status === 'success' ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  <CheckCircle2 size={32} color={C.greenCheck} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8 }}>{t.contactSuccessTitle}</h3>
                <p style={{ fontSize: 16, color: C.muted, marginBottom: 24, fontWeight: 400 }}>{t.contactSuccessDesc}</p>
                <button onClick={() => setStatus('idle')} style={outlineBtn}>{t.contactSuccessRetry}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{t.contactFields.name}</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder={t.contactPlaceholders.name}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                        fontSize: 15, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box',
                        direction: dir, fontWeight: 400,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = C.gold}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{t.contactFields.email}</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder={t.contactPlaceholders.email}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                        fontSize: 15, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box',
                        direction: 'ltr', fontWeight: 400,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = C.gold}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>
                </div>
                <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{t.contactFields.phone}</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder={t.contactPlaceholders.phone}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                        fontSize: 15, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box',
                        direction: 'ltr', fontWeight: 400,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = C.gold}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{t.contactFields.company}</label>
                    <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                      placeholder={t.contactPlaceholders.company}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                        fontSize: 15, color: C.text, background: C.bg, outline: 'none', boxSizing: 'border-box',
                        direction: dir, fontWeight: 400,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = C.gold}
                      onBlur={e => e.currentTarget.style.borderColor = C.border}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{t.contactFields.message}</label>
                  <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder={t.contactPlaceholders.message}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                      fontSize: 15, color: C.text, background: C.bg, outline: 'none', resize: 'vertical',
                      fontFamily: 'inherit', boxSizing: 'border-box', direction: dir, fontWeight: 400,
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = C.gold}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                </div>
                {formError && (
                  <p style={{ color: C.red, fontSize: 14, margin: 0 }}>{formError}</p>
                )}
                <button type="submit" disabled={status === 'loading'} style={{
                  ...goldBtn, width: '100%', justifyContent: 'center', padding: '14px 0', borderRadius: 10,
                  opacity: status === 'loading' ? 0.7 : 1,
                }}>
                  {status === 'loading' ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> {t.contactSending}</>
                  ) : (
                    <><Send size={18} /> {t.contactSubmit}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer style={{ background: C.dark, color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 40, marginBottom: 48 }}>
            {/* Brand col */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <LogoImg height={36} invert />
                <span style={{ fontSize: 18, fontWeight: 600 }}>SENDA</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: 280, fontWeight: 400 }}>{t.footerTagline}</p>
              {/* Social */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                {/* Twitter/X */}
                <a href="https://x.com/sabortech" target="_blank" rel="noopener noreferrer" style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(184,150,90,0.3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="https://linkedin.com/company/sabortech" target="_blank" rel="noopener noreferrer" style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(184,150,90,0.3)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product col */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: 'rgba(255,255,255,0.9)' }}>{t.footerProduct}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.footerProductLinks.map((link: string, i: number) => (
                  <li key={i}>
                    <button onClick={() => scrollTo(['features', 'pricing', 'how-it-works'][i])} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', padding: 0, fontWeight: 400,
                    }}
                      onMouseOver={e => e.currentTarget.style.color = C.gold}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >{link}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support col */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: 'rgba(255,255,255,0.9)' }}>{t.footerSupport}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.footerSupportLinks.map((link: string, i: number) => (
                  <li key={i}>
                    <button onClick={() => i === 1 ? scrollTo('contact') : undefined} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', padding: 0, fontWeight: 400,
                    }}
                      onMouseOver={e => e.currentTarget.style.color = C.gold}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >{link}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal col */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, color: 'rgba(255,255,255,0.9)' }}>{t.footerLegal}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.footerLegalLinks.map((link: any, i: number) => (
                  <li key={i}>
                    <button onClick={() => navigate(link.path)} style={{
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer', padding: 0, fontWeight: 400,
                    }}
                      onMouseOver={e => e.currentTarget.style.color = C.gold}
                      onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 0',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 400 }}>{t.copyright}</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {t.footerLegalLinks.map((link: any, i: number) => (
                <button key={i} onClick={() => navigate(link.path)} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 400,
                }}
                  onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{link.label}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ GLOBAL STYLES ═══════════════════ */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        * { box-sizing: border-box; margin: 0; }

        ::placeholder { color: ${C.muted}; opacity: 0.6; }

        /* Desktop nav visibility */
        .nav-desktop { display: flex !important; }
        .nav-ctas { display: flex !important; }
        .nav-mobile-toggle { display: none !important; }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-ctas { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .dash-sidebar { display: none !important; }
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .form-grid-2 { grid-template-columns: 1fr !important; }
        }

        /* Smooth scroll */
        html { scroll-behavior: smooth; scroll-padding-top: 80px; }

        /* Selection color */
        ::selection { background: rgba(184, 150, 90, 0.2); }
      `}</style>
    </div>
  );
}
