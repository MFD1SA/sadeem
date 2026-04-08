// ============================================================================
// SENDA — Features Page (المميزات) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield,
  ArrowLeft, ArrowRight,
} from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const ICONS: Record<string, any> = { Brain, QrCode, BarChart3, Building2, Users, FileText, MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield };

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'المميزات',
    heroH1: 'كل ما تحتاجه لإدارة سمعتك الرقمية',
    heroSub: 'مجموعة متكاملة من الأدوات الذكية المصممة لتبسيط إدارة التقييمات وتعزيز حضورك الرقمي',
    heroBtn: 'ابدأ تجربتك المجانية',
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
    ctaTitle: 'جاهز لتجربة جميع المميزات؟',
    ctaDesc: 'ابدأ فترتك التجريبية المجانية الآن بدون بطاقة ائتمان',
    ctaBtn: 'ابدأ مجانًا',
    ctaSecondary: 'اطلع على الباقات',
  },
  en: {
    heroTag: 'Features',
    heroH1: 'Everything You Need to Manage Your Reputation',
    heroSub: 'A comprehensive suite of smart tools designed to simplify review management and enhance your digital presence',
    heroBtn: 'Start Your Free Trial',
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
    ctaTitle: 'Ready to try all features?',
    ctaDesc: 'Start your free trial now — no credit card required',
    ctaBtn: 'Start Free',
    ctaSecondary: 'View Plans',
  },
};

export default function FeaturesPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — المميزات' : 'SENDA | سيندا — Features'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden py-28 md:py-36" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-semibold text-blue-300/80 bg-white/5 backdrop-blur-sm border border-white/10 px-5 py-2 rounded-full mb-6 tracking-wide">{t.heroTag}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">{t.heroH1}</h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">{t.heroSub}</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
            {t.heroBtn}
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </section>

      {/* ═══════════ FEATURES GRID ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.map((f: any, i: number) => {
            const Icon = ICONS[f.icon] || Star;
            return (
              <div key={i} className="group p-7 rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:border-slate-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#0F1A2E] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Icon size={22} className="text-blue-300" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
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
              <Link to="/pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t.ctaSecondary}</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
