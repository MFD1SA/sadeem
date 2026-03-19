import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizations';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Tabs } from '@/components/ui/Tabs';
import { Toggle } from '@/components/ui/Toggle';
import { Shield, Camera } from 'lucide-react';

export default function Settings() {
  const { t, lang, setLanguage } = useLanguage();
  const { organization, profile, user, refreshProfile, refreshOrganization, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState('organization');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Org form
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgCity, setOrgCity] = useState('');

  // Profile form
  const [fullName, setFullName] = useState('');

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Detect if logged in via Google (email should be read-only)
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      const provider = data?.session?.user?.app_metadata?.provider;
      setIsGoogleUser(provider === 'google');
    });
  }, []);

  // Policy settings (stored in org metadata or separate table — for now in local state)
  const [autoReplyFirstOnly, setAutoReplyFirstOnly] = useState(true);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgIndustry(organization.industry || '');
      setOrgCity(organization.city || '');
    }
    if (profile) {
      setFullName(profile?.full_name || '');
    }
  }, [organization, profile]);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setMessage('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `avatars/${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('users').update({ avatar_url: publicUrl } as Record<string, unknown>).eq('id', user.id);
      await refreshProfile();
      setMessage(lang === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Avatar updated successfully');
    } catch (err: unknown) {
      setMessage((err as Error).message || (lang === 'ar' ? 'فشل رفع الصورة' : 'Upload failed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    setSaving(true);
    setMessage('');
    try {
      await organizationService.updateOrganization(organization.id, {
        name: orgName,
        industry: orgIndustry,
        city: orgCity,
      });
      await refreshOrganization();
      setMessage(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err: unknown) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      await supabase.from('users').update({ full_name: fullName } as Record<string, unknown>).eq('id', user.id);
      await refreshProfile();
      setMessage(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err: unknown) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <LoadingState message={lang === 'ar' ? 'جاري تحميل الإعدادات...' : 'Loading settings...'} />;
  if (!organization) return <div className="p-6 text-center text-content-secondary">{lang === 'ar' ? 'لا يوجد نشاط تجاري' : 'No organization found'}</div>;

  const tabs = [
    { id: 'organization', label: lang === 'ar' ? 'النشاط التجاري' : 'Organization' },
    { id: 'profile', label: t.topbar.profile },
    { id: 'policy', label: lang === 'ar' ? 'سياسة الردود' : 'Reply Policy' },
    { id: 'general', label: t.settingsPage.general },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.settingsPage.title}</h3>
      </div>
      <div className="px-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>
      <div className="card-body">
        {message && (
          <div className={`text-xs rounded-md p-3 mb-4 ${message.includes('نجاح') || message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Organization tab */}
        {tab === 'organization' && (
          <div className="max-w-xl space-y-4">
            <div>
              <label className="form-label">{lang === 'ar' ? 'اسم النشاط' : 'Business Name'}</label>
              <input className="form-input" value={orgName} onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{lang === 'ar' ? 'القطاع' : 'Industry'}</label>
                <input className="form-input" value={orgIndustry} onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgIndustry(e.target.value)} />
              </div>
              <div>
                <label className="form-label">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                <input className="form-input" value={orgCity} onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgCity(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">{lang === 'ar' ? 'الدولة' : 'Country'}</label>
              <input className="form-input bg-surface-secondary" value={organization?.country || 'SA'} disabled />
            </div>
            <div>
              <label className="form-label">Slug</label>
              <input className="form-input bg-surface-secondary" value={organization?.slug || ''} disabled />
            </div>
            <button className="btn btn-primary" onClick={handleSaveOrg} disabled={saving}>
              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group">
                {profile?.avatar_url ? (
                  <img src={profile?.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold">
                    {fullName.charAt(0) || '?'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                >
                  <Camera size={18} className="text-white" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <div className="text-sm font-semibold text-content-primary">{profile?.email || ''}</div>
                <div className="text-2xs text-content-tertiary">{t.roles[(profile?.role || 'staff') as 'owner' | 'manager' | 'staff'] || profile?.role || ''}</div>
                {isGoogleUser && (
                  <div className="text-2xs text-brand-500 mt-0.5">{lang === 'ar' ? 'حساب Google' : 'Google account'}</div>
                )}
              </div>
            </div>
            <div>
              <label className="form-label">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
              <input className="form-input" value={fullName} onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input
                className="form-input bg-surface-secondary"
                value={profile?.email || ''}
                disabled
                title={isGoogleUser ? (lang === 'ar' ? 'لا يمكن تغيير البريد لحسابات Google' : 'Email cannot be changed for Google accounts') : ''}
              />
              {isGoogleUser && (
                <p className="text-2xs text-content-tertiary mt-1">
                  {lang === 'ar' ? 'البريد مرتبط بحساب Google ولا يمكن تعديله' : 'Email is linked to Google account and cannot be changed'}
                </p>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? t.common.loading : t.common.save}
            </button>
          </div>
        )}

        {/* Reply Policy tab */}
        {tab === 'policy' && (
          <div className="max-w-xl">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-blue-800 mb-1">
                  {lang === 'ar' ? 'سياسة ردود سديم' : 'Sadeem Reply Policy'}
                </div>
                <div className="text-xs text-blue-700 leading-relaxed">
                  {lang === 'ar'
                    ? 'سديم ترد مرة واحدة فقط على التقييم الأول من كل عميل. إذا كتب العميل تعليقاً ثانياً، يتم إيقاف الرد الآلي وتتحول الحالة إلى "مراجعة يدوية مطلوبة". هذا يمنع الردود المتكررة ويحافظ على احترافية التواصل.'
                    : 'Sadeem replies once to the first review from each customer. If a customer posts a follow-up, auto-reply is disabled and the status changes to "Manual Review Required". This prevents repetitive replies and maintains professional communication.'}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="text-sm font-medium text-content-primary">
                    {lang === 'ar' ? 'الرد التلقائي على أول تقييم فقط' : 'Auto-reply first review only'}
                  </div>
                  <div className="text-2xs text-content-tertiary mt-0.5">
                    {lang === 'ar' ? 'مفعّل افتراضياً — قاعدة سديم الأساسية' : 'Enabled by default — core Sadeem rule'}
                  </div>
                </div>
                <Toggle value={autoReplyFirstOnly} onChange={setAutoReplyFirstOnly} />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="text-sm font-medium text-content-primary">
                    {lang === 'ar' ? 'التقييمات المتكررة → مراجعة يدوية' : 'Follow-up reviews → Manual review'}
                  </div>
                  <div className="text-2xs text-content-tertiary mt-0.5">
                    {lang === 'ar' ? 'عند تكرار تقييم من نفس العميل' : 'When same customer posts again'}
                  </div>
                </div>
                <Toggle value={true} disabled />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="text-sm font-medium text-content-primary">
                    {lang === 'ar' ? 'إظهار قوالب الردود في المراجعة اليدوية' : 'Show templates in manual review'}
                  </div>
                  <div className="text-2xs text-content-tertiary mt-0.5">
                    {lang === 'ar' ? 'اقتراح قوالب عند الرد يدوياً' : 'Suggest templates during manual reply'}
                  </div>
                </div>
                <Toggle value={true} disabled />
              </div>
            </div>
          </div>
        )}

        {/* General tab */}
        {tab === 'general' && (
          <div className="max-w-xl space-y-4">
            <div>
              <label className="form-label">{t.settingsPage.language}</label>
              <select
                className="form-select w-48"
                value={lang}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as 'ar' | 'en')}
              >
                <option value="ar">{t.settingsPage.arabic}</option>
                <option value="en">{t.settingsPage.english}</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
