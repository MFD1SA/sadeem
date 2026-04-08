// ============================================================================
// SENDA Admin — Login Page
// Centered card · Logo above · Teal accent · Light theme
// ============================================================================

import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { RedirectIfAdminAuthenticated } from '../guards';
import { ADMIN_ROUTES } from '../utils/constants';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" dir="rtl">
      <div className="w-full max-w-[380px]">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <img
            src="/senda-logo.png"
            alt="SENDA"
            className="h-12 mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            {branding?.platform_name_ar || 'سيندا'} <span className="text-blue-600 font-light">|</span> <span className="font-medium text-base text-slate-500">لوحة الإدارة</span>
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            {branding?.tagline || 'مركز التحكم المركزي لإدارة المنصة والمشتركين والعمليات'}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Card header accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

          <div className="p-6">
            {displayError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-5">
                <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium mb-2 text-slate-600">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="mb-7">
                <label className="block text-xs font-medium mb-2 text-slate-600">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="أدخل كلمة المرور"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
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
          <p className="text-[11px] text-slate-400 leading-relaxed">الوصول مقيّد للمشرفين المعتمدين فقط</p>
          <p className="text-[10px] text-slate-300 mt-1">سيندا — منصة إدارة التقييمات بالذكاء الاصطناعي</p>
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
