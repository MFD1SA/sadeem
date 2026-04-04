import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATES, type BuiltInTemplate } from '@/services/default-templates';

describe('DEFAULT_TEMPLATES', () => {
  it('has at least 10 templates', () => {
    expect(DEFAULT_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('each template has required fields', () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      expect(tpl.nameAr).toBeTruthy();
      expect(tpl.nameEn).toBeTruthy();
      expect(tpl.bodyAr).toBeTruthy();
      expect(tpl.bodyEn).toBeTruthy();
      expect(['positive', 'negative', 'neutral', 'general']).toContain(tpl.category);
      expect(tpl.ratingMin).toBeGreaterThanOrEqual(1);
      expect(tpl.ratingMax).toBeLessThanOrEqual(5);
      expect(tpl.ratingMin).toBeLessThanOrEqual(tpl.ratingMax);
    }
  });

  it('has templates for each category', () => {
    const categories = new Set(DEFAULT_TEMPLATES.map(t => t.category));
    expect(categories.has('positive')).toBe(true);
    expect(categories.has('negative')).toBe(true);
  });

  it('has templates covering all star ratings', () => {
    for (let star = 1; star <= 5; star++) {
      const matching = DEFAULT_TEMPLATES.filter(t => t.ratingMin <= star && t.ratingMax >= star);
      expect(matching.length, `No template covers ${star}-star rating`).toBeGreaterThan(0);
    }
  });

  it('Arabic and English names are different', () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      expect(tpl.nameAr).not.toBe(tpl.nameEn);
      expect(tpl.bodyAr).not.toBe(tpl.bodyEn);
    }
  });

  it('body text is reasonably long', () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      expect(tpl.bodyAr.length).toBeGreaterThan(20);
      expect(tpl.bodyEn.length).toBeGreaterThan(20);
    }
  });

  it('5-star templates are categorized as positive', () => {
    const fiveStar = DEFAULT_TEMPLATES.filter(t => t.ratingMin === 5 && t.ratingMax === 5);
    for (const tpl of fiveStar) {
      expect(['positive', 'general']).toContain(tpl.category);
    }
  });

  it('1-2 star templates are categorized as negative', () => {
    const lowStar = DEFAULT_TEMPLATES.filter(t => t.ratingMax <= 2);
    for (const tpl of lowStar) {
      expect(['negative', 'general']).toContain(tpl.category);
    }
  });
});
