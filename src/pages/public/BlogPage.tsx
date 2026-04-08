// ============================================================================
// SENDA — Blog Page (المدونة)
// ============================================================================
import { useState } from 'react';
import { Clock } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'المدونة',
    heroH1: 'أحدث المقالات والنصائح',
    heroSub: 'مقالات متخصصة في إدارة السمعة الرقمية والتقييمات والذكاء الاصطناعي',
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

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}>
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">{t.heroTag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">{t.heroH1}</h1>
          <p className="text-base text-slate-500 leading-relaxed">{t.heroSub}</p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-[1200px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.articles.map((article: any, i: number) => (
            <article key={i} className="group rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 overflow-hidden transition-all">
              <div className="h-40 bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-100">{article.category}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {article.mins} {t.minRead}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{article.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{article.excerpt}</p>
                <span className="text-sm font-medium text-blue-600 cursor-default">{t.readMore}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="text-center text-sm text-slate-400 mt-10">{t.comingSoon}</p>
      </section>
    </PublicLayout>
  );
}
