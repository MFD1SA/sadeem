import { describe, it, expect } from 'vitest';
import {
  getPlanLimits,
  getPlanInfo,
  getPlanName,
  getMinimumPlanFor,
  PLANS,
  PLAN_DISPLAY_ORDER,
  TRIAL_LIMITS,
} from '@/types/subscription';

// ─── PLANS structure ────────────────────────────────────────────────────────

describe('PLANS', () => {
  it('has all new plan IDs', () => {
    expect(PLANS).toHaveProperty('orbit');
    expect(PLANS).toHaveProperty('nova');
    expect(PLANS).toHaveProperty('galaxy');
    expect(PLANS).toHaveProperty('infinity');
  });

  it('has all legacy plan IDs', () => {
    expect(PLANS).toHaveProperty('starter');
    expect(PLANS).toHaveProperty('growth');
    expect(PLANS).toHaveProperty('pro');
    expect(PLANS).toHaveProperty('enterprise');
  });

  it('each plan has required fields', () => {
    for (const [id, plan] of Object.entries(PLANS)) {
      expect(plan.id).toBe(id);
      expect(plan.nameAr).toBeTruthy();
      expect(plan.nameEn).toBeTruthy();
      expect(plan.limits).toBeDefined();
      expect(typeof plan.priceMonthly).toBe('number');
      expect(typeof plan.templateCount).toBe('number');
    }
  });

  it('orbit is the cheapest plan', () => {
    expect(PLANS.orbit.priceMonthly).toBeLessThanOrEqual(PLANS.nova.priceMonthly);
    expect(PLANS.nova.priceMonthly).toBeLessThanOrEqual(PLANS.galaxy.priceMonthly);
  });

  it('infinity has unlimited resources', () => {
    expect(PLANS.infinity.limits.maxBranches).toBeGreaterThanOrEqual(999999);
    expect(PLANS.infinity.limits.maxAiReplies).toBeGreaterThanOrEqual(999999);
    expect(PLANS.infinity.limits.maxTeamMembers).toBeGreaterThanOrEqual(999999);
  });

  it('orbit has limited resources', () => {
    expect(PLANS.orbit.limits.maxBranches).toBe(1);
    expect(PLANS.orbit.limits.maxTeamMembers).toBe(1);
    expect(PLANS.orbit.limits.maxAiReplies).toBe(50);
  });

  it('galaxy has 1500 AI replies', () => {
    expect(PLANS.galaxy.limits.maxAiReplies).toBe(1500);
  });
});

// ─── PLAN_DISPLAY_ORDER ─────────────────────────────────────────────────────

describe('PLAN_DISPLAY_ORDER', () => {
  it('contains exactly 4 new plan IDs', () => {
    expect(PLAN_DISPLAY_ORDER).toHaveLength(4);
    expect(PLAN_DISPLAY_ORDER).toEqual(['orbit', 'nova', 'galaxy', 'infinity']);
  });

  it('all ordered plans exist in PLANS', () => {
    for (const id of PLAN_DISPLAY_ORDER) {
      expect(PLANS[id]).toBeDefined();
    }
  });
});

// ─── TRIAL_LIMITS ───────────────────────────────────────────────────────────

describe('TRIAL_LIMITS', () => {
  it('has strict trial constraints', () => {
    expect(TRIAL_LIMITS.maxBranches).toBe(1);
    expect(TRIAL_LIMITS.maxAiReplies).toBe(2);
    expect(TRIAL_LIMITS.maxTemplateReplies).toBe(10);
    expect(TRIAL_LIMITS.maxQrPerBranch).toBe(1);
    expect(TRIAL_LIMITS.durationHours).toBe(24);
  });

  it('trial limits are stricter than orbit', () => {
    expect(TRIAL_LIMITS.maxAiReplies).toBeLessThan(PLANS.orbit.limits.maxAiReplies);
    expect(TRIAL_LIMITS.maxTemplateReplies).toBeLessThan(PLANS.orbit.limits.maxTemplateReplies);
  });
});

// ─── getPlanLimits ──────────────────────────────────────────────────────────

describe('getPlanLimits', () => {
  it('returns correct limits for valid plan', () => {
    const limits = getPlanLimits('galaxy');
    expect(limits.maxAiReplies).toBe(1500);
    expect(limits.maxBranches).toBe(10);
    expect(limits.advancedAnalytics).toBe(true);
  });

  it('falls back to orbit for invalid plan', () => {
    const limits = getPlanLimits('nonexistent' as any);
    expect(limits).toEqual(PLANS.orbit.limits);
  });

  it('handles legacy plan IDs', () => {
    const limits = getPlanLimits('starter');
    expect(limits.maxBranches).toBe(1);
  });
});

// ─── getPlanInfo ────────────────────────────────────────────────────────────

describe('getPlanInfo', () => {
  it('returns full plan info for valid ID', () => {
    const info = getPlanInfo('nova');
    expect(info.id).toBe('nova');
    expect(info.nameAr).toBe('نوفا');
    expect(info.nameEn).toBe('Nova');
  });

  it('falls back to orbit for invalid ID', () => {
    const info = getPlanInfo('fake' as any);
    expect(info.id).toBe('orbit');
  });
});

// ─── getPlanName ────────────────────────────────────────────────────────────

describe('getPlanName', () => {
  it('returns Arabic name for ar', () => {
    expect(getPlanName('orbit', 'ar')).toBe('مدار');
    expect(getPlanName('galaxy', 'ar')).toBe('جالكسي');
  });

  it('returns English name for en', () => {
    expect(getPlanName('orbit', 'en')).toBe('Orbit');
    expect(getPlanName('galaxy', 'en')).toBe('Galaxy');
  });

  it('returns planId for unknown plan', () => {
    expect(getPlanName('unknown_plan' as any, 'en')).toBe('unknown_plan');
  });
});

// ─── getMinimumPlanFor ──────────────────────────────────────────────────────

describe('getMinimumPlanFor', () => {
  it('orbit is enough for aiAutoReply', () => {
    expect(getMinimumPlanFor('aiAutoReply')).toBe('orbit');
  });

  it('orbit is enough for notifications', () => {
    expect(getMinimumPlanFor('notifications')).toBe('orbit');
  });

  it('nova is minimum for advancedAnalytics', () => {
    expect(getMinimumPlanFor('advancedAnalytics')).toBe('nova');
  });

  it('nova is minimum for teamManagement', () => {
    expect(getMinimumPlanFor('teamManagement')).toBe('nova');
  });

  it('infinity is minimum for apiAccess', () => {
    expect(getMinimumPlanFor('apiAccess')).toBe('infinity');
  });

  it('galaxy is minimum for premiumSupport', () => {
    expect(getMinimumPlanFor('premiumSupport')).toBe('galaxy');
  });
});
