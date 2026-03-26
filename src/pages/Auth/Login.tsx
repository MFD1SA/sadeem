// ============================================================================
// SADEEM — Professional Login / Sign-Up Page
// Split-panel design: branding panel (left/top) + form panel (right/bottom).
// Logo is configurable from Admin → Settings → Branding.
// ============================================================================
import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/i18n';
import { authService } from '@/services/auth';
import { supabase } from '@/lib/supabase';
import { getBranding, type BrandingConfig } from '@/services/branding';
import { CheckCircle2, Star, BarChart3, MessageSquare, GitBranch } from 'lucide-react';

// Password strength: 0=empty 1=weak 2=medium 3=strong
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

// Detect auth callback at module load — stable for page lifetime.
// Covers: Google OAuth (?code=) and email confirmation (?token_hash=&type=email).
const _sp = new URLSearchParams(window.location.search);
const isOAuthCallback = _sp.has('code') || _sp.has('error') || _sp.has('token_hash');

// Feature bullets shown on the branding panel
const FEATURES = [
  { icon: Star,           ar: 'ربط Google Business Profile', en: 'Google Business Profile integration' },
  { icon: MessageSquare,  ar: 'ردود تلقائية بالذكاء الاصطناعي', en: 'AI-powered auto-replies'  },
  { icon: BarChart3,      ar: 'تحليلات متقدمة وتقارير ذكية', en: 'Advanced analytics & smart reports' },
  { icon: GitBranch,      ar: 'إدارة جميع فروعك من مكان واحد', en: 'Manage all branches in one place' },
];

export default function Login() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [fullName, setFullName]       = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [isSignUp, setIsSignUp]       = useState(false);
  const [branding, setBranding]       = useState<BrandingConfig | null>(null);
  const [pwStrength, setPwStrength]   = useState(0);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load admin-configured branding (logo, name, tagline)
  useEffect(() => {
    getBranding().then(setBranding).catch(() => {});
  }, []);

  // Email confirmation: if URL has token_hash + type=email, verify the OTP immediately.
  // This handles the case where the confirmation link redirects to /login instead of /auth/callback.
  useEffect(() => {
    const tokenHash = _sp.get('token_hash');
    const type = _sp.get('type');
    if (!tokenHash || type !== 'email') return;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
      .then(({ error }) => {
        if (!error) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login?error=confirmation_failed';
        }
      });
  }, []);

  // PKCE fallback: if SIGNED_IN event was missed (race on fast connections),
  // manually call getSession() after 2 s and redirect if a session is found.
  useEffect(() => {
    if (!isOAuthCallback) return;
    const timer = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) window.location.href = '/dashboard';
      } catch { /* SIGNED_IN will arrive via onAuthStateChange */ }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // ── OAuth callback loading screen ─────────────────────────────────────────
  if (isOAuthCallback) {
    const logoUrl = branding?.logo_icon_url || branding?.logo_full_url || '';
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-lg">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain" />
              : <span className="text-white text-3xl font-bold">س</span>}
          </div>
          <div className="text-white text-base font-semibold mb-1">
            {branding?.platform_name_ar || 'سديم'}
          </div>
          <div className="text-white/70 text-sm mb-6">
            {isAr ? 'جاري تسجيل الدخول…' : 'Signing you in…'}
          </div>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const logoIconUrl = branding?.logo_icon_url || '';
  const logoFullUrl = branding?.logo_full_url || '';
  const platformNameAr = branding?.platform_name_ar || 'سديم';
  const platformNameEn = branding?.platform_name_en || 'SADEEM';
  const tagline = branding?.tagline || (isAr ? 'إدارة تقييمات Google بالذكاء الاصطناعي' : 'AI-Powered Google Reviews Management');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName);
        // Email confirmation may be required — show success message instead of redirect
        setSuccess(isAr
          ? 'تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.'
          : 'Account created! Please check your email to confirm your account.');
        setLoading(false);
      } else {
        await authService.login(email, password);
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      setError((err as Error).message || (isAr ? 'حدث خطأ' : 'An error occurred'));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await authService.loginWithGoogle();
    } catch (err: unknown) {
      setError((err as Error).message || (isAr ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  // Simple email format validator
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

  const pwLabels = isAr
    ? ['', 'ضعيفة', 'متوسطة', 'قوية']
    : ['', 'Weak', 'Medium', 'Strong'];
  const pwColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
  const pwTextColors = ['', 'text-red-600', 'text-amber-600', 'text-emerald-600'];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Left/Top: Branding Panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-10 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

        {/* Logo + Name */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            {logoIconUrl
              ? <img src={logoIconUrl} alt="logo" className="w-7 h-7 object-contain" />
              : <span className="text-white text-xl font-bold">س</span>}
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">{platformNameAr}</div>
            <div className="text-white/50 text-[11px] tracking-widest uppercase">{platformNameEn}</div>
          </div>
        </div>

        {/* Main headline */}
        <div className="relative z-10">
          {logoFullUrl && (
            <img src={logoFullUrl} alt={platformNameAr} className="h-16 mb-8 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-white leading-snug mb-3">
            {isAr ? 'منصة سديم' : 'Sadeem Platform'}
          </h1>
          <p className="text-white/70 text-base mb-8 leading-relaxed">{tagline}</p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, ar, en }) => (
              <div key={ar} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-white/85 text-sm">{isAr ? ar : en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/40 text-xs">
          {isAr ? '© 2026 سديم — جميع الحقوق محفوظة' : '© 2026 Sadeem — All rights reserved'}
        </div>
      </div>

      {/* ── Right/Bottom: Form Panel ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-secondary p-6 sm:p-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo (hidden on desktop) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-lg">
              {logoIconUrl
                ? <img src={logoIconUrl} alt="logo" className="w-9 h-9 object-contain" />
                : <span className="text-white text-2xl font-bold">س</span>}
            </div>
            <h2 className="text-xl font-bold text-content-primary">{platformNameAr}</h2>
            <p className="text-xs text-content-tertiary mt-1 text-center">{tagline}</p>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-content-primary">
              {isSignUp
                ? (isAr ? 'إنشاء حساب جديد' : 'Create your account')
                : (isAr ? 'أهلاً بعودتك' : 'Welcome back')}
            </h2>
            <p className="text-sm text-content-tertiary mt-1">
              {isSignUp
                ? (isAr ? 'أنشئ حسابك لتبدأ الرحلة' : 'Sign up to get started')
                : (isAr ? 'سجّل دخولك للمتابعة' : 'Sign in to continue')}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-white text-content-primary text-sm font-medium hover:bg-surface-secondary transition-colors shadow-sm mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isAr ? 'المتابعة عبر Google' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-content-tertiary">{isAr ? 'أو' : 'or'}</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Email / Password form */}
          <form onSubmit={handleSubmit} className="space-y-3" autoComplete="on">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">
                  {isAr ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1.5">
                {isAr ? 'البريد الإلكتروني' : 'Email'}
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
                  {isAr ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-content-secondary mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
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
              {/* Password strength — only shown in sign-up mode */}
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
                    {isAr ? `قوة كلمة المرور: ${pwLabels[pwStrength]}` : `Password strength: ${pwLabels[pwStrength]}`}
                  </p>
                </div>
              )}
              {isSignUp && (
                <p className="text-[11px] text-content-tertiary mt-1">
                  {isAr ? 'يُنصح باستخدام 8+ أحرف مع أرقام ورموز' : 'Recommended: 8+ chars with numbers & symbols'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 mt-1"
            >
              {loading
                ? (isAr ? 'جاري المعالجة…' : 'Processing…')
                : isSignUp
                  ? (isAr ? 'إنشاء الحساب' : 'Create Account')
                  : (isAr ? 'تسجيل الدخول' : 'Sign In')}
            </button>
          </form>

          {/* Toggle sign-in / sign-up */}
          <div className="text-center mt-5">
            <span className="text-xs text-content-tertiary">
              {isSignUp
                ? (isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?')
                : (isAr ? 'ليس لديك حساب؟' : "Don't have an account?")}
            </span>
            {' '}
            <button
              className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              onClick={() => { setIsSignUp(v => !v); setError(''); setSuccess(''); setPwStrength(0); setEmailTouched(false); setPassword(''); }}
            >
              {isSignUp
                ? (isAr ? 'سجّل دخولك' : 'Sign in')
                : (isAr ? 'أنشئ حساباً' : 'Sign up')}
            </button>
          </div>

          {/* Google account note */}
          <p className="text-center text-[11px] text-content-tertiary mt-6 leading-relaxed">
            {isAr
              ? 'زر Google يستخدم حساب Google المسجّل في المتصفح. لحساب جديد بإيميل مختلف استخدم النموذج أعلاه.'
              : 'The Google button uses your browser\'s signed-in Google account. To register with a different email, use the form above.'}
          </p>
        </div>
      </div>
    </div>
  );
}
