// ============================================================================
// SENDA — Features Page (المميزات)
// Light theme · Teal accent · Premium · Elegant
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield,
} from 'lucide-react';

type Lang = 'ar' | 'en';

const ICONS: Record<string, any> = { Brain, QrCode, BarChart3, Building2, Users, FileText, MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield };

const T: Record<Lang, Record<string, any>> = {
  ar: {
    dir: 'rtl',
    langToggle: 'EN',
    nav: ['من نحن', 'المميزات', 'الباقات', 'الأسئلة الشائعة', 'المدونة', 'تواصل معنا'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'دخول',
    heroTag: 'المميزات',
    heroH1: 'كل ما تحتاجه لإدارة سمعتك الرقمية',
    heroSub: 'مجموعة متكاملة من الأدوات الذكية المصممة لتبسيط إدارة التقييمات وتعزيز حضورك الرقمي',
    features: [
      { title: 'إدارة التقييمات', desc: 'لوحة تحكم مركزية لعرض وتتبع جميع تقييمات Google Business في مكان واحد مع إمكانية الفلترة حسب النجوم والتاريخ والفرع والحالة.', icon: 'Star' },
      { title: 'الردود الذكية بالذكاء الاصطناعي', desc: 'محرك ذكاء اصطناعي متقدم يحلل نص التقييم ويصيغ ردودًا احترافية تتناسب مع محتوى التقييم ونبرة علامتك التجارية تلقائيًا.', icon: 'Brain' },
      { title: 'الرد اليدوي المرن', desc: 'تحكم كامل في صياغة ردودك بأسلوبك الخاص على كل تقييم مع إمكانية التعديل والمراجعة قبل النشر.', icon: 'MessageSquare' },
      { title: 'قوالب الردود الجاهزة', desc: 'مكتبة غنية من القوالب المصنفة حسب نوع التقييم يمكنك تخصيصها وإعادة استخدامها لتوفير الوقت.', icon: 'FileText' },
      { title: 'التحليلات المتقدمة', desc: 'رؤى تفصيلية عن أداء سمعتك الرقمية مع رسوم بيانية تفاعلية واتجاهات التقييمات وتحليل المشاعر.', icon: 'BarChart3' },
      { title: 'إدارة الفروع', desc: 'إدارة مركزية لجميع فروعك ومواقعك مع إمكانية المقارنة بين أداء الفروع وتتبع كل فرع على حدة.', icon: 'Building2' },
      { title: 'الإشعارات الفورية', desc: 'تنبيهات لحظية بكل تقييم جديد عبر المنصة والبريد الإلكتروني حتى لا تفوتك أي فرصة للتفاعل.', icon: 'BellRing' },
      { title: 'إدارة المهام', desc: 'نظام متكامل لتوزيع المهام على أعضاء الفريق ومتابعة حالة كل مهمة بتنظيم واحترافية.', icon: 'ListChecks' },
      { title: 'الفوترة والاشتراكات', desc: 'إدارة شفافة ومرنة للاشتراكات والمدفوعات مع دعم كامل لضريبة القيمة المضافة والفواتير الإلكترونية.', icon: 'CreditCard' },
      { title: 'إدارة الفريق', desc: 'أدوات تعاون فعالة مع صلاحيات مخصصة لكل عضو في الفريق وسجل كامل للأنشطة.', icon: 'Users' },
      { title: 'حلول QR الذكية', desc: 'أنشئ رموز QR مخصصة لكل فرع لتحويل كل تفاعل مع عميل إلى تقييم إيجابي على Google.', icon: 'QrCode' },
      { title: 'الأمان والخصوصية', desc: 'حماية متقدمة لبياناتك مع تشفير كامل ونظام صلاحيات دقيق يضمن أمان معلوماتك.', icon: 'Shield' },
    ],
    ctaTitle: 'جرّب جميع المميزات مجانًا',
    ctaDesc: 'ابدأ فترتك التجريبية المجانية الآن بدون بطاقة ائتمان',
    ctaBtn: 'ابدأ مجانًا',
    footer: '© 2025 سيندا — جميع الحقوق محفوظة',
  },
  en: {
    dir: 'ltr',
    langToggle: 'ع',
    nav: ['About', 'Features', 'Pricing', 'FAQ', 'Blog', 'Contact'],
    navPaths: ['/about', '/features', '/pricing', '/faq', '/blog', '/contact-us'],
    loginBtn: 'Login',
    heroTag: 'Features',
    heroH1: 'Everything You Need to Manage Your Reputation',
    heroSub: 'A comprehensive suite of smart tools designed to simplify review management and enhance your digital presence',
    features: [
      { title: 'Review Management', desc: 'A centralized dashboard to view and track all Google Business reviews with filtering by stars, date, branch, and status.', icon: 'Star' },
      { title: 'AI-Powered Smart Replies', desc: 'An advanced AI engine that analyzes review text and crafts professional responses matching your brand tone automatically.', icon: 'Brain' },
      { title: 'Flexible Manual Replies', desc: 'Full control over crafting your replies in your own style for each review with editing and review before publishing.', icon: 'MessageSquare' },
      { title: 'Ready-Made Templates', desc: 'A rich library of templates categorized by review type that you can customize and reuse to save time.', icon: 'FileText' },
      { title: 'Advanced Analytics', desc: 'Detailed insights into your reputation performance with interactive charts, review trends, and sentiment analysis.', icon: 'BarChart3' },
      { title: 'Branch Management', desc: 'Centralized management for all branches with performance comparison and individual tracking capabilities.', icon: 'Building2' },
      { title: 'Instant Notifications', desc: 'Real-time alerts for every new review via the platform and email so you never miss an engagement opportunity.', icon: 'BellRing' },
      { title: 'Task Management', desc: 'An integrated system for assigning tasks to team members and tracking each task\'s progress professionally.', icon: 'ListChecks' },
      { title: 'Billing & Subscriptions', desc: 'Transparent and flexible subscription management with full VAT support and electronic invoicing.', icon: 'CreditCard' },
      { title: 'Team Management', desc: 'Effective collaboration tools with custom permissions for each team member and full activity logging.', icon: 'Users' },
      { title: 'Smart QR Solutions', desc: 'Create custom QR codes for each branch to turn every customer interaction into a positive Google review.', icon: 'QrCode' },
      { title: 'Security & Privacy', desc: 'Advanced data protection with full encryption and granular permission system ensuring your information is safe.', icon: 'Shield' },
    ],
    ctaTitle: 'Try All Features for Free',
    ctaDesc: 'Start your free trial now — no credit card required',
    ctaBtn: 'Start Free',
    footer: '© 2025 SENDA — All rights reserved',
  },
};

export default function FeaturesPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];

  return (
    <div dir={t.dir} className="min-h-screen bg-white text-slate-800 font-[IBM_Plex_Sans_Arabic,sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2"><img src="/senda-logo.png" alt="SENDA" className="h-8" /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {t.nav.map((label: string, i: number) => (
              <Link key={i} to={t.navPaths[i]} className="hover:text-teal-600 transition-colors">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-500 hover:text-teal-600">{t.langToggle}</button>
            <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700">{t.loginBtn}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full mb-4">{t.heroTag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">{t.heroH1}</h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto">{t.heroSub}</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.map((f: any, i: number) => {
            const Icon = ICONS[f.icon] || Star;
            return (
              <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-sm transition-all">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <Icon size={20} className="text-teal-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.ctaTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.ctaDesc}</p>
          <Link to="/register" className="inline-block bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors">
            {t.ctaBtn}
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">{t.footer}</footer>
    </div>
  );
}
