// ============================================================================
// SADEEM — Reset Password Page
// Reached after clicking the password-reset email link.
// Supabase verifyOtp (type=recovery) in AuthCallback creates the session,
// then redirects here. The user enters a new password and it is applied.
// ============================================================================
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { CheckCircle2 } from 'lucide-react';

function calcPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s <= 1 ? 1 : s <= 3 ? 2 : 3;
}

export default function ResetPassword() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const pwLabels    = isAr ? ['', 'ضعيفة', 'متوسطة', 'قوية'] : ['', 'Weak', 'Medium', 'Strong'];
  const pwColors    = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
  const pwTextColors = ['', 'text-red-600', 'text-amber-600', 'text-emerald-600'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      // Redirect to dashboard after short delay
      setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || (isAr ? 'حدث خطأ. يرجى المحاولة مجدداً.' : 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-lg">
            <span className="text-white text-2xl font-bold">س</span>
          </div>
          <h1 className="text-xl font-bold text-content-primary">
            {isAr ? 'تعيين كلمة مرور جديدة' : 'Set a new password'}
          </h1>
          <p className="text-xs text-content-tertiary mt-1 text-center">
            {isAr ? 'أدخل كلمة المرور الجديدة لحسابك' : 'Enter a new password for your account'}
          </p>
        </div>

        {/* Success */}
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-4 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2" />
            <p className="font-semibold">
              {isAr ? 'تم تغيير كلمة المرور بنجاح! ✅' : 'Password changed successfully! ✅'}
            </p>
            <p className="text-xs mt-1 text-emerald-600">
              {isAr ? 'جاري توجيهك إلى لوحة التحكم…' : 'Redirecting to dashboard…'}
            </p>
          </div>
        ) : (
          <div className="card card-body">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">
                  {isAr ? 'كلمة المرور الجديدة' : 'New password'}
                </label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    setPwStrength(calcPasswordStrength(e.target.value));
                  }}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                  minLength={6}
                />
                {password.length > 0 && (
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
                      {isAr ? `قوة كلمة المرور: ${pwLabels[pwStrength]}` : `Strength: ${pwLabels[pwStrength]}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}
                </label>
                <input
                  className={`form-input ${confirm && password !== confirm ? 'border-red-400' : ''}`}
                  type="password"
                  value={confirm}
                  autoComplete="new-password"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
                {confirm && password !== confirm && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (!!confirm && password !== confirm)}
                className="btn btn-primary w-full justify-center py-2.5"
              >
                {loading
                  ? (isAr ? 'جاري الحفظ…' : 'Saving…')
                  : (isAr ? 'حفظ كلمة المرور الجديدة' : 'Save new password')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
