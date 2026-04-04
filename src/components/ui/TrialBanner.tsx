import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { usePlan } from '@/hooks/usePlan';
import { Clock, Zap, ArrowUpRight, AlertTriangle } from 'lucide-react';

export function TrialBanner() {
  const { t } = useLanguage();
  const { trial, isLoading } = usePlan();
  const navigate = useNavigate();

  if (isLoading) return null;

  // Trial Expired Banner
  if (trial.isExpired) {
    return (
      <div className="rounded-xl px-5 py-4 border" style={{
        background: 'linear-gradient(135deg, #fef2f2 0%, #fffbeb 100%)',
        borderColor: 'rgba(239,68,68,0.15)',
      }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-content-primary mb-0.5">
                {t.trial.expiredTitle}
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                {t.trial.expiredDesc}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="btn btn-primary btn-sm flex-shrink-0"
          >
            <ArrowUpRight size={13} />
            {t.trial.upgradeSubscription}
          </button>
        </div>
      </div>
    );
  }

  // Active Trial Banner
  if (trial.isTrial && !trial.isExpired) {
    const aiPercent = trial.aiMax > 0 ? Math.min(100, (trial.aiUsed / trial.aiMax) * 100) : 0;
    const templatePercent = trial.templateMax > 0 ? Math.min(100, (trial.templateUsed / trial.templateMax) * 100) : 0;

    return (
      <div className="rounded-xl px-5 py-4 border" style={{
        background: 'linear-gradient(135deg, rgba(76,110,245,0.04) 0%, rgba(59,130,246,0.04) 100%)',
        borderColor: 'rgba(76,110,245,0.12)',
      }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Clock size={17} className="text-brand-600" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-content-primary">
                {`${t.trial.trialCountdownPrefix} — ${trial.hoursRemaining} ${t.trial.hourSuffix}`}
              </div>
              <div className="flex items-center gap-4 mt-1.5">
                <div className="flex items-center gap-2">
                  <Zap size={11} className="text-brand-400" />
                  <span className="text-[11px] text-content-tertiary font-medium">
                    {`${t.trial.aiLabel}: ${trial.aiUsed}/${trial.aiMax}`}
                  </span>
                  <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-400 transition-all" style={{ width: `${aiPercent}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-content-tertiary font-medium">
                    {`${t.trial.templatesLabel}: ${trial.templateUsed}/${trial.templateMax}`}
                  </span>
                  <div className="w-16 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-violet-400 transition-all" style={{ width: `${templatePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="btn btn-secondary btn-sm flex-shrink-0"
          >
            {t.trial.viewPlans}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
