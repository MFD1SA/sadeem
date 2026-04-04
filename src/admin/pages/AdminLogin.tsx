// ============================================================================
// SENDA Admin — Login Page (Enterprise Upgrade)
// ============================================================================

import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { RedirectIfAdminAuthenticated } from '../guards';
import { ADMIN_ROUTES } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { ShieldCheck, Eye, EyeOff, Fingerprint } from 'lucide-react';

function AdminLoginForm() {
  const { login, isLoading, error } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  useEffect(() => {
    document.title = 'سيندا — مركز الإدارة والتحكم';
    adminSettingsService.getBranding().then(setBranding).catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('يرجى إدخال بيانات الاعتماد للمتابعة');
      return;
    }

    try {
      await login({ email, password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ADMIN_ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch {
      // Error handled in context
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center p-4" dir="rtl">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/15" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[380px]">
        {/* Brand block — uses branding from DB when available */}
        <div className="text-center mb-10">
          <div className="relative inline-flex mb-5">
            {branding?.logo_full_url ? (
              <img src={branding.logo_full_url} alt={branding.platform_name_ar} className="h-14 max-w-[200px] object-contain" />
            ) : branding?.logo_icon_url ? (
              <img src={branding.logo_icon_url} alt={branding.platform_name_ar} className="w-16 h-16 rounded-2xl object-contain" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20">
                  <ShieldCheck size={30} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md bg-emerald-500 flex items-center justify-center shadow-lg">
                  <Fingerprint size={11} className="text-white" />
                </div>
              </>
            )}
          </div>
          <h1 className="text-[22px] font-bold text-white mb-2 tracking-tight">
            {branding?.platform_name_ar || 'سيندا'} <span className="text-cyan-400 font-light">|</span> <span className="text-slate-300 font-medium text-lg">لوحة الإدارة</span>
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-[280px] mx-auto">
            {branding?.tagline || 'مركز التحكم المركزي لإدارة المنصة والمشتركين والعمليات'}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-[#0d1322]/90 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
          {/* Card header accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <div className="p-6">
            {displayError && (
              <div className="flex items-start gap-2.5 bg-red-500/8 border border-red-500/15 text-red-400 text-xs rounded-xl p-3.5 mb-5">
                <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-form-input text-[13px]"
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="mb-7">
                <label className="block text-xs font-medium text-slate-400 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="admin-form-input pl-10 text-[13px]"
                    placeholder="أدخل كلمة المرور"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/15 active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري التحقق من الهوية...
                  </span>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            الوصول مقيّد للمشرفين المعتمدين فقط
          </p>
          <p className="text-[10px] text-slate-700 mt-1">
            سيندا — منصة إدارة التقييمات بالذكاء الاصطناعي
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <AdminAuthProvider>
      <RedirectIfAdminAuthenticated>
        <AdminLoginForm />
      </RedirectIfAdminAuthenticated>
    </AdminAuthProvider>
  );
}
