// ============================================================================
// SENDA — Professional Login / Sign-Up / Forgot-Password Page
// Split-panel design: branding panel (left/top) + form panel (right/bottom).
// Logo is configurable from Admin → Settings → Branding.
// ============================================================================
import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/i18n';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getBranding, type BrandingConfig } from '@/services/branding';
import { CheckCircle2, Star, BarChart3, MessageSquare, GitBranch, ArrowRight } from 'lucide-react';

// ── Password strength helper ────────────────────────────────────────────────
function calcPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return 1;
  if (s <= 3) return 2;
  return 3;
}

// ── Friendly error translation ──────────────────────────────────────────────
function translateError(msg: string, isAr: boolean): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many'))
    return isAr
      ? 'تجاوزت الحد المسموح. يرجى الانتظار دقيقة ثم المحاولة مجدداً.'
      : 'Too many requests. Please wait a moment and try again.';
  if (m.includes('email not confirmed'))
    return isAr
      ? 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.'
      : 'Please confirm your email first. Check your inbox.';
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('wrong password'))
    return isAr
      ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
      : 'Incorrect email or password.';
  if (m.includes('user already registered') || m.includes('already registered'))
    return isAr
      ? 'هذا البريد الإلكتروني مسجّل بالفعل. سجّل دخولك.'
      : 'This email is already registered. Sign in instead.';
  if (m.includes('password') && (m.includes('short') || m.includes('weak')))
    return isAr
      ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل).'
      : 'Password is too short (minimum 6 characters).';
  if (m.includes('user not found') || m.includes('no user'))
    return isAr
      ? 'لا يوجد حساب بهذا البريد الإلكتروني.'
      : 'No account found with this email.';
  if (m.includes('network') || m.includes('fetch'))
    return isAr
      ? 'خطأ في الاتصال. تحقق من الإنترنت وأعد المحاولة.'
      : 'Connection error. Check your internet and try again.';
  return msg;
}

// ── Module-level URL detection ──────────────────────────────────────────────
const _sp = new URLSearchParams(window.location.search);
const isOAuthCallback = _sp.has('code') || _sp.has('error') || _sp.has('token_hash');

// Feature bullets on branding panel
const FEATURES = [
  { icon: Star,          ar: 'ربط Google Business Profile', en: 'Google Business Profile integration' },
  { icon: MessageSquare, ar: 'ردود تلقائية بالذكاء الاصطناعي', en: 'AI-powered auto-replies' },
  { icon: BarChart3,     ar: 'تحليلات متقدمة وتقارير ذكية', en: 'Advanced analytics & smart reports' },
  { icon: GitBranch,     ar: 'إدارة جميع فروعك من مكان واحد', en: 'Manage all branches in one place' },
];

export default function Login({ defaultSignup = false }: { defaultSignup?: boolean }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [fullName, setFullName]         = useState('');
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [isSignUp, setIsSignUp]         = useState(defaultSignup);
  const [isForgotPw, setIsForgotPw]     = useState(false);
  const [branding, setBranding]         = useState<BrandingConfig | null>(null);
  const [pwStrength, setPwStrength]     = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load admin branding + set page title
  useEffect(() => {
    document.title = isAr ? 'سيندا — تسجيل الدخول' : 'SENDA — Sign In';
    getBranding().then(setBranding).catch(() => {});
  }, [isAr]);

  // Show confirmation_failed error from URL param
  useEffect(() => {
    if (_sp.get('error') === 'confirmation_failed') {
      setError(t.auth.confirmationExpired);
    }
  }, [isAr]);

  // Email confirmation via token_hash (fallback if redirected to /login instead of /auth/callback)
  useEffect(() => {
    const tokenHash = _sp.get('token_hash');
    const type = _sp.get('type');
    if (!tokenHash || type !== 'email') return;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
      .then(({ error: e }) => {
        if (e) window.location.href = '/login?error=confirmation_failed';
        // If success, AuthProvider will detect the session and
        // RedirectIfAuthenticated will redirect to /dashboard.
      });
  }, []);

  // OAuth callback: AuthProvider handles SIGNED_IN event and hydrates auth state.
  // RedirectIfAuthenticated guard will automatically redirect to /dashboard
  // once isAuthenticated becomes true. No manual redirect needed here.

  // ── OAuth callback loading screen (minimal) ────────────────────────────────
  if (isOAuthCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FB' }}>
        <div className="text-center flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 animate-spin mb-4" style={{ borderTopColor: '#B8965A' }} />
          <p className="text-sm text-[#6B7280]">
            {t.auth.signingIn}
          </p>
        </div>
      </div>
    );
  }

  // ── Shared values ──────────────────────────────────────────────────────────
  const logoIconUrl  = branding?.logo_icon_url || '';
  const logoFullUrl  = branding?.logo_full_url || '';
  const platformNameAr = branding?.platform_name_ar || 'سيندا';
  const platformNameEn = branding?.platform_name_en || 'SENDA';
  const tagline = branding?.tagline || t.auth.platformDesc;

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    emailDebounce.current = setTimeout(() => setEmailTouched(true), 600);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (isSignUp) setPwStrength(calcPasswordStrength(e.target.value));
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName);
        setLoading(false);
        setSuccess(t.auth.accountCreated);
      } else {
        await authService.login(email, password);
        // Keep loading=true — AuthProvider will detect SIGNED_IN event,
        // hydrate auth, and RedirectIfAuthenticated guard will redirect
        // to /dashboard automatically. No full page reload needed.
      }
    } catch (err: unknown) {
      setLoading(false);
      setError(translateError((err as Error).message || '', isAr));
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try { await authService.loginWithGoogle(); }
    catch (err: unknown) { setError(translateError((err as Error).message || '', isAr)); }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !isValidEmail(email)) {
      setError(t.auth.enterValidEmail);
      return;
    }
    setError(''); setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      setSuccess(t.auth.resetLinkSent.replace('{email}', email));
    } catch (err: unknown) {
      setError(translateError((err as Error).message || '', isAr));
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setIsForgotPw(false); setIsSignUp(false);
    setError(''); setSuccess(''); setEmail(''); setPassword('');
    setPwStrength(0); setEmailTouched(false);
  };

  const pwLabels    = ['', t.auth.weak, t.auth.medium, t.auth.strong];
  const pwColors    = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
  const pwTextColors = ['', 'text-red-600', 'text-amber-600', 'text-emerald-600'];

  // ── Shared header for branding panel ──────────────────────────────────────
  const BrandingPanel = (
    <div
      className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
      style={{ background: '#1A1A2E' }}
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(184,150,90,0.08)' }} />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(184,150,90,0.05)' }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <img
          src="/senda-logo.png"
          alt="SENDA"
          style={{ height: 36, width: 'auto', opacity: 0.92, filter: 'brightness(0) invert(1)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* Body */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-white leading-snug mb-3">
          {t.auth.aiReviewManagement}
        </h1>
        <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{tagline}</p>
        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, ar, en }) => (
            <div key={ar} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184,150,90,0.2)' }}>
                <Icon size={15} style={{ color: '#D4AF6A' }} />
              </div>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.88)' }}>{isAr ? ar : en}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {t.auth.copyright}
      </div>
    </div>
  );

  // ── Mobile logo ────────────────────────────────────────────────────────────
  const MobileLogo = (
    <div className="flex flex-col items-center mb-8 lg:hidden">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)' }}>
        {logoIconUrl
          ? <img src={logoIconUrl} alt="logo" className="w-9 h-9 object-contain" />
          : <span className="text-white text-2xl font-bold">س</span>}
      </div>
      <h2 className="text-xl font-bold text-[#1A1A2E]">{platformNameAr}</h2>
      <p className="text-xs text-[#6B7280] mt-1 text-center">{tagline}</p>
    </div>
  );

  // ── FORGOT PASSWORD form ───────────────────────────────────────────────────
  if (isForgotPw) {
    return (
      <div className="min-h-screen flex" dir={isAr ? 'rtl' : 'ltr'}>
        {BrandingPanel}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10" style={{ background: '#F8F9FB' }}>
          <div className="w-full max-w-sm">
            {MobileLogo}

            {/* Back link */}
            <button
              onClick={resetToLogin}
              className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
              style={{ color: '#B8965A' }}
            >
              <ArrowRight size={13} className={isAr ? '' : 'rotate-180'} />
              {t.auth.backToSignIn}
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#1A1A2E]">
                {t.auth.resetYourPassword}
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                {t.auth.resetYourPasswordDesc}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">{error}</div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                {success}
              </div>
            )}

            {!success && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                    {t.auth.email}
                  </label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    dir="ltr"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full justify-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)' }}
                >
                  {loading
                    ? t.auth.sending
                    : t.auth.sendResetLink}
                </button>
              </form>
            )}

            {success && (
              <button
                onClick={resetToLogin}
                className="w-full justify-center py-2.5 mt-2 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)' }}
              >
                {t.auth.backToSignIn}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LOGIN / SIGN-UP form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" dir={isAr ? 'rtl' : 'ltr'}>
      {BrandingPanel}

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10" style={{ background: '#F8F9FB' }}>
        <div className="w-full max-w-sm">
          {MobileLogo}

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1A1A2E]">
              {isSignUp ? t.auth.createNewAccount : t.auth.welcomeBack}
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">
              {isSignUp ? t.auth.signUpToGetStarted : t.auth.signInToContinue}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">{error}</div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Google login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border bg-white text-[#1A1A2E] text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm mb-4"
            style={{ borderColor: '#E8E8EC' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.auth.continueWithGoogle}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-[#E8E8EC]" />
            <span className="text-xs text-[#6B7280]">{t.auth.or}</span>
            <div className="flex-1 border-t border-[#E8E8EC]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                  {t.auth.fullName}
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  placeholder={t.auth.enterFullName}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                {t.auth.email}
              </label>
              <input
                className={`form-input ${emailTouched && email && !isValidEmail(email) ? 'border-red-400 focus:ring-red-300' : ''}`}
                type="email"
                value={email}
                autoComplete="email"
                onChange={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                placeholder="you@example.com"
                dir="ltr"
                required
              />
              {emailTouched && email && !isValidEmail(email) && (
                <p className="text-[11px] text-red-500 mt-1">
                  {t.auth.invalidEmailFormat}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#4B5563]">
                  {t.auth.password}
                </label>
                {/* Forgot password link — only on login form */}
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPw(true); setError(''); setSuccess(''); }}
                    className="text-[11px] hover:underline transition-colors"
                    style={{ color: '#B8965A' }}
                  >
                    {t.auth.forgotPasswordQuestion}
                  </button>
                )}
              </div>
              <input
                className="form-input"
                type="password"
                value={password}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                dir="ltr"
                required
                minLength={6}
              />
              {/* Password strength — signup only */}
              {isSignUp && password.length > 0 && (
                <div className="mt-1.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${pwStrength >= level ? pwColors[pwStrength] : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-[11px] font-medium ${pwTextColors[pwStrength]}`}>
                    {`${t.auth.passwordStrength}: ${pwLabels[pwStrength]}`}
                  </p>
                </div>
              )}
              {isSignUp && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {t.auth.passwordRecommendation}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center py-2.5 mt-1 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)' }}
            >
              {loading
                ? t.auth.processing
                : isSignUp
                  ? t.auth.createAccount
                  : t.auth.signIn}
            </button>
          </form>

          {/* Toggle login/signup */}
          <div className="text-center mt-5">
            <span className="text-xs text-[#6B7280]">
              {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
            </span>
            {' '}
            <button
              className="text-xs font-medium hover:underline transition-colors"
              style={{ color: '#B8965A' }}
              onClick={() => { setIsSignUp(v => !v); setError(''); setSuccess(''); setPwStrength(0); setEmailTouched(false); setPassword(''); }}
            >
              {isSignUp ? t.auth.signInInstead : t.auth.signUpInstead}
            </button>
          </div>

          <p className="text-center text-[11px] text-[#6B7280] mt-6 leading-relaxed">
            {t.auth.googleButtonNote}
          </p>
        </div>
      </div>
    </div>
  );
}
