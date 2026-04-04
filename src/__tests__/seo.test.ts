import { describe, it, expect } from 'vitest';
import { seoService } from '@/services/seo';

describe('seoService.calculateScore', () => {
  const fullInput = {
    businessName: 'مطعم الرياض',
    description: 'مطعم في الرياض يقدم أفضل الأطباق العربية',
    industry: 'مطعم',
    city: 'الرياض',
    photoCount: 30,
    reviewCount: 100,
    avgRating: 4.8,
    responseRate: 90,
    hasWebsite: true,
    hasPhone: true,
    hasHours: true,
    hasAddress: true,
  };

  it('returns a total score between 0 and 100', () => {
    const result = seoService.calculateScore(fullInput);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('returns high score for complete profile', () => {
    const result = seoService.calculateScore(fullInput);
    expect(result.total).toBeGreaterThanOrEqual(80);
  });

  it('returns low score for empty profile', () => {
    const result = seoService.calculateScore({
      businessName: '',
      description: '',
      industry: '',
      city: '',
      photoCount: 0,
      reviewCount: 0,
      avgRating: 0,
      responseRate: 0,
      hasWebsite: false,
      hasPhone: false,
      hasHours: false,
      hasAddress: false,
    });
    expect(result.total).toBeLessThan(20);
  });

  it('returns breakdown with multiple categories', () => {
    const result = seoService.calculateScore(fullInput);
    expect(result.breakdown.length).toBeGreaterThan(0);
    result.breakdown.forEach(item => {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(item.maxScore);
      expect(item.labelAr).toBeTruthy();
      expect(item.labelEn).toBeTruthy();
    });
  });

  it('generates suggestions for missing items', () => {
    const result = seoService.calculateScore({
      ...fullInput,
      hasWebsite: false,
      photoCount: 2,
      reviewCount: 3,
    });
    expect(result.suggestions.length).toBeGreaterThan(0);
    result.suggestions.forEach(s => {
      expect(['high', 'medium', 'low']).toContain(s.priority);
      expect(s.textAr).toBeTruthy();
      expect(s.textEn).toBeTruthy();
    });
  });

  it('breakdown scores sum up to total', () => {
    const result = seoService.calculateScore(fullInput);
    const sum = result.breakdown.reduce((s, item) => s + item.score, 0);
    expect(result.total).toBe(sum);
  });
});
