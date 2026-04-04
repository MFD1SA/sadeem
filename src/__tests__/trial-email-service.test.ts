import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      mockSelect.mockImplementation(() => ({
        eq: (...args: unknown[]) => {
          mockEq(table, ...args);
          return { single: () => mockSingle(table) };
        },
      }));
      return { select: mockSelect };
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

import { trialEmailService } from '@/services/trial-email';

describe('trialEmailService', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockEq.mockClear();
    mockSingle.mockClear();
    mockInvoke.mockClear();
  });

  // --- getEmailContent ---

  it('getEmailContent returns correct structure with all fields', () => {
    const result = trialEmailService.getEmailContent({
      to: 'user@example.com',
      organizationName: 'Test Org',
      ownerName: 'Ali',
    });

    expect(result.to).toBe('user@example.com');
    expect(result.subject).toContain('سيندا');
    expect(result.html).toContain('Ali');
    expect(result.html).toContain('Test Org');
    expect(result.html).toContain('/dashboard/billing');
  });

  // --- sendTrialExpirationEmail ---

  it('sends email successfully when org and user exist', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: { name: 'Acme', owner_user_id: 'user-1' }, error: null };
      }
      if (table === 'users') {
        return { data: { email: 'owner@acme.com', full_name: 'Omar' }, error: null };
      }
      return { data: null, error: null };
    });
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await trialEmailService.sendTrialExpirationEmail('org-1');

    expect(mockSingle).toHaveBeenCalledWith('organizations');
    expect(mockSingle).toHaveBeenCalledWith('users');
    expect(mockInvoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
      body: expect.objectContaining({
        to: 'owner@acme.com',
      }),
    }));
  });

  it('does not throw when organization lookup fails', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: null, error: { message: 'not found' } };
      }
      return { data: null, error: null };
    });

    await expect(
      trialEmailService.sendTrialExpirationEmail('bad-org')
    ).resolves.not.toThrow();

    // Should never reach user lookup or email invoke
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not throw when user lookup fails', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: { name: 'Acme', owner_user_id: 'user-1' }, error: null };
      }
      if (table === 'users') {
        return { data: null, error: { message: 'user not found' } };
      }
      return { data: null, error: null };
    });

    await expect(
      trialEmailService.sendTrialExpirationEmail('org-1')
    ).resolves.not.toThrow();

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does not throw when edge function invoke throws', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: { name: 'Acme', owner_user_id: 'user-1' }, error: null };
      }
      if (table === 'users') {
        return { data: { email: 'owner@acme.com', full_name: 'Omar' }, error: null };
      }
      return { data: null, error: null };
    });
    mockInvoke.mockRejectedValue(new Error('Edge Function unavailable'));

    await expect(
      trialEmailService.sendTrialExpirationEmail('org-1')
    ).resolves.not.toThrow();
  });

  it('handles null orgData gracefully (returns early)', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: null, error: null };
      }
      return { data: null, error: null };
    });

    await expect(
      trialEmailService.sendTrialExpirationEmail('org-1')
    ).resolves.not.toThrow();

    // Should not attempt user lookup or email
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('uses email as ownerName fallback when full_name is empty', async () => {
    mockSingle.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return { data: { name: 'Acme', owner_user_id: 'user-1' }, error: null };
      }
      if (table === 'users') {
        return { data: { email: 'owner@acme.com', full_name: '' }, error: null };
      }
      return { data: null, error: null };
    });
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await trialEmailService.sendTrialExpirationEmail('org-1');

    expect(mockInvoke).toHaveBeenCalledWith('send-email', expect.objectContaining({
      body: expect.objectContaining({
        to: 'owner@acme.com',
      }),
    }));

    // The HTML should contain the email as the name fallback
    const invokeCall = mockInvoke.mock.calls[0];
    const html = invokeCall[1].body.html as string;
    expect(html).toContain('owner@acme.com');
  });

  it('does not throw on unexpected runtime error', async () => {
    // Force an unexpected error by making mockSingle throw
    mockSingle.mockImplementation(() => {
      throw new Error('unexpected DB crash');
    });

    await expect(
      trialEmailService.sendTrialExpirationEmail('org-1')
    ).resolves.not.toThrow();
  });
});
