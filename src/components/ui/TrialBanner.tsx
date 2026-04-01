import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { usePlan } from '@/hooks/usePlan';
import { Clock, Zap, ArrowUpRight, AlertTriangle } from 'lucide-react';

export function TrialBanner() {
  const { lang } = useLanguage();
  const { trial, isLoading } = usePlan();
  const navigate = useNavigate();

  if (isLoading) return null;

  // ─── Trial Expired Banner ───
  if (trial.isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200/60 rounded-xl px-5 py-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={17} className="text-red-600" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-content-primary mb-0.5">
                {lang === 'ar'
                  ? 'انتهت الفترة التجريبية لسديم'
                  : 'Your Sadeem trial has expired'}
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                {lang === 'ar'
                  ? 'قم بالترقية للاستمرار في الرد على تقييمات Google باستخدام الذكاء الاصطناعي.'
                  : 'Upgrade to continue responding to Google reviews with AI.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="btn btn-primary btn-sm flex-shrink-0"
          >
            <ArrowUpRight size={13} />
            {lang === 'ar' ? 'ترقية الاشتراك' : 'Upgrade'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Active Trial Banner ───
  if (trial.isTrial && !trial.isExpired) {
    return (
      <div className="bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-200/40 rounded-xl px-5 py-3.5 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-brand-600" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-content-primary">
                {lang === 'ar'
                  ? `الفترة التجريبية — متبقي ${trial.hoursRemaining} ${trial.hoursRemaining === 1 ? 'ساعة' : 'ساعات'}`
                  : `Trial — ${trial.hoursRemaining}h remaining`}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-2xs text-content-tertiary flex items-center gap-1">
                  <Zap size={10} />
                  {lang === 'ar'
                    ? `الذكاء الاصطناعي: ${trial.aiUsed}/${trial.aiMax}`
                    : `AI: ${trial.aiUsed}/${trial.aiMax}`}
                </span>
                <span className="text-2xs text-content-tertiary">
                  {lang === 'ar'
                    ? `القوالب: ${trial.templateUsed}/${trial.templateMax}`
                    : `Templates: ${trial.templateUsed}/${trial.templateMax}`}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/billing')}
            className="btn btn-secondary btn-sm flex-shrink-0"
          >
            {lang === 'ar' ? 'عرض الخطط' : 'View Plans'}
          </button>
        </div>
      </div>
    );
  }

  // Not trial, not expired → paid user, no banner
  return null;
}
