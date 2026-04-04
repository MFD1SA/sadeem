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
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl" style={{ background: '#F8F9FB' }}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(184,150,90,0.04) 0%, transparent 50%, rgba(184,150,90,0.03) 100%)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px]" style={{ background: 'rgba(184,150,90,0.06)' }} />
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
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)', boxShadow: '0 10px 25px rgba(184,150,90,0.2)' }}>
                  <ShieldCheck size={30} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md flex items-center justify-center shadow-lg" style={{ background: '#1A1A2E' }}>
                  <Fingerprint size={11} className="text-white" />
                </div>
              </>
            )}
          </div>
          <h1 className="text-[22px] font-bold mb-2 tracking-tight" style={{ color: '#1A1A2E' }}>
            {branding?.platform_name_ar || 'سيندا'} <span style={{ color: '#B8965A' }} className="font-light">|</span> <span className="font-medium text-lg" style={{ color: '#4B5563' }}>لوحة الإدارة</span>
          </h1>
          <p className="text-[13px] leading-relaxed max-w-[280px] mx-auto" style={{ color: '#6B7280' }}>
            {branding?.tagline || 'مركز التحكم المركزي لإدارة المنصة والمشتركين والعمليات'}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E8E8EC', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Card header accent */}
          <div className="h-[2px]" style={{ background: 'linear-gradient(to right, transparent, #B8965A, transparent)' }} />

          <div className="p-6">
            {displayError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3.5 mb-5">
                <ShieldCheck size={15} className="flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium mb-2" style={{ color: '#4B5563' }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-form-input text-[13px]"
                  style={{ background: '#F8F9FB', border: '1px solid #E8E8EC', color: '#1A1A2E' }}
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="mb-7">
                <label className="block text-xs font-medium mb-2" style={{ color: '#4B5563' }}>كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="admin-form-input pl-10 text-[13px]"
                    style={{ background: '#F8F9FB', border: '1px solid #E8E8EC', color: '#1A1A2E' }}
                    placeholder="أدخل كلمة المرور"
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#6B7280' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #B8965A, #D4AF6A)', boxShadow: '0 4px 15px rgba(184,150,90,0.2)' }}
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
          <p className="text-[11px] leading-relaxed" style={{ color: '#6B7280' }}>
            الوصول مقيّد للمشرفين المعتمدين فقط
          </p>
          <p className="text-[10px] mt-1" style={{ color: '#9CA3AF' }}>
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
