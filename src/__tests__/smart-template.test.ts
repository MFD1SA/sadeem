import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => ({
                in: () => ({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  },
}));

import { findStrongTemplateMatch } from '@/services/smart-template';

describe('findStrongTemplateMatch', () => {
  it('rejects 1-star reviews', async () => {
    const result = await findStrongTemplateMatch('org1', 1, 'Bad experience', 'en');
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('1-star');
  });

  it('rejects empty review text', async () => {
    const result = await findStrongTemplateMatch('org1', 4, '', 'en');
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('too short');
  });

  it('rejects null review text', async () => {
    const result = await findStrongTemplateMatch('org1', 5, null, 'ar');
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('too short');
  });

  it('rejects very short review text', async () => {
    const result = await findStrongTemplateMatch('org1', 3, 'ok', 'en');
    expect(result.matched).toBe(false);
    expect(result.reason).toContain('too short');
  });

  it('returns a result for valid 5-star review with text', async () => {
    const result = await findStrongTemplateMatch('org1', 5, 'Great service, loved it!', 'en');
    // Either matched a builtin template or not - both valid results
    expect(result).toHaveProperty('matched');
    expect(result).toHaveProperty('template');
    expect(result).toHaveProperty('reason');
  });

  it('returns a result for valid 3-star review with text', async () => {
    const result = await findStrongTemplateMatch('org1', 3, 'It was okay, nothing special', 'en');
    expect(result).toHaveProperty('matched');
    expect(result).toHaveProperty('reason');
  });

  it('returns a result for valid 2-star review with text', async () => {
    const result = await findStrongTemplateMatch('org1', 2, 'Not great, needs improvement', 'en');
    expect(result).toHaveProperty('matched');
    expect(result).toHaveProperty('reason');
  });

  it('handles Arabic review text', async () => {
    const result = await findStrongTemplateMatch('org1', 5, 'خدمة ممتازة وفريق رائع', 'ar');
    expect(result).toHaveProperty('matched');
    expect(result).toHaveProperty('reason');
  });

  it('handles industry parameter', async () => {
    const result = await findStrongTemplateMatch('org1', 4, 'Good food and nice atmosphere', 'en', 'restaurant');
    expect(result).toHaveProperty('matched');
  });

  it('handles null industry', async () => {
    const result = await findStrongTemplateMatch('org1', 4, 'Good service overall', 'en', null);
    expect(result).toHaveProperty('matched');
  });
});
