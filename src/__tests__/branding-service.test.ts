import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockMaybeSingle = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => mockMaybeSingle(),
        }),
      }),
    }),
  },
}));

import { getBranding, invalidateBrandingCache } from '@/services/branding';

describe('getBranding', () => {
  beforeEach(() => {
    invalidateBrandingCache();
    mockMaybeSingle.mockReset();
  });

  it('returns default branding when DB has no data', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await getBranding();
    expect(result.platform_name_ar).toBe('سيندا');
    expect(result.platform_name_en).toBe('SENDA');
  });

  it('returns custom branding from DB', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { value: { platform_name_en: 'CustomBrand', tagline: 'My Tagline' } },
      error: null,
    });

    const result = await getBranding();
    expect(result.platform_name_en).toBe('CustomBrand');
    expect(result.tagline).toBe('My Tagline');
    expect(result.platform_name_ar).toBe('سيندا'); // default for missing field
  });

  it('caches results and returns cached on second call', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { value: { platform_name_en: 'Cached' } },
      error: null,
    });

    const first = await getBranding();
    const second = await getBranding();

    expect(first.platform_name_en).toBe('Cached');
    expect(second.platform_name_en).toBe('Cached');
    // Should only call DB once due to cache
    expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
  });

  it('invalidateCache forces refetch', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { value: { platform_name_en: 'First' } },
      error: null,
    });

    await getBranding();
    invalidateBrandingCache();

    mockMaybeSingle.mockResolvedValue({
      data: { value: { platform_name_en: 'Second' } },
      error: null,
    });

    const result = await getBranding();
    expect(result.platform_name_en).toBe('Second');
    expect(mockMaybeSingle).toHaveBeenCalledTimes(2);
  });

  it('returns defaults on DB error', async () => {
    mockMaybeSingle.mockRejectedValue(new Error('DB connection failed'));

    const result = await getBranding();
    expect(result.platform_name_ar).toBe('سيندا');
    expect(result.platform_name_en).toBe('SENDA');
  });
});
