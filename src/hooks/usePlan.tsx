import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscriptionService } from '@/services/subscription';
import { branchesService } from '@/services/branches';
import type { DbSubscription, PlanId, PlanLimits } from '@/types/subscription';
import { getPlanLimits, TRIAL_LIMITS } from '@/types/subscription';

interface TrialState {
  isTrial: boolean;
  isExpired: boolean;
  hoursRemaining: number;
  aiUsed: number;
  aiMax: number;
  templateUsed: number;
  templateMax: number;
}

interface PlanContextType {
  subscription: DbSubscription | null;
  plan: PlanId;
  limits: PlanLimits;
  trial: TrialState;
  isLoading: boolean;
  branchCount: number;
  canAddBranch: boolean;
  canUseFeature: (feature: keyof PlanLimits) => boolean;
  refreshPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | null>(null);

const defaultTrial: TrialState = {
  isTrial: false, isExpired: false, hoursRemaining: 0,
  aiUsed: 0, aiMax: 0, templateUsed: 0, templateMax: 0,
};

// When no subscription row exists we treat the account as expired.
// Implicit free access is not permitted — users must have an active row.
const noSubscriptionTrial: TrialState = {
  isTrial: false, isExpired: true, hoursRemaining: 0,
  aiUsed: 0, aiMax: 0, templateUsed: 0, templateMax: 0,
};

export function PlanProvider({ children }: { children: ReactNode }) {
  const { organization, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<DbSubscription | null>(null);
  const [branchCount, setBranchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const plan: PlanId = subscription?.plan || 'starter';
  const limits = getPlanLimits(plan);

  // ─── Compute trial state ───
  const computeTrial = useCallback((sub: DbSubscription | null): TrialState => {
    // No subscription row → treat as expired. Prevents implicit free access
    // when the trial trigger failed or no plan has been assigned yet.
    if (!sub) return noSubscriptionTrial;

    const isTrial = sub.status === 'trial';
    const now = new Date();
    const endsAt = sub.ends_at ? new Date(sub.ends_at) : null;
    const isExpired = sub.status === 'expired' || sub.status === 'cancelled'
      || (isTrial && endsAt !== null && endsAt < now);
    const hoursRemaining = endsAt && isTrial && !isExpired
      ? Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
      : 0;

    return {
      isTrial,
      isExpired,
      hoursRemaining,
      aiUsed: sub.ai_replies_used || 0,
      aiMax: isTrial ? TRIAL_LIMITS.maxAiReplies : 999999,
      templateUsed: sub.template_replies_used || 0,
      templateMax: isTrial ? TRIAL_LIMITS.maxTemplateReplies : 999999,
    };
  }, []);

  const [trial, setTrial] = useState<TrialState>(defaultTrial);

  const loadPlan = useCallback(async () => {
    // Wait for auth to finish before deciding — prevents premature isLoading=false
    if (authLoading) return;
    if (!organization) { setIsLoading(false); return; }
    try {
      const [sub, branches] = await Promise.all([
        subscriptionService.getByOrganization(organization.id),
        branchesService.list(organization.id),
      ]);
      setSubscription(sub);
      setTrial(computeTrial(sub));
      setBranchCount(branches.filter((b: { status: string }) => b.status === 'active').length);
    } catch (err) {
      console.warn('[Sadeem] Plan load failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, authLoading, computeTrial]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const isExpired = trial.isExpired;
  const canAddBranch = !isExpired && branchCount < (trial.isTrial ? TRIAL_LIMITS.maxBranches : limits.maxBranches);

  const canUseFeature = useCallback((feature: keyof PlanLimits): boolean => {
    if (isExpired) return false;
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return false;
  }, [limits, isExpired]);

  return (
    <PlanContext.Provider value={{
      subscription, plan, limits, trial, isLoading, branchCount,
      canAddBranch, canUseFeature, refreshPlan: loadPlan,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan(): PlanContextType {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
