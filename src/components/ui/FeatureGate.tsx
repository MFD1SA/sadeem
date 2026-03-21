import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { usePlan } from '@/hooks/usePlan';
import { Lock, ArrowUpRight } from 'lucide-react';
import type { PlanLimits } from '@/types/subscription';
import { getMinimumPlanFor, getPlanName } from '@/types/subscription';

interface FeatureGateProps {
  feature: keyof PlanLimits;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wraps a feature section. If the current plan doesn't include the feature,
 * shows a locked overlay with upgrade prompt instead of the children.
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { canUseFeature } = usePlan();

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback || <UpgradeCard feature={feature} />}</>;
}

/**
 * Inline upgrade prompt card shown when a feature is locked.
 */
export function UpgradeCard({ feature, className }: { feature: keyof PlanLimits; className?: string }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const requiredPlan = getMinimumPlanFor(feature);
  const planName = getPlanName(requiredPlan, lang);

  return (
    <div className={`border border-dashed border-amber-300 bg-amber-50/50 rounded-xl p-5 text-center ${className || ''}`}>
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
        <Lock size={18} className="text-amber-600" />
      </div>
      <div className="text-[13px] font-semibold text-content-primary mb-1">
        {lang === 'ar' ? 'هذه الميزة متاحة في خطة' : 'This feature requires the'} {planName} {lang === 'ar' ? 'أو أعلى' : 'plan or higher'}
      </div>
      <p className="text-xs text-content-tertiary mb-3">
        {lang === 'ar'
          ? 'قم بترقية خطتك للوصول لجميع الميزات المتقدمة'
          : 'Upgrade your plan to access all advanced features'}
      </p>
      <button
        onClick={() => navigate('/dashboard/billing')}
        className="btn btn-primary btn-sm"
      >
        <ArrowUpRight size={13} />
        {lang === 'ar' ? 'ترقية الخطة' : 'Upgrade Plan'}
      </button>
    </div>
  );
}

/**
 * Simple inline check — returns true/false without UI.
 * Use when you need conditional logic, not a visual gate.
 */
export function useBranchLimit(): {
  canAdd: boolean;
  current: number;
  max: number;
  showUpgrade: () => void;
} {
  const { canAddBranch, branchCount, limits } = usePlan();
  const navigate = useNavigate();

  return {
    canAdd: canAddBranch,
    current: branchCount,
    max: limits.maxBranches === Infinity ? -1 : limits.maxBranches,
    showUpgrade: () => navigate('/dashboard/billing'),
  };
}
