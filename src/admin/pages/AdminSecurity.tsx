// ============================================================================
// SADEEM Admin — Security Page (with 2FA enrollment)
// Uses Supabase Auth MFA: auth.mfa.enroll / verify / unenroll
// ============================================================================

import { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSupabase } from '../services/adminSupabase';
import { Lock, Shield, Eye, EyeOff, Save, Smartphone, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminSecurity() {
  const { user, changePassword } = useAdminAuth();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 2FA state
  const [mfaStep, setMfaStep] = useState<'idle' | 'enrolling' | 'verify'>('idle');
  const [qrUri, setQrUri] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Password strength indicator
  const pwStrength = (() => {
    if (newPassword.length === 0) return { level: 0, label: '', color: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 1) return { level: 1, label: 'ضعيفة', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'مقبولة', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'جيدة', color: 'bg-blue-500' };
    return { level: 4, label: 'قوية', color: 'bg-emerald-500' };
  })();

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg({ text: 'يرجى ملء جميع الحقول', type: 'error' }); return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ text: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', type: 'error' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ text: 'كلمة المرور الجديدة غير متطابقة', type: 'error' }); return;
    }

    setPwSaving(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      setPwMsg({ text: 'تم تغيير كلمة المرور بنجاح', type: 'success' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPwMsg({ text: err instanceof Error ? err.message : 'فشل تغيير كلمة المرور', type: 'error' });
    } finally { setPwSaving(false); }
  };

  // ─── 2FA enrollment ───
  const startEnroll = async () => {
    setMfaLoading(true); setMfaError('');
    try {
      const { data, error } = await adminSupabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SADEEM Admin TOTP' });
      if (error) throw error;
      if (data?.totp?.qr_code && data?.totp?.secret && data?.id) {
        setQrUri(data.totp.qr_code);
        setMfaSecret(data.totp.secret);
        setMfaFactorId(data.id);
        setMfaStep('verify');
      } else {
        throw new Error('MFA enrollment returned incomplete data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل بدء تفعيل 2FA';
      if (msg.includes('not supported') || msg.includes('not enabled')) {
        setMfaError('المصادقة الثنائية غير مفعّلة في إعدادات Supabase. يرجى تفعيل MFA من لوحة Supabase أولاً.');
      } else {
        setMfaError(msg);
      }
    } finally { setMfaLoading(false); }
  };

  const verifyEnroll = async () => {
    if (mfaCode.length !== 6) { setMfaError('الرمز يجب أن يكون 6 أرقام'); return; }
    setMfaLoading(true); setMfaError('');
    try {
      const { data: challenge, error: chErr } = await adminSupabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (chErr) throw chErr;

      const { error: vErr } = await adminSupabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challenge.id, code: mfaCode });
      if (vErr) throw vErr;

      // Update admin_users record
      await adminSupabase.from('admin_users').update({ two_factor_enabled: true }).eq('id', user?.id);

      setMfaStep('idle'); setMfaCode('');
      setPwMsg({ text: 'تم تفعيل المصادقة الثنائية بنجاح', type: 'success' });
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'فشل التحقق — تأكد من الرمز');
    } finally { setMfaLoading(false); }
  };

  const cancelEnroll = async () => {
    if (mfaFactorId) {
      try { await adminSupabase.auth.mfa.unenroll({ factorId: mfaFactorId }); } catch { /* ignore */ }
    }
    setMfaStep('idle'); setQrUri(''); setMfaSecret(''); setMfaFactorId(''); setMfaCode(''); setMfaError('');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">الأمان</h1>
        <p className="text-sm text-slate-400">إدارة كلمة المرور والمصادقة الثنائية</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Force password reset warning */}
        {user?.force_password_reset && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl p-3.5">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>يجب تغيير كلمة المرور الحالية لأسباب أمنية قبل استخدام النظام.</span>
          </div>
        )}

        {pwMsg && (
          <div className={`text-xs rounded-lg p-3 ${
            pwMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{pwMsg.text}</div>
        )}

        {/* ─── Password change ─── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="flex items-center gap-2"><Lock size={16} className="text-slate-400" /><h3>تغيير كلمة المرور</h3></div>
          </div>
          <div className="admin-card-body space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور الحالية</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)} className="admin-form-input pl-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">كلمة المرور الجديدة</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} className="admin-form-input pl-10" autoComplete="new-password" minLength={8} />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : 'bg-transparent'}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">{pwStrength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">تأكيد كلمة المرور الجديدة</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="admin-form-input" autoComplete="new-password" />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-400 mt-1">كلمة المرور غير متطابقة</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleChangePassword} disabled={pwSaving} className="admin-btn-primary">
                <Save size={16} /><span>{pwSaving ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2FA ─── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="flex items-center gap-2"><Shield size={16} className="text-slate-400" /><h3>المصادقة الثنائية (2FA)</h3></div>
          </div>
          <div className="admin-card-body">
            {mfaStep === 'idle' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    user?.two_factor_enabled ? 'bg-emerald-500/10' : 'bg-slate-700/50'}`}>
                    <Smartphone size={18} className={user?.two_factor_enabled ? 'text-emerald-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">
                      {user?.two_factor_enabled ? 'المصادقة الثنائية مفعّلة' : 'المصادقة الثنائية غير مفعّلة'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.two_factor_enabled
                        ? 'حسابك محمي بطبقة أمان إضافية'
                        : 'أضف حماية إضافية عبر تطبيق المصادقة'}
                    </p>
                  </div>
                </div>
                {!user?.two_factor_enabled && (
                  <button onClick={startEnroll} disabled={mfaLoading} className="admin-btn-primary text-sm">
                    {mfaLoading ? 'جاري التحميل...' : 'تفعيل'}
                  </button>
                )}
              </div>
            )}

            {mfaStep === 'verify' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">تفعيل المصادقة الثنائية</h4>
                  <button onClick={cancelEnroll} className="text-slate-500 hover:text-white"><X size={16} /></button>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-3">1. امسح رمز QR بتطبيق المصادقة (Google Authenticator أو Authy)</p>
                  {qrUri && (
                    <div className="flex justify-center mb-3">
                      <img src={qrUri} alt="QR Code" className="w-44 h-44 rounded-lg" />
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mb-1">أو أدخل الرمز يدويًا:</p>
                  <code className="block text-xs text-cyan-400 bg-black/30 rounded-lg p-2 font-mono break-all select-all" dir="ltr">{mfaSecret}</code>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">2. أدخل الرمز المكوّن من 6 أرقام</p>
                  <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="admin-form-input text-center text-lg font-mono tracking-[0.3em]" dir="ltr" maxLength={6} placeholder="000000" autoFocus />
                </div>

                {mfaError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">{mfaError}</div>
                )}

                <div className="flex justify-end gap-2">
                  <button onClick={cancelEnroll} className="admin-btn-secondary text-sm">إلغاء</button>
                  <button onClick={verifyEnroll} disabled={mfaLoading || mfaCode.length !== 6} className="admin-btn-primary text-sm">
                    {mfaLoading ? 'جاري التحقق...' : 'تفعيل المصادقة'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security info */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>معلومات الأمان</h3></div>
          <div className="admin-card-body space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">آخر تغيير لكلمة المرور</span>
              <span className="text-slate-300">{user?.password_changed_at ? new Date(user.password_changed_at).toLocaleDateString('ar-SA') : 'لم يتم التغيير بعد'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">محاولات الدخول الفاشلة</span>
              <span className="text-slate-300">{user?.failed_login_attempts || 0}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">المصادقة الثنائية</span>
              <span className="flex items-center gap-1.5">
                {user?.two_factor_enabled
                  ? <><CheckCircle size={13} className="text-emerald-400" /><span className="text-emerald-400">مفعّلة</span></>
                  : <span className="text-slate-500">غير مفعّلة</span>}
              </span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
