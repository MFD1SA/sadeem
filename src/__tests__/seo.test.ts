import { describe, it, expect } from 'vitest';
import { seoService } from '@/services/seo';

describe('seoService.calculateScore', () => {
  const fullInput = {
    hasName: true,
    hasAddress: true,
    hasPhone: true,
    hasHours: true,
    hasDescription: true,
    descriptionLength: 100,
    description: 'مطعم في الرياض يقدم أفضل الأطباق العربية',
    hasWebsite: true,
    photoCount: 30,
    reviewCount: 100,
    avgRating: 4.8,
    responseRate: 90,
    hasLogo: true,
    hasCoverPhoto: true,
    industry: 'مطعم',
    city: 'الرياض',
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
      hasName: false,
      hasAddress: false,
      hasPhone: false,
      hasHours: false,
      hasDescription: false,
      descriptionLength: 0,
      description: '',
      hasWebsite: false,
      photoCount: 0,
      reviewCount: 0,
      avgRating: 0,
      responseRate: 0,
      hasLogo: false,
      hasCoverPhoto: false,
      industry: '',
      city: '',
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
