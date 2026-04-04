import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock (competitor service imports it but fetchCompetitors is a stub) ──
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({}) },
}));

import { competitorService, type CompetitorData } from '@/services/competitor';

describe('competitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── fetchCompetitors ──

  it('returns empty array (MVP placeholder)', async () => {
    const result = await competitorService.fetchCompetitors({
      industry: 'restaurant',
      city: 'Riyadh',
    });

    expect(result).toEqual([]);
  });

  // ── generateReport ──

  it('returns empty insights when no competitors', () => {
    const report = competitorService.generateReport(4.5, 100, []);

    expect(report.insights).toEqual([]);
    expect(report.myRating).toBe(4.5);
    expect(report.myReviewCount).toBe(100);
  });

  it('identifies strength when my rating is higher than average', () => {
    const competitors: CompetitorData[] = [
      { name: 'Comp A', rating: 3.5, reviewCount: 50, address: 'Addr A', placeId: 'p1' },
      { name: 'Comp B', rating: 3.0, reviewCount: 40, address: 'Addr B', placeId: 'p2' },
    ];

    const report = competitorService.generateReport(4.8, 200, competitors);

    const strength = report.insights.find(i => i.type === 'strength');
    expect(strength).toBeDefined();
    expect(strength!.textEn).toContain('above competitor average');
  });

  it('identifies weakness when my rating is lower than average', () => {
    const competitors: CompetitorData[] = [
      { name: 'Comp A', rating: 4.9, reviewCount: 300, address: 'Addr A', placeId: 'p1' },
      { name: 'Comp B', rating: 4.7, reviewCount: 250, address: 'Addr B', placeId: 'p2' },
    ];

    const report = competitorService.generateReport(3.5, 100, competitors);

    const weakness = report.insights.find(i => i.type === 'weakness' && i.textEn.includes('below'));
    expect(weakness).toBeDefined();
  });

  it('identifies opportunity when review count is much lower', () => {
    const competitors: CompetitorData[] = [
      { name: 'Comp A', rating: 4.0, reviewCount: 500, address: 'Addr A', placeId: 'p1' },
    ];

    const report = competitorService.generateReport(4.0, 100, competitors);

    const opportunity = report.insights.find(i => i.type === 'opportunity');
    expect(opportunity).toBeDefined();
    expect(opportunity!.textEn).toContain('review count is significantly lower');
  });

  it('identifies top competitor as a weakness insight', () => {
    const competitors: CompetitorData[] = [
      { name: 'Best Place', rating: 4.9, reviewCount: 1000, address: 'Addr', placeId: 'p1' },
      { name: 'Other', rating: 3.5, reviewCount: 50, address: 'Addr2', placeId: 'p2' },
    ];

    const report = competitorService.generateReport(3.0, 200, competitors);

    const topCompInsight = report.insights.find(i => i.textEn.includes('Best Place'));
    expect(topCompInsight).toBeDefined();
    expect(topCompInsight!.type).toBe('weakness');
  });

  // ── extractKeywords ──

  it('extracts and ranks keywords from review texts', () => {
    const reviews = [
      'great food and great service',
      'the food was amazing and fresh',
      'food quality is excellent',
    ];

    const keywords = competitorService.extractKeywords(reviews);

    expect(keywords.length).toBeGreaterThan(0);
    // "food" appears in all 3 reviews
    expect(keywords[0].word).toBe('food');
    expect(keywords[0].count).toBe(3);
  });

  it('filters out stop words and short words', () => {
    const reviews = ['the a is and to of in good'];

    const keywords = competitorService.extractKeywords(reviews);

    const words = keywords.map(k => k.word);
    expect(words).not.toContain('the');
    expect(words).not.toContain('a');
    expect(words).not.toContain('is');
    expect(words).toContain('good');
  });
});
