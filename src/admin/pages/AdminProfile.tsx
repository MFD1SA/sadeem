// ============================================================================
// SADEEM Admin — Profile Page (Foundation)
// ============================================================================

import { useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { UserCircle, Save } from 'lucide-react';

export default function AdminProfile() {
  const { user, updateProfile } = useAdminAuth();
  const [nameAr, setNameAr] = useState(user?.full_name_ar || '');
  const [nameEn, setNameEn] = useState(user?.full_name_en || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateProfile({
        full_name_ar: nameAr.trim(),
        full_name_en: nameEn.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setMessage('تم حفظ التعديلات بنجاح');
      setMessageType('success');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'فشل الحفظ');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">الملف الشخصي</h1>
        <p className="text-sm text-slate-400">إدارة معلوماتك الشخصية</p>
      </div>

      <div className="max-w-2xl">
        {/* Avatar + basic info */}
        <div className="admin-card mb-4">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {user?.full_name_ar?.charAt(0) || 'م'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{user?.full_name_ar}</h2>
                <p className="text-sm text-slate-400">{user?.email}</p>
                <p className="text-xs text-cyan-400 mt-0.5">
                  {user?.is_super_admin ? 'مدير عام النظام' : user?.role?.display_name_ar}
                </p>
              </div>
            </div>

            {message && (
              <div className={`text-xs rounded-lg p-3 mb-4 ${
                messageType === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {message}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالعربي</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="admin-form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالإنجليزي</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="admin-form-input"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="admin-form-input opacity-50 cursor-not-allowed"
                  disabled
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-600 mt-1">لا يمكن تغيير البريد الإلكتروني من هنا</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم الهاتف</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="admin-form-input"
                  dir="ltr"
                  placeholder="+966..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="admin-btn-primary"
              >
                <Save size={16} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>معلومات الحساب</h3>
          </div>
          <div className="admin-card-body">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ الإنشاء</span>
                <span className="text-slate-300">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">آخر تسجيل دخول</span>
                <span className="text-slate-300">
                  {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ar-SA') : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">المصادقة الثنائية</span>
                <span className={user?.two_factor_enabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {user?.two_factor_enabled ? 'مفعّلة' : 'غير مفعّلة'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
