// ============================================================================
// SENDA — Features Page (المميزات)
// ============================================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, QrCode, BarChart3, Building2, Users, FileText,
  MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield,
} from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const ICONS: Record<string, any> = { Brain, QrCode, BarChart3, Building2, Users, FileText, MessageSquare, BellRing, ListChecks, CreditCard, Star, Shield };

const T: Record<Lang, Record<string, any>> = {
  ar: {
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
  },
  en: {
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
  },
};

export default function FeaturesPage() {
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

      {/* Features Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.features.map((f: any, i: number) => {
            const Icon = ICONS[f.icon] || Star;
            return (
              <div key={i} className="group p-6 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 transition-all">
                <Icon size={22} className="text-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.ctaTitle}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.ctaDesc}</p>
          <Link to="/register" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            {t.ctaBtn}
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
