import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLanguage } from '@/i18n';
import { authService } from '@/services/auth';

// During PKCE OAuth exchange, the URL contains ?code= or ?error=.
// Evaluated at module load — stable for the lifetime of the page.
const _sp = new URLSearchParams(window.location.search);
const isOAuthCallback = _sp.has('code') || _sp.has('error');

export default function Login() {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');

  // Show branded loading screen during PKCE exchange — no form flash
  if (isOAuthCallback) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-white text-2xl font-bold">س</span>
          </div>
          <div className="text-sm font-semibold text-content-primary mb-1">سديم</div>
          <div className="text-xs text-content-tertiary mb-5">
            {lang === 'ar' ? 'جاري تسجيل الدخول…' : 'Signing you in…'}
          </div>
          <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName);
      } else {
        await authService.login(email, password);
      }
      // Force redirect — don't wait for auth state propagation
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setError((err as Error).message || t.common.error);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await authService.loginWithGoogle();
    } catch (err: unknown) {
      setError((err as Error).message || t.common.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Premium Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">س</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary mb-1">{t.appName}</h1>
          <p className="text-sm text-content-tertiary">
            {lang === 'ar' ? 'إدارة تقييمات Google بالذكاء الاصطناعي' : 'AI-Powered Google Reviews Management'}
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="btn btn-secondary w-full justify-center mb-4 py-2.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {lang === 'ar' ? 'تسجيل الدخول عبر Google' : 'Sign in with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-2xs text-content-tertiary">{lang === 'ar' ? 'أو' : 'or'}</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3 mb-4">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="mb-3">
                  <label className="form-label">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={fullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label">{lang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center py-2.5" disabled={loading}>
                {loading ? t.common.loading : isSignUp
                  ? (lang === 'ar' ? 'إنشاء حساب' : 'Sign Up')
                  : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center mt-4">
              <button
                className="text-xs text-brand-600 hover:underline"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              >
                {isSignUp
                  ? (lang === 'ar' ? 'لديك حساب؟ سجل دخولك' : 'Have an account? Sign in')
                  : (lang === 'ar' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'No account? Sign up')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
