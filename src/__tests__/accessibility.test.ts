import { describe, it, expect } from 'vitest';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';

describe('Accessibility: a11y translation keys', () => {
  it('has all required a11y keys in ar', () => {
    expect(ar.a11y).toBeDefined();
    expect(ar.a11y.skipToContent).toBe('تخطي إلى المحتوى الرئيسي');
    expect(ar.a11y.closeMenu).toBeTruthy();
    expect(ar.a11y.openMenu).toBeTruthy();
    expect(ar.a11y.notifications).toBeTruthy();
    expect(ar.a11y.switchLanguage).toBeTruthy();
    expect(ar.a11y.userMenu).toBeTruthy();
    expect(ar.a11y.loading).toBeTruthy();
    expect(ar.a11y.errorOccurred).toBeTruthy();
  });

  it('has all required a11y keys in en', () => {
    expect(en.a11y).toBeDefined();
    expect(en.a11y.skipToContent).toBe('Skip to main content');
    expect(en.a11y.closeMenu).toBeTruthy();
    expect(en.a11y.openMenu).toBeTruthy();
    expect(en.a11y.notifications).toBeTruthy();
    expect(en.a11y.switchLanguage).toBeTruthy();
    expect(en.a11y.userMenu).toBeTruthy();
    expect(en.a11y.loading).toBeTruthy();
    expect(en.a11y.errorOccurred).toBeTruthy();
  });
});

describe('Accessibility: error boundary translations', () => {
  it('has error boundary messages in ar', () => {
    expect(ar.errorBoundary.title).toBeTruthy();
    expect(ar.errorBoundary.description).toBeTruthy();
    expect(ar.errorBoundary.refresh).toBeTruthy();
  });

  it('has error boundary messages in en', () => {
    expect(en.errorBoundary.title).toBeTruthy();
    expect(en.errorBoundary.description).toBeTruthy();
    expect(en.errorBoundary.refresh).toBeTruthy();
  });
});

describe('Accessibility: trial banner translations', () => {
  it('has trial keys in ar', () => {
    expect(ar.trial.trialActive).toBeTruthy();
    expect(ar.trial.trialExpired).toBeTruthy();
    expect(ar.trial.upgradeNow).toBeTruthy();
  });

  it('has trial keys in en', () => {
    expect(en.trial.trialActive).toBeTruthy();
    expect(en.trial.trialExpired).toBeTruthy();
    expect(en.trial.upgradeNow).toBeTruthy();
  });
});
