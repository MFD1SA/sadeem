import { useLanguage } from '@/i18n';
import { usePlan } from '@/hooks/usePlan';
import { Badge } from '@/components/ui/Badge';
import { PLANS, getPlanName, type PlanId } from '@/types/subscription';
import { Check, ArrowUpRight } from 'lucide-react';

const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'enterprise'];

export default function Billing() {
  const { lang } = useLanguage();
  const { plan: currentPlan, trial, isLoading } = usePlan();

  if (isLoading) return <div className="py-12 text-center text-sm text-content-tertiary">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;

  const statusLabel = trial.isExpired
    ? (lang === 'ar' ? 'منتهية' : 'Expired')
    : trial.isTrial
      ? (lang === 'ar' ? 'تجريبي' : 'Trial')
      : (lang === 'ar' ? 'نشط' : 'Active');

  const statusVariant = trial.isExpired ? 'danger' as const : trial.isTrial ? 'warning' as const : 'success' as const;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="card">
        <div className="card-header">
          <h3>{lang === 'ar' ? 'الاشتراك الحالي' : 'Current Subscription'}</h3>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold text-content-primary">{getPlanName(currentPlan, lang)}</div>
              <div className="text-xs text-content-tertiary mt-0.5">
                {lang === 'ar' ? PLANS[currentPlan].descAr : PLANS[currentPlan].descEn}
              </div>
            </div>
          </div>
          {trial.isTrial && !trial.isExpired && (
            <div className="mt-3 text-xs text-content-tertiary">
              {lang === 'ar'
                ? `متبقي ${trial.hoursRemaining} ساعة من الفترة التجريبية`
                : `${trial.hoursRemaining} hours remaining in trial`}
            </div>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
          {lang === 'ar' ? 'الخطط المتاحة' : 'Available Plans'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {planOrder.map(planId => {
            const plan = PLANS[planId];
            const isCurrent = planId === currentPlan;
            const limits = plan.limits;

            return (
              <div key={planId} className={`card ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[15px] font-bold text-content-primary">
                      {lang === 'ar' ? plan.nameAr : plan.nameEn}
                    </div>
                    {isCurrent && <Badge variant="info">{lang === 'ar' ? 'الحالية' : 'Current'}</Badge>}
                  </div>

                  <p className="text-xs text-content-tertiary mb-4">
                    {lang === 'ar' ? plan.descAr : plan.descEn}
                  </p>

                  <div className="space-y-2 text-xs mb-4">
                    <Feature active={true} label={lang === 'ar' ? `${limits.maxBranches === Infinity ? 'غير محدود' : limits.maxBranches} فروع` : `${limits.maxBranches === Infinity ? 'Unlimited' : limits.maxBranches} branches`} />
                    <Feature active={true} label={lang === 'ar' ? 'ربط Google Business' : 'Google Business'} />
                    <Feature active={true} label={lang === 'ar' ? 'ردود ذكية' : 'AI Replies'} />
                    <Feature active={limits.qrPerBranch} label={lang === 'ar' ? 'QR التقييمات' : 'Review QR'} />
                    <Feature active={limits.advancedAnalytics} label={lang === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics'} />
                    <Feature active={limits.branchComparison} label={lang === 'ar' ? 'مقارنة الفروع' : 'Branch Comparison'} />
                    <Feature active={limits.qrEmployeeField} label={lang === 'ar' ? 'تتبع الموظفين' : 'Employee Tracking'} />
                    <Feature active={limits.apiAccess} label={lang === 'ar' ? 'وصول API' : 'API Access'} />
                  </div>

                  {!isCurrent && (
                    <button className="btn btn-primary btn-sm w-full justify-center">
                      <ArrowUpRight size={13} />
                      {lang === 'ar' ? 'ترقية' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Feature({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-content-primary' : 'text-content-tertiary line-through'}`}>
      <Check size={13} className={active ? 'text-emerald-500' : 'text-gray-300'} />
      <span>{label}</span>
    </div>
  );
}
