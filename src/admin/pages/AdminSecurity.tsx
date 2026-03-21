// ============================================================================
// SADEEM Admin — Security Page (Foundation)
// ============================================================================

import { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Lock, Shield, Eye, EyeOff, Save } from 'lucide-react';

export default function AdminSecurity() {
  const { user, changePassword } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleChangePassword = async () => {
    setMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('يرجى ملء جميع الحقول');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('كلمة المرور الجديدة غير متطابقة');
      setMessageType('error');
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setMessage('تم تغيير كلمة المرور بنجاح');
      setMessageType('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'فشل تغيير كلمة المرور');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">الأمان</h1>
        <p className="text-sm text-slate-400">إدارة كلمة المرور وإعدادات الأمان</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Change password */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <h3>تغيير كلمة المرور</h3>
            </div>
          </div>
          <div className="admin-card-body">
            {user?.force_password_reset && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg p-3 mb-4">
                يجب تغيير كلمة المرور الحالية لأسباب أمنية.
              </div>
            )}

            {message && (
              <div className={`text-xs rounded-lg p-3 mb-4 ${
                messageType === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="admin-form-input pl-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-form-input pl-10"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">8 أحرف على الأقل</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="admin-form-input"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="admin-btn-primary"
              >
                <Save size={16} />
                <span>{saving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2FA readiness */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-slate-400" />
              <h3>المصادقة الثنائية (2FA)</h3>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300 mb-1">
                  {user?.two_factor_enabled ? 'المصادقة الثنائية مفعّلة' : 'المصادقة الثنائية غير مفعّلة'}
                </p>
                <p className="text-xs text-slate-500">
                  أضف طبقة حماية إضافية لحسابك
                </p>
              </div>
              <button className="admin-btn-secondary text-sm" disabled title="سيتم تفعيلها في المراحل التالية">
                {user?.two_factor_enabled ? 'إدارة' : 'تفعيل'}
              </button>
            </div>
          </div>
        </div>

        {/* Password info */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>معلومات الأمان</h3>
          </div>
          <div className="admin-card-body">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">آخر تغيير لكلمة المرور</span>
                <span className="text-slate-300">
                  {user?.password_changed_at
                    ? new Date(user.password_changed_at).toLocaleDateString('ar-SA')
                    : 'لم يتم التغيير بعد'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">محاولات الدخول الفاشلة</span>
                <span className="text-slate-300">{user?.failed_login_attempts || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
