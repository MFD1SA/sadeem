// ============================================================================
// SENDA — Blog Page (المدونة) — Premium Design
// ============================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicLayout from '@/layouts/PublicLayout';
import { getSavedLang, saveLang } from '@/lib/lang';
import { BLOG_ARTICLES } from '@/data/blogArticles';

type Lang = 'ar' | 'en';

const T: Record<Lang, Record<string, any>> = {
  ar: {
    heroTag: 'المدونة',
    heroH1: 'أحدث المقالات والنصائح',
    heroSub: 'محتوى متخصص يواكب أفضل الممارسات في السمعة الرقمية وتجربة العملاء والحلول الذكية الحديثة',
    heroBtn: 'ابدأ تجربتك المجانية',
    readMore: 'اقرأ المزيد',
    minRead: 'دقائق قراءة',
  },
  en: {
    heroTag: 'Blog',
    heroH1: 'Latest Articles & Tips',
    heroSub: 'Expert content on digital reputation best practices, customer experience, and modern smart solutions',
    heroBtn: 'Start Your Free Trial',
    readMore: 'Read more',
    minRead: 'min read',
  },
};

export default function BlogPage() {
  const [lang, setLang] = useState<Lang>(getSavedLang);
  const t = T[lang];
  const isRtl = lang === 'ar';

  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — المدونة' : 'SENDA | سيندا — Blog'; }, [lang]);

  return (
    <PublicLayout lang={lang} onToggleLang={() => setLang(l => { const next = l === 'ar' ? 'en' : 'ar'; saveLang(next); return next; })}>
      {/* ═══════════ DARK HERO ═══════════ */}
      <section className="relative overflow-hidden pt-36 md:pt-44 pb-20 md:pb-28" style={{ background: 'linear-gradient(160deg, #0B1120 0%, #162032 40%, #0F1A2E 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <svg className="absolute top-[15%] right-[8%] w-20 h-20 text-blue-400/10 animate-pulse" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" /></svg>
        <svg className="absolute bottom-[20%] left-[6%] w-14 h-14 text-blue-400/10" viewBox="0 0 56 56" fill="none"><rect x="8" y="8" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" /></svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
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
          {BLOG_ARTICLES.map((article) => (
            <Link key={article.slug} to={`/blog/${article.slug}`} className="group rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:border-slate-200 overflow-hidden transition-all">
              <div className="h-44 relative overflow-hidden" style={{ background: article.gradient }}>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                <div className="relative h-full flex flex-col items-center justify-center gap-3">
                  <span className="text-3xl">{article.icon}</span>
                  <span className="text-xs font-semibold text-blue-300 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">{lang === 'ar' ? article.category.ar : article.category.en}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {article.mins} {t.minRead}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-900 transition-colors">{lang === 'ar' ? article.title.ar : article.title.en}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">{lang === 'ar' ? article.excerpt.ar : article.excerpt.en}</p>
                <span className="text-sm font-semibold text-blue-800 group-hover:text-blue-600 transition-colors">{t.readMore} &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
