import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: () => mockSignOut(),
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}));

import { authService } from '@/services/auth';

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ─── signUp ───

  it('signUp passes email, password, and full_name metadata to supabase', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const result = await authService.signUp('test@example.com', 'pass123', 'Ali Hassan');

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'pass123',
        options: expect.objectContaining({
          data: { full_name: 'Ali Hassan' },
        }),
      })
    );
    expect(result).toEqual({ user: { id: 'u1' } });
  });

  it('signUp includes emailRedirectTo with /auth/callback path', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null });

    await authService.signUp('a@b.com', 'pw', 'Name');

    const callArg = mockSignUp.mock.calls[0][0];
    expect(callArg.options.emailRedirectTo).toContain('/auth/callback');
  });

  it('signUp throws on supabase error', async () => {
    const authError = { message: 'Email already registered', status: 409 };
    mockSignUp.mockResolvedValue({ data: null, error: authError });

    await expect(authService.signUp('dup@test.com', 'pw', 'X')).rejects.toEqual(authError);
  });

  // ─── login ───

  it('login calls signInWithPassword and returns data', async () => {
    const session = { access_token: 'tok', user: { id: 'u1' } };
    mockSignInWithPassword.mockResolvedValue({ data: session, error: null });

    const result = await authService.login('user@test.com', 'secret');

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'secret',
    });
    expect(result).toEqual(session);
  });

  it('login throws on invalid credentials', async () => {
    const authError = { message: 'Invalid login credentials' };
    mockSignInWithPassword.mockResolvedValue({ data: null, error: authError });

    await expect(authService.login('x@y.com', 'wrong')).rejects.toEqual(authError);
  });

  // ─── loginWithGoogle ───

  it('loginWithGoogle calls signInWithOAuth with google provider and correct scopes', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://google.com/oauth' }, error: null });

    await authService.loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          scopes: 'openid email profile',
          queryParams: expect.objectContaining({
            prompt: 'select_account',
          }),
        }),
      })
    );
  });

  // ─── getSession ───

  it('getSession returns the session object from the nested response', async () => {
    const session = { access_token: 'abc', user: { id: 'u1' } };
    mockGetSession.mockResolvedValue({ data: { session }, error: null });

    const result = await authService.getSession();

    expect(result).toEqual(session);
  });

  it('getSession returns null when no active session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const result = await authService.getSession();

    expect(result).toBeNull();
  });

  // ─── getUser ───

  it('getUser returns the user object from the nested response', async () => {
    const user = { id: 'u1', email: 'test@test.com' };
    mockGetUser.mockResolvedValue({ data: { user }, error: null });

    const result = await authService.getUser();

    expect(result).toEqual(user);
  });

  // ─── logout ───

  it('logout throws on signOut error', async () => {
    const err = { message: 'Network error' };
    mockSignOut.mockResolvedValue({ error: err });

    await expect(authService.logout()).rejects.toEqual(err);
  });
});
