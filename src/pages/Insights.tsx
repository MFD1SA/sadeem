import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { seoService, type SeoScore, type SeoItem, type SeoSuggestion } from '@/services/seo';
import { competitorService, type CompetitorReport, type CompetitorInsight } from '@/services/competitor';
import { dashboardService } from '@/services/dashboard';
import { reviewsService } from '@/services/reviews';
import type { DbReview } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { TrendingUp, Target, AlertTriangle, CheckCircle, ArrowUpRight, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ReviewInsights {
  positiveKeywords: Array<{ word: string; count: number }>;
  complaintKeywords: Array<{ word: string; count: number }>;
  categoryDist: { positive: number; complaint: number; suggestion: number; neutral: number; sarcasm: number };
  sentimentDist: { positive: number; neutral: number; negative: number };
  total: number;
}

export default function Insights() {
  const { lang } = useLanguage();
  const { organization } = useAuth();
  const [seo, setSeo] = useState<SeoScore | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorReport | null>(null);
  const [reviewInsights, setReviewInsights] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'seo' | 'reviews' | 'competitors'>('seo');

  const loadData = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoading(true);
    try {
      const [stats, reviews] = await Promise.all([
        dashboardService.getStats(organization.id),
        reviewsService.list(organization.id),
      ]);

      // SEO Score
      const seoResult = seoService.calculateScore({
        businessName: organization.name,
        description: '',
        industry: organization.industry || '',
        city: organization.city || '',
        photoCount: 0,
        reviewCount: stats.totalReviews,
        avgRating: stats.avgRating,
        responseRate: stats.responseRate,
        hasWebsite: false,
        hasPhone: true,
        hasHours: true,
        hasAddress: true,
      });
      setSeo(seoResult);

      // Competitors
      const comps = await competitorService.fetchCompetitors({
        industry: organization.industry || '',
        city: organization.city || '',
      });
      const report = competitorService.generateReport(stats.avgRating, stats.totalReviews, comps);
      setCompetitors(report);

      // Review Insights
      const positiveReviews = reviews.filter((r: DbReview) => r.sentiment === 'positive' || r.rating >= 4);
      const complaintReviews = reviews.filter((r: DbReview) => r.category === 'complaint' || r.sentiment === 'negative' || r.rating <= 2);
      const positiveTexts = positiveReviews.map((r: DbReview) => r.review_text || '').filter(Boolean);
      const complaintTexts = complaintReviews.map((r: DbReview) => r.review_text || '').filter(Boolean);

      const catDist = { positive: 0, complaint: 0, suggestion: 0, neutral: 0, sarcasm: 0 };
      const sentDist = { positive: 0, neutral: 0, negative: 0 };
      for (const r of reviews as DbReview[]) {
        const cat = r.category as keyof typeof catDist;
        if (cat in catDist) catDist[cat]++;
        const sent = (r.sentiment || 'neutral') as keyof typeof sentDist;
        if (sent in sentDist) sentDist[sent]++;
      }

      setReviewInsights({
        positiveKeywords: seoService.extractKeywords(positiveTexts, 8),
        complaintKeywords: seoService.extractKeywords(complaintTexts, 8),
        categoryDist: catDist,
        sentimentDist: sentDist,
        total: reviews.length,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;

  return (
    <FeatureGate feature="advancedAnalytics">
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTab('seo')} className={`btn btn-sm ${tab === 'seo' ? 'btn-primary' : 'btn-secondary'}`}>
            <Target size={13} /> {lang === 'ar' ? 'تحسين SEO' : 'SEO Score'}
          </button>
          <button onClick={() => setTab('reviews')} className={`btn btn-sm ${tab === 'reviews' ? 'btn-primary' : 'btn-secondary'}`}>
            <MessageSquare size={13} /> {lang === 'ar' ? 'مقتطفات التقييمات' : 'Review Insights'}
          </button>
          <button onClick={() => setTab('competitors')} className={`btn btn-sm ${tab === 'competitors' ? 'btn-primary' : 'btn-secondary'}`}>
            <TrendingUp size={13} /> {lang === 'ar' ? 'تحليل المنافسين' : 'Competitors'}
          </button>
        </div>

        {/* SEO Tab */}
        {tab === 'seo' && seo && (
          <div className="space-y-4">
            {/* Score circle */}
            <div className="card">
              <div className="card-body flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7ed" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none"
                      stroke={seo.total >= 70 ? '#12b886' : seo.total >= 40 ? '#f59f00' : '#e03131'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${seo.total * 2.64} 264`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-content-primary">{seo.total}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-content-primary mb-1">
                    {lang === 'ar' ? 'نقاط تحسين Google Maps' : 'Google Maps SEO Score'}
                  </div>
                  <div className="text-xs text-content-tertiary">
                    {seo.total >= 70
                      ? (lang === 'ar' ? 'أداء جيد — استمر في التحسين' : 'Good performance — keep improving')
                      : seo.total >= 40
                        ? (lang === 'ar' ? 'يحتاج تحسين — اتبع التوصيات أدناه' : 'Needs improvement — follow suggestions below')
                        : (lang === 'ar' ? 'أداء ضعيف — يتطلب إجراءات فورية' : 'Poor — immediate action required')}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3>{lang === 'ar' ? 'تفاصيل النقاط' : 'Score Breakdown'}</h3>
              </div>
              <div className="card-body space-y-3">
                {seo.breakdown.map((item: SeoItem) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-content-primary font-medium">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                      <span className="text-content-tertiary">{item.score}/{item.maxScore}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                      <div
                        className={`h-full rounded-full ${item.score >= item.maxScore * 0.7 ? 'bg-emerald-500' : item.score >= item.maxScore * 0.4 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {seo.suggestions.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3>{lang === 'ar' ? 'توصيات التحسين' : 'Improvement Suggestions'}</h3>
                </div>
                <div className="divide-y divide-border/60">
                  {seo.suggestions.map((s: SeoSuggestion, i: number) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        s.priority === 'high' ? 'bg-red-50' : s.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'
                      }`}>
                        {s.priority === 'high'
                          ? <AlertTriangle size={12} className="text-red-500" />
                          : <ArrowUpRight size={12} className={s.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'} />}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] text-content-primary">{lang === 'ar' ? s.textAr : s.textEn}</div>
                        <Badge variant={s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'info'} className="mt-1">
                          {s.priority === 'high' ? (lang === 'ar' ? 'مهم' : 'High') : s.priority === 'medium' ? (lang === 'ar' ? 'متوسط' : 'Medium') : (lang === 'ar' ? 'اقتراح' : 'Low')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Review Insights Tab */}
        {tab === 'reviews' && (
          <div className="space-y-4">
            {!reviewInsights || reviewInsights.total === 0 ? (
              <EmptyState
                message={lang === 'ar' ? 'لا توجد تقييمات كافية لاستخراج المقتطفات' : 'Not enough reviews to extract insights'}
                icon={<MessageSquare size={44} strokeWidth={1} className="text-gray-200" />}
              />
            ) : (
              <>
                {/* Sentiment Distribution */}
                <div className="card">
                  <div className="card-header">
                    <h3>{lang === 'ar' ? 'توزيع المشاعر' : 'Sentiment Distribution'}</h3>
                    <span className="text-xs text-content-tertiary">{reviewInsights.total} {lang === 'ar' ? 'تقييم' : 'reviews'}</span>
                  </div>
                  <div className="card-body space-y-3">
                    {([
                      { key: 'positive', labelAr: 'إيجابي', labelEn: 'Positive', color: 'bg-emerald-500' },
                      { key: 'neutral',  labelAr: 'محايد',   labelEn: 'Neutral',  color: 'bg-amber-400'  },
                      { key: 'negative', labelAr: 'سلبي',    labelEn: 'Negative', color: 'bg-red-400'    },
                    ] as const).map(({ key, labelAr, labelEn, color }) => {
                      const count = reviewInsights.sentimentDist[key];
                      const pct = reviewInsights.total > 0 ? Math.round((count / reviewInsights.total) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-content-primary font-medium">{lang === 'ar' ? labelAr : labelEn}</span>
                            <span className="text-content-tertiary">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="card">
                  <div className="card-header">
                    <h3>{lang === 'ar' ? 'تصنيف التقييمات' : 'Review Categories'}</h3>
                  </div>
                  <div className="card-body grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {([
                      { key: 'positive',   labelAr: 'إيجابي',   labelEn: 'Positive',    variant: 'success'  },
                      { key: 'complaint',  labelAr: 'شكوى',     labelEn: 'Complaint',   variant: 'danger'   },
                      { key: 'suggestion', labelAr: 'اقتراح',   labelEn: 'Suggestion',  variant: 'info'     },
                      { key: 'neutral',    labelAr: 'محايد',    labelEn: 'Neutral',     variant: 'default'  },
                      { key: 'sarcasm',    labelAr: 'سخرية',    labelEn: 'Sarcasm',     variant: 'warning'  },
                    ] as const).map(({ key, labelAr, labelEn, variant }) => (
                      <div key={key} className="card card-body text-center py-3">
                        <div className="text-xl font-bold text-content-primary">{reviewInsights.categoryDist[key]}</div>
                        <Badge variant={variant} className="mt-1 text-[10px]">{lang === 'ar' ? labelAr : labelEn}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Positive Keywords */}
                {reviewInsights.positiveKeywords.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="flex items-center gap-2">
                        <ThumbsUp size={14} className="text-emerald-500" />
                        {lang === 'ar' ? 'أبرز كلمات التقييمات الإيجابية' : 'Top Positive Keywords'}
                      </h3>
                    </div>
                    <div className="card-body flex flex-wrap gap-2">
                      {reviewInsights.positiveKeywords.map(({ word, count }) => (
                        <span key={word} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100">
                          {word}
                          <span className="bg-emerald-200 text-emerald-800 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complaint Keywords */}
                {reviewInsights.complaintKeywords.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h3 className="flex items-center gap-2">
                        <ThumbsDown size={14} className="text-red-500" />
                        {lang === 'ar' ? 'أبرز كلمات الشكاوى' : 'Top Complaint Keywords'}
                      </h3>
                    </div>
                    <div className="card-body flex flex-wrap gap-2">
                      {reviewInsights.complaintKeywords.map(({ word, count }) => (
                        <span key={word} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium border border-red-100">
                          {word}
                          <span className="bg-red-200 text-red-800 rounded-full px-1.5 py-0.5 text-[10px]">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {tab === 'competitors' && (
          <div className="card">
            <div className="card-header">
              <h3>{lang === 'ar' ? 'تحليل المنافسين' : 'Competitor Analysis'}</h3>
            </div>
            {competitors && competitors.competitors.length > 0 ? (
              <div className="card-body space-y-4">
                {competitors.insights.map((insight: CompetitorInsight, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      insight.type === 'strength' ? 'bg-emerald-50' : insight.type === 'weakness' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      {insight.type === 'strength'
                        ? <CheckCircle size={14} className="text-emerald-500" />
                        : insight.type === 'weakness'
                          ? <AlertTriangle size={14} className="text-red-500" />
                          : <TrendingUp size={14} className="text-blue-500" />}
                    </div>
                    <div>
                      <div className="text-[13px] text-content-primary">{lang === 'ar' ? insight.textAr : insight.textEn}</div>
                      <Badge variant={insight.type === 'strength' ? 'success' : insight.type === 'weakness' ? 'danger' : 'info'} className="mt-1">
                        {insight.type === 'strength' ? (lang === 'ar' ? 'نقطة قوة' : 'Strength')
                          : insight.type === 'weakness' ? (lang === 'ar' ? 'نقطة ضعف' : 'Weakness')
                          : (lang === 'ar' ? 'فرصة' : 'Opportunity')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={lang === 'ar'
                  ? 'سيتم تفعيل تحليل المنافسين بعد ربط Google Places API'
                  : 'Competitor analysis will activate after connecting Google Places API'}
                icon={<TrendingUp size={44} strokeWidth={1} className="text-gray-200" />}
              />
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
