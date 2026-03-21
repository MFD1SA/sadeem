// ============================================================================
// SADEEM Admin — Login Page
// Independent from subscriber login (src/pages/Auth/Login.tsx).
// Wrapped in AdminAuthProvider via the route setup, not here.
// ============================================================================

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '../contexts/AdminAuthContext';
import { RedirectIfAdminAuthenticated } from '../guards';
import { ADMIN_ROUTES } from '../utils/constants';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

function AdminLoginForm() {
  const { login, isLoading, error } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      await login({ email, password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ADMIN_ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch {
      // Error is set in context
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#060a13] flex items-center justify-center p-4" dir="rtl">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">SADEEM Admin</h1>
          <p className="text-sm text-slate-500">مركز التحكم الإداري</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1322] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3 mb-4">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-form-input"
                placeholder="admin@sadeem.app"
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-form-input pl-10"
                  placeholder="••••••••"
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
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري التحقق...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          هذه لوحة التحكم الإدارية. الوصول مقيّد للمشرفين فقط.
        </p>
      </div>
    </div>
  );
}

/**
 * AdminLogin — wraps itself in AdminAuthProvider + RedirectIfAdminAuthenticated.
 * This is the only admin page that's NOT inside AdminLayout.
 */
export default function AdminLogin() {
  return (
    <AdminAuthProvider>
      <RedirectIfAdminAuthenticated>
        <AdminLoginForm />
      </RedirectIfAdminAuthenticated>
    </AdminAuthProvider>
  );
}
