// ============================================================================
// SENDA — Public Marketing Homepage
// Light theme · Teal accent · Premium · Elegant · Clean
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  CheckCircle2, Send, Loader2, Menu, X,
  Sparkles, Shield, Clock, ArrowLeft, ArrowRight,
  Star, MessageSquare, BellRing, ListChecks, CreditCard,
  Link2, RefreshCw, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'EN',
    nav: ['من نحن', 'المميزات', 'الباقات', 'الأسئلة الشائعة', 'المدونة', 'تواصل معنا'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
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
    pricingLabel: 'الخطط والأسعار',
    pricingH2: 'ابدأ بالخطة المناسبة لعملك',
    pricingDesc: 'جميع الخطط تشمل فترة تجريبية مجانية — لا بطاقة ائتمان مطلوبة',
    pricingMo: 'ر.س/شهر',
    pricingMostPopular: 'الأكثر طلبًا',
    pricingContactUs: 'تواصل مع المبيعات',
    pricingCtaDefault: 'ابدأ مجانًا',
    pricingCtaHighlight: 'ابدأ مجانًا الآن',
    plans: [
      { name: 'Orbit', nameAr: 'مدار', price: '99', features: ['1 فرع', '1 عضو فريق', '50 رد ذكي شهريًا', '100 رد قالب', 'ربط Google Business', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية'] },
      { name: 'Nova', nameAr: 'نوفا', price: '199', popular: true, features: ['3 فروع', '3 أعضاء فريق', '300 رد ذكي شهريًا', '500 رد قالب', 'ربط Google Business', 'الرد الآلي بالذكاء الاصطناعي', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية', 'إدارة المهام', 'إدارة الفروع', 'التحليلات المتقدمة', 'صفحة هبوط QR', 'تحليلات رموز QR'] },
      { name: 'Galaxy', nameAr: 'جالكسي', price: '399', features: ['10 فروع', '10 أعضاء فريق', '1,500 رد ذكي شهريًا', 'ردود قوالب غير محدودة', 'ربط Google Business', 'الرد الآلي بالذكاء الاصطناعي', 'الرد اليدوي', 'قوالب الردود', 'الإشعارات الفورية', 'إدارة المهام', 'إدارة الفريق', 'التحليلات المتقدمة', 'مقارنة الفروع', 'الدعم المميز 24/7', 'صفحة هبوط QR', 'تحليلات رموز QR'] },
      { name: 'Infinity', nameAr: 'إنفينيتي', price: null, features: ['فروع غير محدودة', 'أعضاء غير محدودين', 'ردود ذكية غير محدودة', 'ردود قوالب غير محدودة', 'حلول مخصصة بلا حدود', 'دعم وتخصيص أعلى'] },
    ],
    compareTitle: 'مقارنة شاملة بين الخطط',
    compareFeatureCol: 'الميزة',
    compareRows: [
      { label: 'عدد الفروع', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'أعضاء الفريق', vals: ['1', '3', '10', 'غير محدود'] },
      { label: 'ردود الذكاء الاصطناعي', vals: ['50', '300', '1,500', 'غير محدود'] },
      { label: 'ردود القوالب', vals: ['100', '500', 'غير محدود', 'غير محدود'] },
      { label: 'ربط Google Business', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الرد الآلي بالذكاء الاصطناعي', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الرد اليدوي', vals: ['check', 'check', 'check', 'check'] },
      { label: 'قوالب الردود', vals: ['check', 'check', 'check', 'check'] },
      { label: 'الإشعارات الفورية', vals: ['check', 'check', 'check', 'check'] },
      { label: 'إدارة المهام', vals: ['x', 'check', 'check', 'check'] },
      { label: 'إدارة الفروع', vals: ['x', 'check', 'check', 'check'] },
      { label: 'إدارة الفريق', vals: ['x', 'x', 'check', 'check'] },
      { label: 'التحليلات المتقدمة', vals: ['x', 'check', 'check', 'check'] },
      { label: 'مقارنة الفروع', vals: ['x', 'x', 'check', 'check'] },
      { label: 'الدعم المميز 24/7', vals: ['x', 'x', 'check', 'check'] },
      { label: 'صفحة هبوط QR', vals: ['x', 'check', 'check', 'check'] },
      { label: 'تحليلات رموز QR', vals: ['x', 'check', 'check', 'check'] },
      { label: 'التخصيص', vals: ['x', 'x', 'x', 'check'] },
      { label: 'الحلول الخاصة', vals: ['x', 'x', 'x', 'check'] },
    ],
    faqLabel: 'الأسئلة الشائعة',
    faqH2: 'إجابات على أهم تساؤلاتك',
    faqs: [
      { q: 'ما هي سيندا؟', a: 'سيندا هي منصة سعودية متكاملة لإدارة تقييمات Google Business، الردود الذكية بالذكاء الاصطناعي، تحليلات الأداء، وإدارة الفروع والفريق من مكان واحد.' },
      { q: 'هل يمكنني تجربة المنصة مجانًا؟', a: 'نعم، جميع الخطط تتضمن فترة تجريبية مجانية بدون الحاجة لبطاقة ائتمان. يمكنك البدء فورًا واستكشاف جميع المميزات.' },
      { q: 'كيف يعمل الرد الذكي بالذكاء الاصطناعي؟', a: 'يقوم الذكاء الاصطناعي بتحليل نص التقييم وصياغة رد احترافي يتناسب مع محتوى التقييم ونبرة علامتك التجارية تلقائيًا، مع إمكانية التعديل قبل النشر.' },
      { q: 'هل أحتاج خبرة تقنية لاستخدام المنصة؟', a: 'لا، سيندا مصممة لتكون سهلة الاستخدام. كل ما تحتاجه هو ربط حساب Google Business الخاص بك والبدء في إدارة تقييماتك فورًا.' },
      { q: 'هل يمكنني إدارة أكثر من فرع؟', a: 'نعم، خطط نوفا وجالكسي وإنفينيتي تدعم إدارة فروع متعددة مع إمكانية المقارنة بين أدائها وتتبع كل فرع على حدة.' },
      { q: 'كيف يتم حساب الضريبة؟', a: 'يتم إضافة ضريبة القيمة المضافة بنسبة 15% على جميع الخطط. الأسعار المعروضة هي قبل الضريبة، ويظهر الإجمالي الشامل عند الاشتراك.' },
    ],
    ctaSectionH2: 'حوّل نشاطك إلى مستوى جديد',
    ctaSectionDesc: 'ابدأ تجربة مجانية وانطلق بثقة كاملة في إدارة سمعتك الرقمية',
    ctaSectionBtn: 'ابدأ تجربتك المجانية',
    contactLabel: 'تواصل معنا',
    contactH2: 'نحب أن نسمع منك',
    contactDesc: 'سواء كان لديك سؤال، طلب تجربة، أو تريد معرفة المزيد — فريقنا جاهز لمساعدتك',
    contactFields: { name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', company: 'اسم الشركة', message: 'رسالتك' },
    contactPlaceholders: { name: 'الاسم الكامل', email: 'email@example.com', phone: '+966 5XXXXXXXX', company: 'اسم الشركة', message: 'اكتب رسالتك هنا...' },
    contactSubmit: 'إرسال الرسالة',
    contactSending: 'جاري الإرسال...',
    contactSuccessTitle: 'تم إرسال رسالتك بنجاح',
    contactSuccessDesc: 'سيتواصل معك فريقنا في أقرب وقت ممكن',
    contactSuccessRetry: 'إرسال رسالة أخرى',
    contactError: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.',
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
    copyright: '© 2025 SENDA. جميع الحقوق محفوظة.',
  },
  en: {
    dir: 'ltr',
    langToggle: 'عربي',
    nav: ['About', 'Features', 'Pricing', 'FAQ', 'Blog', 'Contact'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
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
    pricingLabel: 'Plans & Pricing',
    pricingH2: 'Start with the Right Plan',
    pricingDesc: 'All plans include a free trial — no credit card required',
    pricingMo: 'SAR/mo',
    pricingMostPopular: 'Most Popular',
    pricingContactUs: 'Contact Sales',
    pricingCtaDefault: 'Start Free',
    pricingCtaHighlight: 'Start Free Now',
    plans: [
      { name: 'Orbit', nameAr: 'Orbit', price: '99', features: ['1 Branch', '1 Team Member', '50 AI Replies/mo', '100 Template Replies', 'Google Business', 'Manual Reply', 'Reply Templates', 'Instant Notifications'] },
      { name: 'Nova', nameAr: 'Nova', price: '199', popular: true, features: ['3 Branches', '3 Team Members', '300 AI Replies/mo', '500 Template Replies', 'Google Business', 'AI Auto-Reply', 'Manual Reply', 'Reply Templates', 'Instant Notifications', 'Task Management', 'Branch Management', 'Advanced Analytics', 'QR Landing Page', 'QR Analytics'] },
      { name: 'Galaxy', nameAr: 'Galaxy', price: '399', features: ['10 Branches', '10 Team Members', '1,500 AI Replies/mo', 'Unlimited Templates', 'Google Business', 'AI Auto-Reply', 'Manual Reply', 'Reply Templates', 'Instant Notifications', 'Task Management', 'Team Management', 'Advanced Analytics', 'Branch Comparison', 'Premium 24/7 Support', 'QR Landing Page', 'QR Analytics'] },
      { name: 'Infinity', nameAr: 'Infinity', price: null, features: ['Unlimited Branches', 'Unlimited Members', 'Unlimited AI Replies', 'Unlimited Templates', 'Custom Solutions', 'Premium Support'] },
    ],
    compareTitle: 'Full Plan Comparison',
    compareFeatureCol: 'Feature',
    compareRows: [
      { label: 'Branches', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'Team Members', vals: ['1', '3', '10', 'Unlimited'] },
      { label: 'AI Replies/mo', vals: ['50', '300', '1,500', 'Unlimited'] },
      { label: 'Template Replies', vals: ['100', '500', 'Unlimited', 'Unlimited'] },
      { label: 'Google Business', vals: ['check', 'check', 'check', 'check'] },
      { label: 'AI Auto-Reply', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Manual Reply', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Reply Templates', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Notifications', vals: ['check', 'check', 'check', 'check'] },
      { label: 'Task Management', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Branch Management', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Team Management', vals: ['x', 'x', 'check', 'check'] },
      { label: 'Advanced Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Branch Comparison', vals: ['x', 'x', 'check', 'check'] },
      { label: 'Premium 24/7 Support', vals: ['x', 'x', 'check', 'check'] },
      { label: 'QR Landing Page', vals: ['x', 'check', 'check', 'check'] },
      { label: 'QR Analytics', vals: ['x', 'check', 'check', 'check'] },
      { label: 'Customization', vals: ['x', 'x', 'x', 'check'] },
      { label: 'Custom Solutions', vals: ['x', 'x', 'x', 'check'] },
    ],
    faqLabel: 'FAQ',
    faqH2: 'Answers to Your Most Important Questions',
    faqs: [
      { q: 'What is SENDA?', a: 'SENDA is a comprehensive Saudi platform for managing Google Business reviews, AI-powered smart replies, performance analytics, and branch and team management from one place.' },
      { q: 'Can I try the platform for free?', a: 'Yes, all plans include a free trial without needing a credit card. You can start immediately and explore all features.' },
      { q: 'How does AI smart reply work?', a: 'The AI analyzes the review text and crafts a professional reply that matches the review content and your brand tone automatically, with the option to edit before publishing.' },
      { q: 'Do I need technical experience?', a: 'No, SENDA is designed to be easy to use. All you need is to link your Google Business account and start managing your reviews immediately.' },
      { q: 'Can I manage multiple branches?', a: 'Yes, Nova, Galaxy, and Infinity plans support multi-branch management with the ability to compare performance and track each branch separately.' },
      { q: 'How is VAT calculated?', a: 'VAT at 15% is added to all plans. Displayed prices are before tax, and the total including tax is shown at subscription.' },
    ],
    ctaSectionH2: 'Elevate Your Business to the Next Level',
    ctaSectionDesc: 'Start your free trial and launch with full confidence in managing your digital reputation',
    ctaSectionBtn: 'Start Your Free Trial',
    contactLabel: 'Contact Us',
    contactH2: 'We\'d Love to Hear from You',
    contactDesc: 'Whether you have a question, want a demo, or want to learn more — our team is here',
    contactFields: { name: 'Full Name', email: 'Email', phone: 'Phone', company: 'Company', message: 'Your Message' },
    contactPlaceholders: { name: 'Full name', email: 'email@example.com', phone: '+966 5XXXXXXXX', company: 'Company name', message: 'Write your message here...' },
    contactSubmit: 'Send Message',
    contactSending: 'Sending...',
    contactSuccessTitle: 'Message Sent Successfully',
    contactSuccessDesc: 'Our team will get back to you as soon as possible',
    contactSuccessRetry: 'Send Another Message',
    contactError: 'An error occurred. Please try again.',
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
    copyright: '© 2025 SENDA. All rights reserved.',
  },
};

// ─── Icon map ──────────────────────────────────────────────────────────────────
const IconMap: Record<string, any> = {
  Brain, QrCode, BarChart3, Building2, Users, FileText, Clock, Star, Shield,
  MessageSquare, BellRing, ListChecks, CreditCard, Link2, RefreshCw, MessageCircle,
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    document.title = lang === 'ar' ? 'سيندا — إدارة تقييمات جوجل بذكاء اصطناعي' : 'SENDA — AI Google Review Management';
    document.documentElement.dir = t.dir;
    document.documentElement.lang = lang;
  }, [lang, t.dir]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  const CellVal = ({ v }: { v: string }) => {
    if (v === 'check') return <CheckCircle2 size={16} className="text-teal-500 mx-auto" />;
    if (v === 'x') return <X size={16} className="text-slate-300 mx-auto" />;
    return <span className="text-sm text-slate-700">{v}</span>;
  };

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
              <Link key={i} to={t.navPaths[i]} className={`text-[13px] font-medium transition-colors ${scrolled ? 'text-slate-500 hover:text-teal-600' : 'text-white/70 hover:text-white'}`}>{label}</Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${scrolled ? 'text-slate-500 border border-slate-200 hover:bg-slate-50' : 'text-white/70 border border-white/20 hover:bg-white/10'}`}>{t.langToggle}</button>
            <Link to="/login" className={`text-sm transition-colors px-3 py-1.5 ${scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'}`}>{t.loginBtn}</Link>
            <Link to="/login" className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm">{t.ctaBtn}</Link>
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
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 bg-teal-600 text-white text-sm font-medium py-2 rounded-lg text-center">{t.ctaBtn}</Link>
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
        <svg className="absolute top-[18%] right-[8%] w-16 h-16 text-teal-400/20 animate-pulse" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[25%] left-[10%] w-10 h-10 text-teal-400/15" viewBox="0 0 40 40" fill="none"><rect x="5" y="5" width="30" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <svg className="absolute top-[30%] left-[15%] w-6 h-6 text-white/10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" /></svg>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px] font-medium text-white/60 tracking-wide">{t.heroTag}</span>
          </div>

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
            <Link to="/register" className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20 inline-flex items-center gap-2">
              {t.heroCtaPrimary}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link to="/features" className="border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 font-medium px-8 py-3.5 rounded-xl text-sm transition-all inline-flex items-center gap-2">
              {t.heroCtaSecondary}
            </Link>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
          <span className="text-[11px] text-white/30 tracking-wide">{t.scrollDown}</span>
          <div className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center bg-white/5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        </div>
      </section>

      {/* ═══════════════════ WHAT IS SENDA ═══════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">{t.whatLabel}</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-4">{t.whatH2}</h2>
          <p className="text-base text-slate-500 leading-relaxed">{t.whatDesc}</p>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="pb-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {t.featureCards.map((f: any, i: number) => {
              const Icon = IconMap[f.icon] || Sparkles;
              return (
                <div key={i} className="group p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 transition-all duration-300">
                  <Icon size={22} className="text-teal-600 mb-4" />
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">{t.howLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{t.howH2}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {t.howSteps.map((s: any, i: number) => {
              const Icon = IconMap[s.icon] || Sparkles;
              return (
                <div key={i} className="text-center group">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white flex items-center justify-center mx-auto mb-5 group-hover:border-teal-200 group-hover:shadow-sm transition-all">
                    <Icon size={22} className="text-teal-600" />
                  </div>
                  <div className="text-[11px] font-semibold text-teal-600 tracking-widest mb-2">{s.num}</div>
                  <h3 className="text-[15px] font-semibold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">{t.pricingLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-3">{t.pricingH2}</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">{t.pricingDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            {t.plans.map((plan: any, i: number) => {
              const isPopular = plan.popular;
              return (
                <div key={i} className={`relative rounded-2xl p-7 flex flex-col border transition-all duration-300 hover:shadow-lg ${isPopular ? 'border-teal-200 bg-white shadow-md ring-1 ring-teal-100' : plan.price === null ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white'}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-[10px] font-semibold tracking-wide">{t.pricingMostPopular}</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mb-3">{plan.nameAr}</p>
                    {plan.price ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-semibold text-slate-900">{plan.price}</span>
                        <span className="text-sm text-slate-400">{t.pricingMo}</span>
                      </div>
                    ) : (
                      <div className="text-xl font-semibold text-teal-600">{t.pricingContactUs}</div>
                    )}
                  </div>
                  <div className="h-px bg-slate-100 mb-5" />
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.slice(0, 8).map((f: string, fi: number) => (
                      <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {plan.features.length > 8 && (
                      <li className="text-xs text-teal-600 font-medium">+{plan.features.length - 8} {isRtl ? 'مميزات إضافية' : 'more features'}</li>
                    )}
                  </ul>
                  <button onClick={() => plan.price ? navigate('/login') : navigate('/contact-us')} className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${isPopular ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    {plan.price ? (isPopular ? t.pricingCtaHighlight : t.pricingCtaDefault) : t.pricingContactUs}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <h3 className="text-xl font-semibold text-slate-900 text-center mb-8">{t.compareTitle}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
            <table className="w-full border-collapse min-w-[700px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className={`py-3.5 px-5 font-semibold text-slate-700 border-b border-slate-100 ${isRtl ? 'text-right' : 'text-left'}`}>{t.compareFeatureCol}</th>
                  {t.plans.map((p: any, i: number) => (
                    <th key={i} className={`py-3.5 px-4 text-center font-semibold border-b border-slate-100 ${p.popular ? 'text-teal-700 bg-teal-50/50' : 'text-slate-700'}`}>
                      <div>{p.name}</div>
                      <div className="text-xs font-normal text-slate-400 mt-0.5">{p.price ? `${p.price} ${t.pricingMo}` : t.pricingContactUs}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.compareRows.map((row: any, ri: number) => (
                  <tr key={ri} className={`border-b border-slate-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className={`py-3 px-5 font-medium text-slate-700 ${isRtl ? 'text-right' : 'text-left'}`}>{row.label}</td>
                    {row.vals.map((v: string, vi: number) => (
                      <td key={vi} className={`py-3 px-4 text-center ${t.plans[vi]?.popular ? 'bg-teal-50/30' : ''}`}><CellVal v={v} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">{t.faqLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">{t.faqH2}</h2>
          </div>
          <div className="space-y-3">
            {t.faqs.map((faq: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-start">
                  <span className="text-sm font-medium text-slate-800">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-4">{t.ctaSectionH2}</h2>
          <p className="text-base text-slate-500 mb-8 leading-relaxed">{t.ctaSectionDesc}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-8 py-3 rounded-lg text-sm transition-all shadow-sm inline-flex items-center gap-2">
              {t.ctaSectionBtn}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
            <Link to="/pricing" className="border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-8 py-3 rounded-lg text-sm transition-all">
              {isRtl ? 'اطلع على الباقات' : 'View Pricing'}
            </Link>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-teal-500" />{isRtl ? 'بدون تعقيد' : 'No Setup Fee'}</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-teal-500" />{isRtl ? 'دعم فني 24/7' : '24/7 Support'}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CONTACT ═══════════════════ */}
      <section id="contact" className="py-20 bg-[#FAFBFC]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-teal-600 tracking-widest uppercase mb-3">{t.contactLabel}</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mb-3">{t.contactH2}</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto">{t.contactDesc}</p>
          </div>
          <div className="max-w-xl mx-auto">
            {status === 'success' ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <CheckCircle2 size={40} className="text-teal-500 mx-auto mb-5" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{t.contactSuccessTitle}</h3>
                <p className="text-sm text-slate-500 mb-6">{t.contactSuccessDesc}</p>
                <button onClick={() => setStatus('idle')} className="border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium px-6 py-2 rounded-lg text-sm transition-all">{t.contactSuccessRetry}</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.contactFields.name}</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t.contactPlaceholders.name} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:border-teal-300 focus:ring-1 focus:ring-teal-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.contactFields.email}</label>
                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t.contactPlaceholders.email} dir="ltr" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:border-teal-300 focus:ring-1 focus:ring-teal-100 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.contactFields.phone}</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={t.contactPlaceholders.phone} dir="ltr" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:border-teal-300 focus:ring-1 focus:ring-teal-100 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.contactFields.company}</label>
                    <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder={t.contactPlaceholders.company} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:border-teal-300 focus:ring-1 focus:ring-teal-100 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{t.contactFields.message}</label>
                  <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={t.contactPlaceholders.message} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-slate-50/50 focus:border-teal-300 focus:ring-1 focus:ring-teal-100 outline-none transition-all resize-vertical font-[inherit]" />
                </div>
                {formError && <p className="text-red-500 text-sm">{formError}</p>}
                <button type="submit" disabled={status === 'loading'} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg text-sm transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> {t.contactSending}</> : <><Send size={16} /> {t.contactSubmit}</>}
                </button>
              </form>
            )}
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
                  <li key={i}><Link to={t.footerProductPaths[i]} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerSupport}</h4>
              <ul className="space-y-2.5">
                {t.footerSupportLinks.map((link: string, i: number) => (
                  <li key={i}><Link to={t.footerSupportPaths[i]} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200 mb-4">{t.footerLegal}</h4>
              <ul className="space-y-2.5">
                {t.footerLegalLinks.map((link: any, i: number) => (
                  <li key={i}><Link to={link.path} className="text-sm text-slate-400 hover:text-teal-400 transition-colors">{link.label}</Link></li>
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
