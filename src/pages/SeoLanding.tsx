// ============================================================================
// SENDA — Public SEO Landing Page
// Route: /s/:city/:industry
// Purpose: Indexable by Google for searches like "إدارة تقييمات جوجل في الرياض"
// No authentication required.
// ============================================================================

import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle, ArrowLeft, BarChart2, MessageSquare, QrCode, Shield } from 'lucide-react';

// City display names
const CITIES: Record<string, { ar: string; en: string }> = {
  riyadh:   { ar: 'الرياض',   en: 'Riyadh' },
  jeddah:   { ar: 'جدة',      en: 'Jeddah' },
  makkah:   { ar: 'مكة المكرمة', en: 'Makkah' },
  madinah:  { ar: 'المدينة المنورة', en: 'Madinah' },
  dammam:   { ar: 'الدمام',   en: 'Dammam' },
  khobar:   { ar: 'الخبر',    en: 'Al Khobar' },
  taif:     { ar: 'الطائف',   en: 'Taif' },
  abha:     { ar: 'أبها',     en: 'Abha' },
  tabuk:    { ar: 'تبوك',     en: 'Tabuk' },
};

// Industry display names
const INDUSTRIES: Record<string, { ar: string; en: string }> = {
  restaurants:   { ar: 'المطاعم',           en: 'Restaurants' },
  cafes:         { ar: 'المقاهي',           en: 'Cafes' },
  hotels:        { ar: 'الفنادق',           en: 'Hotels' },
  clinics:       { ar: 'العيادات',          en: 'Clinics' },
  salons:        { ar: 'صالونات التجميل',   en: 'Salons' },
  gyms:          { ar: 'الصالات الرياضية',  en: 'Gyms' },
  retail:        { ar: 'متاجر التجزئة',     en: 'Retail Stores' },
  automotive:    { ar: 'السيارات والخدمات', en: 'Automotive Services' },
  realestate:    { ar: 'العقارات',          en: 'Real Estate' },
  education:     { ar: 'التعليم',           en: 'Education' },
};

const FEATURES = [
  { icon: Star,         titleAr: 'ردود AI على التقييمات',     titleEn: 'AI Review Replies',      descAr: 'رد تلقائي على تقييمات Google باستخدام الذكاء الاصطناعي بالمودة المناسبة.',                 descEn: 'Auto-reply to Google reviews using AI in the right tone.' },
  { icon: BarChart2,    titleAr: 'تحليلات متقدمة',            titleEn: 'Advanced Analytics',     descAr: 'تتبع نسبة الرد، متوسط التقييم، والمشاعر عبر جميع فروعك.',                                 descEn: 'Track reply rate, average rating, and sentiment across branches.' },
  { icon: QrCode,       titleAr: 'نظام QR للتقييمات',         titleEn: 'QR Review System',       descAr: 'احصل على تقييمات أكثر بقدر 3× باستخدام رموز QR الذكية الموجهة للعملاء السعداء.',           descEn: 'Get 3× more reviews with smart QR codes targeting happy customers.' },
  { icon: MessageSquare,titleAr: 'إدارة الشكاوى',             titleEn: 'Complaint Management',   descAr: 'تنبيهات فورية للمراجعات الحرجة مع تصعيد تلقائي للفريق.',                                   descEn: 'Instant alerts for critical reviews with automatic team escalation.' },
  { icon: Shield,       titleAr: 'حماية السمعة',              titleEn: 'Reputation Protection',  descAr: 'اكتشاف التقييمات التزويرية والمسيئة وتصفيتها قبل وصولها للجمهور.',                         descEn: 'Detect and filter fake or abusive reviews before they reach the public.' },
  { icon: CheckCircle,  titleAr: 'إدارة متعددة الفروع',       titleEn: 'Multi-branch Management',descAr: 'لوحة تحكم موحدة لإدارة جميع الفروع والمناطق من مكان واحد.',                                descEn: 'Unified dashboard to manage all branches and regions from one place.' },
];

export default function SeoLanding() {
  const { city, industry } = useParams<{ city: string; industry: string }>();

  const cityInfo  = city     ? (CITIES[city]     || { ar: city,     en: city     }) : null;
  const indInfo   = industry ? (INDUSTRIES[industry] || { ar: industry, en: industry }) : null;

  const titleAr = cityInfo && indInfo
    ? `إدارة تقييمات Google لـ${indInfo.ar} في ${cityInfo.ar} — SENDA`
    : 'إدارة تقييمات Google بالذكاء الاصطناعي — SENDA';
  const titleEn = cityInfo && indInfo
    ? `Google Review Management for ${indInfo.en} in ${cityInfo.en} — SENDA`
    : 'AI-Powered Google Review Management — SENDA';

  const descAr = cityInfo && indInfo
    ? `SENDA يساعد ${indInfo.ar} في ${cityInfo.ar} على الرد تلقائياً على تقييمات Google وتحسين تقييمهم بالذكاء الاصطناعي. جرّب مجاناً.`
    : 'SENDA لإدارة وتحسين تقييمات Google بالذكاء الاصطناعي. ردود تلقائية، تحليلات، وحماية للسمعة.';

  useEffect(() => {
    document.title = titleAr;
    // Update meta description
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = descAr;
    // og:title
    let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
    ogTitle.content = titleAr;

    return () => { document.title = 'SENDA'; };
  }, [titleAr, descAr]);

  return (
    <div className="min-h-screen bg-white" dir="rtl" lang="ar">
      {/* Header */}
      <header className="bg-gradient-to-bl from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">SENDA</span>
          <Link to="/login" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            تسجيل الدخول <ArrowLeft size={14} />
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          {cityInfo && indInfo && (
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs px-3 py-1.5 rounded-full mb-4">
              <Star size={12} fill="currentColor" />
              {indInfo.ar} · {cityInfo.ar}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-snug mb-4">
            {cityInfo && indInfo
              ? <>إدارة تقييمات Google لـ<span className="text-blue-300">{indInfo.ar}</span>{' '}في <span className="text-blue-300">{cityInfo.ar}</span></>
              : 'إدارة تقييمات Google بالذكاء الاصطناعي'}
          </h1>
          <p className="text-white/75 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            {cityInfo && indInfo
              ? `SENDA يساعد ${indInfo.ar} في ${cityInfo.ar} على الرد تلقائياً على تقييمات Google، تحسين التقييم، وحماية السمعة — كل ذلك بالذكاء الاصطناعي.`
              : 'رد تلقائي، تحليلات متقدمة، وحماية سمعة كاملة — لمئات الأنشطة التجارية في المملكة العربية السعودية.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
            >
              ابدأ تجربة مجانية
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              اكتشف المزايا
            </a>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '+500', labelAr: 'نشاط تجاري' },
            { value: '98%',  labelAr: 'نسبة الرد' },
            { value: '4.8★', labelAr: 'متوسط التقييم' },
          ].map(({ value, labelAr }) => (
            <div key={labelAr}>
              <div className="text-2xl font-bold text-blue-900">{value}</div>
              <div className="text-xs text-blue-600 mt-0.5">{labelAr}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {cityInfo && indInfo
            ? `لماذا يختار ${indInfo.ar} في ${cityInfo.ar} SENDA؟`
            : 'لماذا تختار SENDA؟'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10 max-w-xl mx-auto">
          حل متكامل لإدارة السمعة الرقمية وتحسين تقييمات Google Maps بالذكاء الاصطناعي
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, titleAr, descAr }) => (
            <div key={titleAr} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{titleAr}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{descAr}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-bl from-blue-900 to-indigo-900 text-white py-14">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">
            {cityInfo && indInfo
              ? `ابدأ الآن وحسّن تقييم ${indInfo.ar}ك في ${cityInfo.ar}`
              : 'ابدأ تجربتك المجانية الآن'}
          </h2>
          <p className="text-white/70 text-sm mb-6">
            تجربة مجانية لمدة 14 يوم — لا تحتاج بطاقة ائتمانية
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            ابدأ مجاناً <ArrowLeft size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} SENDA — نظام إدارة التقييمات بالذكاء الاصطناعي للمملكة العربية السعودية</p>
        {cityInfo && indInfo && (
          <p className="mt-1">
            خدماتنا متاحة لـ{indInfo.ar} في {cityInfo.ar} وجميع أنحاء المملكة العربية السعودية
          </p>
        )}
      </footer>
    </div>
  );
}
