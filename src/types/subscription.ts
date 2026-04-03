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

// New plan IDs (preferred)
export type NewPlanId = 'orbit' | 'nova' | 'galaxy' | 'infinity';
// Legacy plan IDs (backward compat)
export type LegacyPlanId = 'starter' | 'growth' | 'pro' | 'enterprise';
export type PlanId = NewPlanId | LegacyPlanId;

export type EmojiSupport = 'basic' | 'normal' | 'advanced' | 'full';

export interface PlanLimits {
  maxBranches: number;
  maxTeamMembers: number;
  maxAiReplies: number;
  maxTemplateReplies: number;
  maxQrCodes: number;
  // Feature flags
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
  aiAutoReply: boolean;
  tasks: boolean;
  teamManagement: boolean;
  notifications: boolean;
  emojiSupport: EmojiSupport;
}

export interface PlanInfo {
  id: PlanId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  templateCount: number;
}

const UNLIMITED = 999999;

export const PLANS: Record<string, PlanInfo> = {
  // ── New Plans ──
  orbit: {
    id: 'orbit',
    nameAr: 'مدار',
    nameEn: 'Orbit',
    descAr: 'للأنشطة الصغيرة والناشئة',
    descEn: 'For small & emerging businesses',
    priceMonthly: 99,
    priceYearly: 990,
    templateCount: 10,
    limits: {
      maxBranches: 1, maxTeamMembers: 1, maxAiReplies: 50, maxTemplateReplies: 100, maxQrCodes: 1,
      qrPerBranch: false, qrLandingPage: false, qrEmployeeField: false, qrAnalytics: false,
      advancedAnalytics: false, branchComparison: false, advancedReporting: false,
      logoUpload: false, apiAccess: false, premiumSupport: false,
      aiAutoReply: true, tasks: false, teamManagement: false, notifications: true,
      emojiSupport: 'basic',
    },
  },
  nova: {
    id: 'nova',
    nameAr: 'نوفا',
    nameEn: 'Nova',
    descAr: 'للأنشطة المتنامية',
    descEn: 'For growing businesses',
    priceMonthly: 199,
    priceYearly: 1990,
    templateCount: 30,
    limits: {
      maxBranches: 3, maxTeamMembers: 3, maxAiReplies: 300, maxTemplateReplies: 500, maxQrCodes: 3,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: false, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: true, advancedReporting: false,
      logoUpload: true, apiAccess: false, premiumSupport: false,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'normal',
    },
  },
  galaxy: {
    id: 'galaxy',
    nameAr: 'جالاكسي',
    nameEn: 'Galaxy',
    descAr: 'للشركات المتقدمة متعددة الفروع',
    descEn: 'For advanced multi-branch companies',
    priceMonthly: 399,
    priceYearly: 3990,
    templateCount: 100,
    limits: {
      maxBranches: 10, maxTeamMembers: 10, maxAiReplies: 1500, maxTemplateReplies: UNLIMITED, maxQrCodes: 10,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: true, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: true, advancedReporting: true,
      logoUpload: true, apiAccess: false, premiumSupport: true,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'advanced',
    },
  },
  infinity: {
    id: 'infinity',
    nameAr: 'إنفينيتي',
    nameEn: 'Infinity',
    descAr: 'حلول مخصصة بلا حدود',
    descEn: 'Unlimited custom solutions',
    priceMonthly: 0,
    priceYearly: 0,
    templateCount: UNLIMITED,
    limits: {
      maxBranches: UNLIMITED, maxTeamMembers: UNLIMITED, maxAiReplies: UNLIMITED, maxTemplateReplies: UNLIMITED, maxQrCodes: UNLIMITED,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: true, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: true, advancedReporting: true,
      logoUpload: true, apiAccess: true, premiumSupport: true,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'full',
    },
  },
  // ── Legacy (backward compat) ──
  starter: {
    id: 'starter',
    nameAr: 'المبتدئ',
    nameEn: 'Starter',
    descAr: 'للأنشطة التجارية الصغيرة',
    descEn: 'For small businesses',
    priceMonthly: 99,
    priceYearly: 990,
    templateCount: 10,
    limits: {
      maxBranches: 1, maxTeamMembers: 1, maxAiReplies: 50, maxTemplateReplies: 100, maxQrCodes: 1,
      qrPerBranch: false, qrLandingPage: false, qrEmployeeField: false, qrAnalytics: false,
      advancedAnalytics: false, branchComparison: false, advancedReporting: false,
      logoUpload: false, apiAccess: false, premiumSupport: false,
      aiAutoReply: true, tasks: false, teamManagement: false, notifications: true,
      emojiSupport: 'basic',
    },
  },
  growth: {
    id: 'growth',
    nameAr: 'النمو',
    nameEn: 'Growth',
    descAr: 'للأنشطة المتوسعة',
    descEn: 'For growing businesses',
    priceMonthly: 199,
    priceYearly: 1990,
    templateCount: 30,
    limits: {
      maxBranches: 5, maxTeamMembers: 5, maxAiReplies: 300, maxTemplateReplies: 500, maxQrCodes: 3,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: false, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: false, advancedReporting: false,
      logoUpload: true, apiAccess: false, premiumSupport: false,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'normal',
    },
  },
  pro: {
    id: 'pro',
    nameAr: 'الاحترافي',
    nameEn: 'Pro',
    descAr: 'للأنشطة المتقدمة',
    descEn: 'For advanced businesses',
    priceMonthly: 399,
    priceYearly: 3990,
    templateCount: 100,
    limits: {
      maxBranches: 20, maxTeamMembers: 10, maxAiReplies: 1500, maxTemplateReplies: UNLIMITED, maxQrCodes: 10,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: true, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: true, advancedReporting: true,
      logoUpload: true, apiAccess: false, premiumSupport: false,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'advanced',
    },
  },
  enterprise: {
    id: 'enterprise',
    nameAr: 'المؤسسات',
    nameEn: 'Enterprise',
    descAr: 'حلول مخصصة للمؤسسات الكبرى',
    descEn: 'Custom solutions for large organizations',
    priceMonthly: 0,
    priceYearly: 0,
    templateCount: UNLIMITED,
    limits: {
      maxBranches: UNLIMITED, maxTeamMembers: UNLIMITED, maxAiReplies: UNLIMITED, maxTemplateReplies: UNLIMITED, maxQrCodes: UNLIMITED,
      qrPerBranch: true, qrLandingPage: true, qrEmployeeField: true, qrAnalytics: true,
      advancedAnalytics: true, branchComparison: true, advancedReporting: true,
      logoUpload: true, apiAccess: true, premiumSupport: true,
      aiAutoReply: true, tasks: true, teamManagement: true, notifications: true,
      emojiSupport: 'full',
    },
  },
};

// Preferred display order
export const PLAN_DISPLAY_ORDER: NewPlanId[] = ['orbit', 'nova', 'galaxy', 'infinity'];

export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLANS[planId]?.limits || PLANS.orbit.limits;
}

export function getPlanInfo(planId: PlanId): PlanInfo {
  return PLANS[planId] || PLANS.orbit;
}

export function getPlanName(planId: PlanId, lang: 'ar' | 'en'): string {
  const plan = PLANS[planId];
  if (!plan) return planId;
  return lang === 'ar' ? plan.nameAr : plan.nameEn;
}

export function getMinimumPlanFor(feature: keyof PlanLimits): PlanId {
  const order: PlanId[] = ['orbit', 'nova', 'galaxy', 'infinity'];
  for (const planId of order) {
    const limits = PLANS[planId]?.limits;
    if (!limits) continue;
    const val = limits[feature];
    if (val === true || (typeof val === 'number' && val > 0)) return planId;
  }
  return 'infinity';
}
