import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { seoService, type SeoScore, type SeoItem, type SeoSuggestion } from '@/services/seo';
import { competitorService, type CompetitorReport, type CompetitorInsight } from '@/services/competitor';
import { dashboardService } from '@/services/dashboard';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { TrendingUp, Target, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function Insights() {
  const { lang } = useLanguage();
  const { organization } = useAuth();
  const [seo, setSeo] = useState<SeoScore | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'seo' | 'competitors'>('seo');

  const loadData = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoading(true);
    try {
      const stats = await dashboardService.getStats(organization.id);

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
        <div className="flex gap-2">
          <button onClick={() => setTab('seo')} className={`btn btn-sm ${tab === 'seo' ? 'btn-primary' : 'btn-secondary'}`}>
            <Target size={13} /> {lang === 'ar' ? 'تحسين SEO' : 'SEO Score'}
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
