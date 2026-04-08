// ============================================================================
// SENDA — Blog Page (المدونة) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'المدونة',
    heroH1: 'أحدث المقالات والنصائح',
    heroSub: 'مقالات متخصصة في إدارة السمعة الرقمية والتقييمات والذكاء الاصطناعي',
    heroBtn: 'ابدأ تجربتك المجانية',
    readMore: 'اقرأ المزيد',
    minRead: 'دقائق قراءة',
    articles: [
      { title: 'كيف تحوّل التقييمات السلبية إلى فرص للنمو', excerpt: 'تعلّم استراتيجيات فعّالة للتعامل مع التقييمات السلبية وتحويلها إلى أداة لتحسين خدماتك وبناء ثقة أقوى مع عملائك.', category: 'إدارة السمعة', mins: 5, date: '2025-03-15' },
      { title: 'دليل شامل لاستخدام الذكاء الاصطناعي في الرد على التقييمات', excerpt: 'اكتشف كيف يمكن للذكاء الاصطناعي مساعدتك في صياغة ردود احترافية ومخصصة لكل تقييم بسرعة وكفاءة.', category: 'ذكاء اصطناعي', mins: 7, date: '2025-03-10' },
      { title: '10 نصائح لتحسين تقييماتك على Google Business', excerpt: 'نصائح عملية ومجرّبة لرفع متوسط تقييماتك وزيادة عدد المراجعات الإيجابية لنشاطك التجاري.', category: 'نصائح', mins: 4, date: '2025-03-05' },
      { title: 'أهمية إدارة الفروع المركزية في تحسين تجربة العملاء', excerpt: 'كيف يمكن لإدارة فروعك من مكان واحد أن تعزز اتساق جودة الخدمة وتحسّن رضا العملاء في جميع المواقع.', category: 'إدارة الفروع', mins: 6, date: '2025-02-28' },
      { title: 'تحليلات التقييمات: كيف تقرأ البيانات وتتخذ قرارات أذكى', excerpt: 'فهم مؤشرات الأداء الرئيسية في تقييماتك واستخدام البيانات لاتخاذ قرارات استراتيجية تدفع نمو أعمالك.', category: 'تحليلات', mins: 8, date: '2025-02-20' },
      { title: 'حلول رموز QR: حوّل كل تفاعل إلى تقييم إيجابي', excerpt: 'تعرّف على كيفية استخدام رموز QR الذكية لتشجيع عملائك على ترك تقييمات إيجابية بطريقة سلسة ومبتكرة.', category: 'حلول QR', mins: 3, date: '2025-02-15' },
    ],
    comingSoon: 'المقالات الكاملة قادمة قريبًا',
  },
  en: {
    heroTag: 'Blog',
    heroH1: 'Latest Articles & Tips',
    heroSub: 'Expert articles on digital reputation management, reviews, and AI',
    heroBtn: 'Start Your Free Trial',
    readMore: 'Read more',
    minRead: 'min read',
    articles: [
      { title: 'How to Turn Negative Reviews into Growth Opportunities', excerpt: 'Learn effective strategies for handling negative reviews and turning them into a tool for improving your services and building stronger customer trust.', category: 'Reputation', mins: 5, date: '2025-03-15' },
      { title: 'Complete Guide to Using AI for Review Responses', excerpt: 'Discover how AI can help you craft professional, personalized responses to every review quickly and efficiently.', category: 'AI', mins: 7, date: '2025-03-10' },
      { title: '10 Tips to Improve Your Google Business Ratings', excerpt: 'Practical, proven tips to raise your average rating and increase the number of positive reviews for your business.', category: 'Tips', mins: 4, date: '2025-03-05' },
      { title: 'Why Centralized Branch Management Matters for CX', excerpt: 'How managing all branches from one place can enhance service quality consistency and improve customer satisfaction across all locations.', category: 'Branches', mins: 6, date: '2025-02-28' },
      { title: 'Review Analytics: Read the Data, Make Smarter Decisions', excerpt: 'Understand key performance indicators in your reviews and use data to make strategic decisions that drive business growth.', category: 'Analytics', mins: 8, date: '2025-02-20' },
      { title: 'QR Solutions: Turn Every Interaction into a Positive Review', excerpt: 'Learn how to use smart QR codes to encourage your customers to leave positive reviews in a seamless and innovative way.', category: 'QR', mins: 3, date: '2025-02-15' },
    ],
    comingSoon: 'Full articles coming soon',
  },
};

export default function BlogPage() {
  const [lang, setLang] = useState<Lang>('ar');
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — المدونة' : 'SENDA | سيندا — Blog'; }, [lang]);

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

      {/* ═══════════ ARTICLES GRID ═══════════ */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.articles.map((article: any, i: number) => (
            <article key={i} className="group rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:border-slate-200 overflow-hidden transition-all">
              <div className="h-44 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1a2d45 50%, #162032 100%)' }}>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="relative h-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-300 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">{article.category}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {article.mins} {t.minRead}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{article.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{article.excerpt}</p>
                <span className="text-sm font-semibold text-[#0F1A2E] cursor-default">{t.readMore} &rarr;</span>
              </div>
            </article>
          ))}
        </div>
        <p className="text-center text-sm text-slate-400 mt-12">{t.comingSoon}</p>
      </section>
    </PublicLayout>
  );
}
