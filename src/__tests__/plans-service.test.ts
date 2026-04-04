import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Supabase mock ──
let terminalValue: Record<string, unknown> = { data: null, error: null };
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

function makeChain(): Record<string, any> {
  const c: Record<string, any> = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'data') return terminalValue.data;
      if (prop === 'error') return terminalValue.error;
      if (prop === 'then') return undefined;
      if (prop === 'update') return (...a: unknown[]) => { mockUpdate(...a); return c; };
      if (prop === 'upsert') return (...a: unknown[]) => { mockUpsert(...a); return c; };
      return () => c;
    },
  });
  return c;
}

vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => makeChain() },
}));

import { plansService, integrationsService } from '@/services/plans';

describe('plansService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalValue = { data: null, error: null };
  });

  // ── listActive ──

  it('returns active plans ordered by sort_order', async () => {
    const plans = [
      { id: 'orbit', name_en: 'Orbit', is_active: true, sort_order: 1 },
      { id: 'star', name_en: 'Star', is_active: true, sort_order: 2 },
    ];
    terminalValue = { data: plans, error: null };

    const result = await plansService.listActive();

    expect(result).toEqual(plans);
  });

  it('throws on listActive error', async () => {
    terminalValue = { data: null, error: { message: 'DB error' } };

    await expect(plansService.listActive()).rejects.toBeTruthy();
  });

  // ── getLimits ──

  it('returns plan limits for a valid plan', async () => {
    const limits = { plan_id: 'star', max_branches: 5, max_ai_replies: 500 };
    terminalValue = { data: limits, error: null };

    const result = await plansService.getLimits('star');

    expect(result).toEqual(limits);
  });

  it('returns null when plan has no limits row', async () => {
    terminalValue = { data: null, error: null };

    const result = await plansService.getLimits('nonexistent');

    expect(result).toBeNull();
  });

  it('throws on getLimits DB error', async () => {
    terminalValue = { data: null, error: { message: 'connection failed' } };

    await expect(plansService.getLimits('star')).rejects.toBeTruthy();
  });

  // ── getFeatures ──

  it('returns features as key-value map', async () => {
    const features = [
      { feature_key: 'ai_tone', feature_value: 'professional' },
      { feature_key: 'qr_branding', feature_value: 'true' },
    ];
    terminalValue = { data: features, error: null };

    const result = await plansService.getFeatures('star');

    expect(result).toEqual({ ai_tone: 'professional', qr_branding: 'true' });
  });

  it('returns empty object on getFeatures error', async () => {
    terminalValue = { data: null, error: { message: 'DB error' } };

    const result = await plansService.getFeatures('star');

    expect(result).toEqual({});
  });

  // ── updatePlan ──

  it('calls update with provided fields', async () => {
    terminalValue = { error: null };

    await expect(plansService.updatePlan('orbit', { price_monthly: 99 } as any)).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe('integrationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalValue = { data: null, error: null };
  });

  it('returns all integrations ordered by category', async () => {
    const integrations = [{ id: 'i1', key: 'google', category: 'reviews' }];
    terminalValue = { data: integrations, error: null };

    const result = await integrationsService.list();

    expect(result).toEqual(integrations);
  });

  it('returns null when integration key not found', async () => {
    terminalValue = { data: null, error: { message: 'not found' } };

    const result = await integrationsService.getByKey('missing');

    expect(result).toBeNull();
  });
});
