// ============================================================================
// SENDA Admin — Profile Page (with Avatar Upload)
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSupabase } from '../services/adminSupabase';
import { Save, Camera, User } from 'lucide-react';

export default function AdminProfile() {
  const { user, updateProfile, refreshUser } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = 'سيندا — الملف الشخصي'; }, []);

  const [nameAr, setNameAr] = useState(user?.full_name_ar || '');
  const [nameEn, setNameEn] = useState(user?.full_name_en || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const msgTimer = useRef<ReturnType<typeof setTimeout>>();
  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 4000);
  };
  useEffect(() => () => { if (msgTimer.current) clearTimeout(msgTimer.current); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name_ar: nameAr.trim(),
        full_name_en: nameEn.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      showMsg('تم حفظ التعديلات بنجاح', 'success');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showMsg('حجم الصورة يجب ألا يتجاوز 2 ميغابايت', 'error');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `admin-avatars/${user.id}.${ext}`;

      const { error: upErr } = await adminSupabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        // If bucket doesn't exist, show helpful message
        if (upErr.message?.includes('not found') || upErr.message?.includes('Bucket')) {
          showMsg('يجب إنشاء bucket "avatars" في Supabase Storage أولاً', 'error');
          return;
        }
        throw upErr;
      }

      const { data: urlData } = adminSupabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Update admin_users.avatar_url (self-update allowed by RLS)
      await adminSupabase
        .from('admin_users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      await refreshUser();
      showMsg('تم تحديث صورة العرض', 'success');
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'فشل رفع الصورة', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const avatarUrl = user?.avatar_url;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">الملف الشخصي</h1>
        <p className="text-sm text-slate-400">إدارة معلوماتك الشخصية وصورة العرض</p>
      </div>

      {msg && (
        <div className={`text-xs rounded-lg p-3 mb-4 max-w-2xl ${
          msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{msg.text}</div>
      )}

      <div className="max-w-2xl space-y-4">
        {/* Avatar + identity card */}
        <div className="admin-card">
          <div className="p-6">
            <div className="flex items-center gap-5 mb-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-bold">{user?.full_name_ar?.charAt(0) || 'م'}</span>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -left-1 w-7 h-7 rounded-lg bg-[#111827] border border-white/[0.1] flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors shadow-lg"
                >
                  {uploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-white truncate">{user?.full_name_ar}</h2>
                <p className="text-sm text-slate-400 truncate" dir="ltr">{user?.email}</p>
                <p className="text-xs text-cyan-400 mt-1">
                  {user?.is_super_admin ? 'مدير عام النظام' : user?.role?.display_name_ar}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالعربي</label>
                  <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="admin-form-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم بالإنجليزي</label>
                  <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="admin-form-input" dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">البريد الإلكتروني</label>
                  <input type="email" value={user?.email || ''} className="admin-form-input opacity-50 cursor-not-allowed" disabled dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم الهاتف</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-form-input" dir="ltr" placeholder="+966..." />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
                <Save size={16} />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>معلومات الحساب</h3></div>
          <div className="admin-card-body space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">تاريخ الإنشاء</span>
              <span className="text-slate-300">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">آخر تسجيل دخول</span>
              <span className="text-slate-300">{user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">المصادقة الثنائية</span>
              <span className={user?.two_factor_enabled ? 'text-emerald-400' : 'text-slate-500'}>{user?.two_factor_enabled ? 'مفعّلة' : 'غير مفعّلة'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
