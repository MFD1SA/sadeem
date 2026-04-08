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
  const { lang, t } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — الرؤى' : 'SENDA | سيندا — Insights'; }, [lang]);
  const { organization } = useAuth();
  const [seo, setSeo] = useState<SeoScore | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorReport | null>(null);
  const [reviewInsights, setReviewInsights] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
      const complaintReviews = reviews.filter((r: DbReview) => r.sentiment === 'negative' || r.rating <= 2);
      const positiveTexts = positiveReviews.map((r: DbReview) => r.review_text || '').filter(Boolean);
      const complaintTexts = complaintReviews.map((r: DbReview) => r.review_text || '').filter(Boolean);

      const catDist = { positive: 0, complaint: 0, suggestion: 0, neutral: 0, sarcasm: 0 };
      const sentDist = { positive: 0, neutral: 0, negative: 0 };
      for (const r of reviews as DbReview[]) {
        const sent = (r.sentiment || 'neutral') as keyof typeof sentDist;
        if (sent in sentDist) sentDist[sent]++;
        // Derive category from sentiment + rating (category column doesn't exist in DB)
        const cat: keyof typeof catDist =
          sent === 'positive' ? 'positive' :
          sent === 'negative' ? 'complaint' : 'neutral';
        catDist[cat]++;
      }

      setReviewInsights({
        positiveKeywords: seoService.extractKeywords(positiveTexts, 8),
        complaintKeywords: seoService.extractKeywords(complaintTexts, 8),
        categoryDist: catDist,
        sentimentDist: sentDist,
        total: reviews.length,
      });
    } catch (err: unknown) {
      setLoadError((err as Error).message || t.insightsPage.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [organization, lang]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LoadingState />;

  if (loadError) {
    return (
      <div className="card">
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-content-primary mb-1">{t.insightsPage.errorTitle}</p>
          <p className="text-xs text-red-600 mb-4">{loadError}</p>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <FeatureGate feature="advancedAnalytics">
      <div className="space-y-4">
        {/* Page header */}
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-500" />
            {t.insightsPage.title}
          </h1>
          <p className="page-subtitle">{t.insightsPage.subtitle}</p>
        </div>

        {/* Tab switcher */}
        <div className="card card-body !py-2 !px-2">
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setTab('seo')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all focus:outline-2 focus:outline-brand-500 ${tab === 'seo' ? 'bg-brand-600 text-white shadow-sm' : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'}`}>
              <Target size={13} /> {t.insightsPage.seoTab}
            </button>
            <button onClick={() => setTab('reviews')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all focus:outline-2 focus:outline-brand-500 ${tab === 'reviews' ? 'bg-brand-600 text-white shadow-sm' : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'}`}>
              <MessageSquare size={13} /> {t.insightsPage.reviewInsightsTab}
            </button>
            <button onClick={() => setTab('competitors')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all focus:outline-2 focus:outline-brand-500 ${tab === 'competitors' ? 'bg-brand-600 text-white shadow-sm' : 'text-content-secondary hover:text-content-primary hover:bg-surface-secondary'}`}>
              <TrendingUp size={13} /> {t.insightsPage.competitorsTab}
            </button>
          </div>
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
                    {t.insightsPage.googleMapsSeoScore}
                  </div>
                  <div className="text-xs text-content-tertiary">
                    {seo.total >= 70
                      ? t.insightsPage.goodPerformance
                      : seo.total >= 40
                        ? t.insightsPage.needsImprovement
                        : t.insightsPage.poorPerformance}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3>{t.insightsPage.scoreBreakdown}</h3>
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
                  <h3>{t.insightsPage.improvementSuggestions}</h3>
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
                          {s.priority === 'high' ? t.insightsPage.important : s.priority === 'medium' ? t.insightsPage.mediumPriority : t.insightsPage.suggestion}
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
                message={t.insightsPage.notEnoughReviews}
                icon={<MessageSquare size={44} strokeWidth={1} className="text-gray-200" />}
              />
            ) : (
              <>
                {/* Sentiment Distribution */}
                <div className="card">
                  <div className="card-header">
                    <h3>{t.insightsPage.sentimentDistribution}</h3>
                    <span className="text-xs text-content-tertiary">{reviewInsights.total} {t.insightsPage.review}</span>
                  </div>
                  <div className="card-body space-y-3">
                    {([
                      { key: 'positive' as const, color: 'bg-emerald-500' },
                      { key: 'neutral' as const,  color: 'bg-amber-400'  },
                      { key: 'negative' as const, color: 'bg-red-400'    },
                    ]).map(({ key, color }) => {
                      const count = reviewInsights.sentimentDist[key];
                      const pct = reviewInsights.total > 0 ? Math.round((count / reviewInsights.total) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-content-primary font-medium">{(t.sentiment as Record<string, string>)[key] || key}</span>
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
                    <h3>{t.insightsPage.reviewCategories}</h3>
                  </div>
                  <div className="card-body grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {([
                      { key: 'positive' as const,   catKey: 'catPositive' as const,   variant: 'success' as const  },
                      { key: 'complaint' as const,  catKey: 'catComplaint' as const,  variant: 'danger' as const   },
                      { key: 'suggestion' as const, catKey: 'catSuggestion' as const, variant: 'info' as const     },
                      { key: 'neutral' as const,    catKey: 'catNeutral' as const,    variant: 'neutral' as const  },
                      { key: 'sarcasm' as const,    catKey: 'catSarcasm' as const,    variant: 'warning' as const  },
                    ]).map(({ key, catKey, variant }) => (
                      <div key={key} className="card card-body text-center py-3">
                        <div className="text-xl font-bold text-content-primary">{reviewInsights.categoryDist[key]}</div>
                        <Badge variant={variant} className="mt-1 text-[10px]">{t.insightsPage[catKey]}</Badge>
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
                        {t.insightsPage.topPositiveKeywords}
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
                        {t.insightsPage.topComplaintKeywords}
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
              <h3>{t.insightsPage.competitorAnalysis}</h3>
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
                        {insight.type === 'strength' ? t.insightsPage.strength
                          : insight.type === 'weakness' ? t.insightsPage.weakness
                          : t.insightsPage.opportunity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={t.insightsPage.competitorActivation}
                icon={<TrendingUp size={44} strokeWidth={1} className="text-gray-200" />}
              />
            )}
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
