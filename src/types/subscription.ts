// ─── Database Types ───

export interface DbSubscription {
  id: string;
  organization_id: string;
  plan: PlanId;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  starts_at: string;
  ends_at: string | null;
  ai_replies_used: number;
  template_replies_used: number;
  created_at: string;
  updated_at: string;
}

// ─── Trial Limits ───

export const TRIAL_LIMITS = {
  maxBranches: 1,
  maxAiReplies: 2,
  maxTemplateReplies: 10,
  maxQrPerBranch: 1,
  durationHours: 24,
} as const;

// ─── Plan Definitions ───

export type PlanId = 'starter' | 'growth' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxBranches: number;
  qrPerBranch: boolean;
  qrLandingPage: boolean;
  qrEmployeeField: boolean;
  qrAnalytics: boolean;
  advancedAnalytics: boolean;
  branchComparison: boolean;
  advancedReporting: boolean;
  logoUpload: boolean;
  apiAccess: boolean;
  premiumSupport: boolean;
}

export interface PlanInfo {
  id: PlanId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, PlanInfo> = {
  starter: {
    id: 'starter',
    nameAr: 'المبتدئ',
    nameEn: 'Starter',
    descAr: 'للأنشطة التجارية الصغيرة',
    descEn: 'For small businesses',
    limits: {
      maxBranches: 1,
      qrPerBranch: false,
      qrLandingPage: false,
      qrEmployeeField: false,
      qrAnalytics: false,
      advancedAnalytics: false,
      branchComparison: false,
      advancedReporting: false,
      logoUpload: false,
      apiAccess: false,
      premiumSupport: false,
    },
  },
  growth: {
    id: 'growth',
    nameAr: 'النمو',
    nameEn: 'Growth',
    descAr: 'للأنشطة المتوسعة',
    descEn: 'For growing businesses',
    limits: {
      maxBranches: 5,
      qrPerBranch: true,
      qrLandingPage: true,
      qrEmployeeField: false,
      qrAnalytics: false,
      advancedAnalytics: true,
      branchComparison: false,
      advancedReporting: false,
      logoUpload: true,
      apiAccess: false,
      premiumSupport: false,
    },
  },
  pro: {
    id: 'pro',
    nameAr: 'الاحترافي',
    nameEn: 'Pro',
    descAr: 'للأنشطة المتقدمة',
    descEn: 'For advanced businesses',
    limits: {
      maxBranches: 20,
      qrPerBranch: true,
      qrLandingPage: true,
      qrEmployeeField: true,
      qrAnalytics: true,
      advancedAnalytics: true,
      branchComparison: true,
      advancedReporting: true,
      logoUpload: true,
      apiAccess: false,
      premiumSupport: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    nameAr: 'المؤسسات',
    nameEn: 'Enterprise',
    descAr: 'حلول مخصصة للمؤسسات الكبرى',
    descEn: 'Custom solutions for large organizations',
    limits: {
      maxBranches: Infinity,
      qrPerBranch: true,
      qrLandingPage: true,
      qrEmployeeField: true,
      qrAnalytics: true,
      advancedAnalytics: true,
      branchComparison: true,
      advancedReporting: true,
      logoUpload: true,
      apiAccess: true,
      premiumSupport: true,
    },
  },
};

export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLANS[planId]?.limits || PLANS.starter.limits;
}

export function getPlanName(planId: PlanId, lang: 'ar' | 'en'): string {
  const plan = PLANS[planId];
  return lang === 'ar' ? plan.nameAr : plan.nameEn;
}

export function getMinimumPlanFor(feature: keyof PlanLimits): PlanId {
  const order: PlanId[] = ['starter', 'growth', 'pro', 'enterprise'];
  for (const planId of order) {
    const limits = PLANS[planId].limits;
    if (limits[feature] === true || (typeof limits[feature] === 'number' && limits[feature] > 0)) {
      return planId;
    }
  }
  return 'enterprise';
}
