// ============================================================================
// SENDA — Blog Article Page
// ============================================================================
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';
import { BLOG_ARTICLES } from '@/data/blogArticles';

type Lang = 'ar' | 'en';

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const isRtl = lang === 'ar';

  const article = BLOG_ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = lang === 'ar'
        ? `سيندا | SENDA — ${article.title.ar}`
        : `SENDA | سيندا — ${article.title.en}`;
    }
  }, [lang, article]);

  if (!article) return <Navigate to="/blog" replace />;

  const t = {
    backToBlog: lang === 'ar' ? 'العودة للمدونة' : 'Back to Blog',
    minRead: lang === 'ar' ? 'دقائق قراءة' : 'min read',
    relatedTitle: lang === 'ar' ? 'مقالات ذات صلة' : 'Related Articles',
    readMore: lang === 'ar' ? 'اقرأ المزيد' : 'Read more',
    ctaTitle: lang === 'ar' ? 'جاهز لتحسين سمعتك الرقمية؟' : 'Ready to improve your digital reputation?',
    ctaDesc: lang === 'ar' ? 'ابدأ تجربتك المجانية واكتشف قوة سيندا' : 'Start your free trial and discover the power of SENDA',
    ctaBtn: lang === 'ar' ? 'ابدأ تجربتك المجانية' : 'Start Your Free Trial',
  };

  const content = lang === 'ar' ? article.content.ar : article.content.en;
  const related = BLOG_ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => { const next = l === 'ar' ? 'en' : 'ar'; saveLang(next); return next; })}>
      {/* Hero */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-16 md:pb-24" style={{ background: article.gradient }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-3xl mx-auto px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-blue-300/80 hover:text-blue-200 transition-colors mb-8">
            {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {t.backToBlog}
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-5">
            <span className="bg-blue-400/15 text-blue-300 px-3 py-1 rounded-full font-medium">{lang === 'ar' ? article.category.ar : article.category.en}</span>
            <span>{article.date}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {article.mins} {t.minRead}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">{lang === 'ar' ? article.title.ar : article.title.en}</h1>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="prose-senda space-y-5">
            {content.map((block, i) => {
              if (block.startsWith('## ')) {
                return <h2 key={i} className="text-xl md:text-2xl font-bold text-slate-900 mt-10 mb-4 leading-tight">{block.replace('## ', '')}</h2>;
              }
              return <p key={i} className="text-[15px] text-slate-600 leading-[1.9] mb-1">{block}</p>;
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative text-center px-8 py-14 md:py-18">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">{t.ctaTitle}</h2>
            <p className="text-sm text-slate-400 mb-7">{t.ctaDesc}</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20">
              {t.ctaBtn}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
          <h3 className="text-xl font-bold text-slate-900 mb-8 text-center">{t.relatedTitle}</h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((rel) => (
              <Link key={rel.slug} to={`/blog/${rel.slug}`} className="group rounded-xl border border-slate-100 bg-white hover:shadow-md hover:border-slate-200 overflow-hidden transition-all">
                <div className="h-28 relative overflow-hidden" style={{ background: rel.gradient }}>
                  <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  <div className="relative h-full flex items-center justify-center">
                    <span className="text-2xl">{rel.icon}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">{lang === 'ar' ? rel.title.ar : rel.title.en}</h4>
                  <span className="text-xs font-medium text-blue-800">{t.readMore} &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
