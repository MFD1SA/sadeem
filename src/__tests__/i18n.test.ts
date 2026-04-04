import { describe, it, expect } from 'vitest';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

// ─── Structure Parity ──────────────────────────────────────────────────────

describe('i18n: ar and en have matching keys', () => {
  function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        keys.push(...getKeys(val as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys.sort();
  }

  it('ar keys match en keys', () => {
    const arKeys = getKeys(ar as unknown as Record<string, unknown>);
    const enKeys = getKeys(en as unknown as Record<string, unknown>);
    const missingInEn = arKeys.filter(k => !enKeys.includes(k));
    const missingInAr = enKeys.filter(k => !arKeys.includes(k));
    expect(missingInEn).toEqual([]);
    expect(missingInAr).toEqual([]);
  });

  it('no empty translation values in ar', () => {
    const arKeys = getKeys(ar as unknown as Record<string, unknown>);
    for (const key of arKeys) {
      const parts = key.split('.');
      let val: unknown = ar;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      expect(val, `ar.${key} should not be empty`).toBeTruthy();
    }
  });

  it('no empty translation values in en', () => {
    const enKeys = getKeys(en as unknown as Record<string, unknown>);
    for (const key of enKeys) {
      const parts = key.split('.');
      let val: unknown = en;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      expect(val, `en.${key} should not be empty`).toBeTruthy();
    }
  });
});

// ─── Critical Keys Exist ────────────────────────────────────────────────────

describe('i18n: critical keys exist', () => {
  it('has nav keys', () => {
    expect(ar.nav.dashboard).toBeTruthy();
    expect(en.nav.dashboard).toBeTruthy();
    expect(ar.nav.reviews).toBeTruthy();
    expect(en.nav.reviews).toBeTruthy();
  });

  it('has common keys', () => {
    expect(ar.common.save).toBeTruthy();
    expect(en.common.save).toBeTruthy();
    expect(ar.common.cancel).toBeTruthy();
    expect(en.common.cancel).toBeTruthy();
    expect(ar.common.loading).toBeTruthy();
    expect(en.common.loading).toBeTruthy();
  });

  it('has auth keys', () => {
    expect(ar.auth.login).toBeTruthy();
    expect(en.auth.login).toBeTruthy();
    expect(ar.auth.signup).toBeTruthy();
    expect(en.auth.signup).toBeTruthy();
  });

  it('has billing plan keys', () => {
    expect(ar.billingPage.plans.orbit).toBeTruthy();
    expect(en.billingPage.plans.orbit).toBeTruthy();
    expect(ar.billingPage.plans.infinity).toBeTruthy();
    expect(en.billingPage.plans.infinity).toBeTruthy();
  });

  it('has dashboard keys', () => {
    expect(ar.dashboard.avgRating).toBeTruthy();
    expect(en.dashboard.avgRating).toBeTruthy();
    expect(ar.dashboardExt.greeting).toBeTruthy();
    expect(en.dashboardExt.greeting).toBeTruthy();
  });

  it('has error boundary keys', () => {
    expect(ar.errorBoundary.title).toBeTruthy();
    expect(en.errorBoundary.title).toBeTruthy();
    expect(ar.errorBoundary.refresh).toBeTruthy();
    expect(en.errorBoundary.refresh).toBeTruthy();
  });

  it('has accessibility keys', () => {
    expect(ar.a11y.skipToContent).toBeTruthy();
    expect(en.a11y.skipToContent).toBeTruthy();
  });
});

// ─── Languages are Different ────────────────────────────────────────────────

describe('i18n: ar and en values are different', () => {
  it('appName differs', () => {
    expect(ar.appName).not.toBe(en.appName);
  });

  it('nav items differ', () => {
    expect(ar.nav.dashboard).not.toBe(en.nav.dashboard);
  });

  it('common items differ', () => {
    expect(ar.common.save).not.toBe(en.common.save);
  });
});
