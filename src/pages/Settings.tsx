import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizations';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Tabs } from '@/components/ui/Tabs';
import { Toggle } from '@/components/ui/Toggle';
import { Shield, Camera, Building2, UserCircle2, Globe2, Save } from 'lucide-react';

export default function Settings() {
  const { t, lang, setLanguage } = useLanguage();
  const {
    organization,
    profile,
    user,
    refreshProfile,
    refreshOrganization,
    isLoading: authLoading,
  } = useAuth();

  const [tab, setTab] = useState('organization');

  const [orgSaving, setOrgSaving] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [policySaving, setPolicySaving] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');

  const [generalMessage, setGeneralMessage] = useState('');

  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgCity, setOrgCity] = useState('');

  const [fullName, setFullName] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [autoReplyFirstOnly, setAutoReplyFirstOnly] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: any }) => {
      const provider = data?.session?.user?.app_metadata?.provider;
      setIsGoogleUser(provider === 'google');
    });
  }, []);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setOrgIndustry(organization.industry || '');
      setOrgCity(organization.city || '');
    }

    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [organization, profile]);

  useEffect(() => {
    setOrgMessage('');
    setProfileMessage('');
    setPolicyMessage('');
    setGeneralMessage('');
  }, [tab]);

  const isSuccessMessage = (msg: string) =>
    msg.includes('نجاح') ||
    msg.includes('success') ||
    msg.includes('تم') ||
    msg.includes('updated') ||
    msg.includes('saved');

  const renderMessage = (msg: string) => {
    if (!msg) return null;

    return (
      <div
        className={`mb-5 rounded-2xl border px-4 py-3 text-xs sm:text-sm ${
          isSuccessMessage(msg)
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        {msg}
      </div>
    );
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    setProfileMessage('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket')) {
          throw new Error(lang === 'ar' ? 'خدمة رفع الصور غير مهيأة بعد. تواصل مع الدعم.' : 'Image upload service not configured. Contact support.');
        }
        throw upErr;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl } as Record<string, unknown>)
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      await refreshProfile();
      setProfileMessage(lang === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Avatar updated successfully');
    } catch (err: unknown) {
      setProfileMessage((err as Error).message || (lang === 'ar' ? 'فشل رفع الصورة' : 'Upload failed'));
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveOrg = async () => {
    if (!organization) return;

    setOrgSaving(true);
    setOrgMessage('');

    try {
      await organizationService.updateOrganization(organization.id, {
        name: orgName,
        industry: orgIndustry,
        city: orgCity,
      });

      await refreshOrganization();
      setOrgMessage(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err: unknown) {
      setOrgMessage((err as Error).message || (lang === 'ar' ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setProfileSaving(true);
    setProfileMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName } as Record<string, unknown>)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setProfileMessage(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err: unknown) {
      setProfileMessage((err as Error).message || (lang === 'ar' ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePolicy = async () => {
    setPolicySaving(true);
    setPolicyMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setPolicyMessage(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
    } catch (err: unknown) {
      setPolicyMessage((err as Error).message || (lang === 'ar' ? 'فشل الحفظ' : 'Save failed'));
    } finally {
      setPolicySaving(false);
    }
  };

  if (authLoading) {
    return <LoadingState message={lang === 'ar' ? 'جاري تحميل الإعدادات...' : 'Loading settings...'} />;
  }

  if (!organization) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center text-content-secondary shadow-sm">
        {lang === 'ar' ? 'لا يوجد نشاط تجاري' : 'No organization found'}
      </div>
    );
  }

  const tabs = [
    { id: 'organization', label: lang === 'ar' ? 'النشاط التجاري' : 'Organization' },
    { id: 'profile', label: t.topbar.profile },
    { id: 'policy', label: lang === 'ar' ? 'سياسة الردود' : 'Reply Policy' },
    { id: 'general', label: t.settingsPage.general },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-white px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-content-primary sm:text-xl">
              {t.settingsPage.title}
            </h1>
            <p className="mt-1 text-xs text-content-tertiary sm:text-sm">
              {lang === 'ar'
                ? 'إدارة بيانات النشاط، الملف الشخصي، وسياسات المنصة من مكان واحد'
                : 'Manage organization details, profile, and platform policies from one place'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-secondary/50 px-4 py-3 text-xs text-content-tertiary">
            <div className="font-medium text-content-primary">{organization.name}</div>
            <div className="mt-1">{organization.industry || (lang === 'ar' ? 'غير محدد' : 'Not set')}</div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* Organization tab */}
          {tab === 'organization' && (
            <div className="mx-auto max-w-3xl">
              {renderMessage(orgMessage)}

              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-content-primary">
                    {lang === 'ar' ? 'بيانات النشاط التجاري' : 'Organization Details'}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-content-tertiary">
                    {lang === 'ar'
                      ? 'حدّث الاسم، القطاع، والمدينة الأساسية للنشاط التجاري.'
                      : 'Update your business name, industry, and main city.'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="form-label">{lang === 'ar' ? 'اسم النشاط' : 'Business Name'}</label>
                  <input
                    className="form-input"
                    value={orgName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{lang === 'ar' ? 'القطاع' : 'Industry'}</label>
                  <input
                    className="form-input"
                    value={orgIndustry}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgIndustry(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{lang === 'ar' ? 'المدينة' : 'City'}</label>
                  <input
                    className="form-input"
                    value={orgCity}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{lang === 'ar' ? 'الدولة' : 'Country'}</label>
                  <input
                    className="form-input bg-surface-secondary"
                    value={organization.country || 'SA'}
                    disabled
                  />
                </div>

                <div>
                  <label className="form-label">Slug</label>
                  <input
                    className="form-input bg-surface-secondary"
                    value={organization.slug || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary min-w-[140px]" onClick={handleSaveOrg} disabled={orgSaving}>
                  <Save size={15} />
                  {orgSaving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="mx-auto max-w-3xl">
              {renderMessage(profileMessage)}

              <div className="mb-6 rounded-2xl border border-border bg-surface-secondary/40 p-4 sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative group self-start">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700 ring-4 ring-white shadow-md">
                        {fullName?.charAt(0) || '?'}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Camera size={20} className="text-white" />
                    </button>

                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                        <UserCircle2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-content-primary">
                          {fullName || profile?.email || (lang === 'ar' ? 'الملف الشخصي' : 'Profile')}
                        </div>
                        <div className="mt-1 truncate text-xs text-content-tertiary">
                          {profile?.email || ''}
                        </div>
                        <div className="mt-1 text-2xs text-content-tertiary">
                          {t.roles[(profile?.role || 'staff') as 'owner' | 'manager' | 'staff'] ||
                            profile?.role ||
                            ''}
                        </div>
                        {isGoogleUser && (
                          <div className="mt-2 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-2xs font-medium text-brand-600">
                            {lang === 'ar' ? 'حساب Google' : 'Google account'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="form-label">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    className="form-input"
                    value={fullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    className="form-input bg-surface-secondary"
                    value={profile?.email || ''}
                    disabled
                    title={
                      isGoogleUser
                        ? lang === 'ar'
                          ? 'لا يمكن تغيير البريد لحسابات Google'
                          : 'Email cannot be changed for Google accounts'
                        : ''
                    }
                  />
                  {isGoogleUser && (
                    <p className="mt-2 text-2xs leading-6 text-content-tertiary">
                      {lang === 'ar'
                        ? 'البريد مرتبط بحساب Google ولا يمكن تعديله'
                        : 'Email is linked to Google account and cannot be changed'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className="btn btn-primary min-w-[140px]"
                  onClick={handleSaveProfile}
                  disabled={profileSaving || uploadingAvatar}
                >
                  <Save size={15} />
                  {profileSaving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          )}

          {/* Reply Policy tab */}
          {tab === 'policy' && (
            <div className="mx-auto max-w-3xl">
              {renderMessage(policyMessage)}

              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-blue-800">
                    {lang === 'ar' ? 'سياسة ردود سديم' : 'Sadeem Reply Policy'}
                  </div>
                  <div className="mt-1 text-xs leading-7 text-blue-700">
                    {lang === 'ar'
                      ? 'سديم ترد مرة واحدة فقط على التقييم الأول من كل عميل. إذا كتب العميل تعليقاً ثانياً، يتم إيقاف الرد الآلي وتتحول الحالة إلى "مراجعة يدوية مطلوبة". هذا يمنع الردود المتكررة ويحافظ على احترافية التواصل.'
                      : 'Sadeem replies once to the first review from each customer. If a customer posts a follow-up, auto-reply is disabled and the status changes to "Manual Review Required". This prevents repetitive replies and maintains professional communication.'}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {lang === 'ar' ? 'الرد التلقائي على أول تقييم فقط' : 'Auto-reply first review only'}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {lang === 'ar'
                        ? 'مفعّل افتراضياً — قاعدة سديم الأساسية'
                        : 'Enabled by default — core Sadeem rule'}
                    </div>
                  </div>
                  <Toggle value={autoReplyFirstOnly} onChange={setAutoReplyFirstOnly} />
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {lang === 'ar' ? 'التقييمات المتكررة → مراجعة يدوية' : 'Follow-up reviews → Manual review'}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {lang === 'ar' ? 'عند تكرار تقييم من نفس العميل' : 'When same customer posts again'}
                    </div>
                  </div>
                  <Toggle value={true} disabled />
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {lang === 'ar'
                        ? 'إظهار قوالب الردود في المراجعة اليدوية'
                        : 'Show templates in manual review'}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {lang === 'ar' ? 'اقتراح قوالب عند الرد يدوياً' : 'Suggest templates during manual reply'}
                    </div>
                  </div>
                  <Toggle value={true} disabled />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="btn btn-primary min-w-[140px]" onClick={handleSavePolicy} disabled={policySaving}>
                  <Save size={15} />
                  {policySaving ? t.common.loading : t.common.save}
                </button>
              </div>
            </div>
          )}

          {/* General tab */}
          {tab === 'general' && (
            <div className="mx-auto max-w-3xl">
              {renderMessage(generalMessage)}

              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-4 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Globe2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-content-primary">
                    {lang === 'ar' ? 'اللغة والمنطقة' : 'Language & Region'}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-content-tertiary">
                    {lang === 'ar'
                      ? 'تحكم في لغة الواجهة المستخدمة داخل لوحة التحكم.'
                      : 'Control the interface language used inside the dashboard.'}
                  </div>
                </div>
              </div>

              <div className="max-w-sm">
                <label className="form-label">{t.settingsPage.language}</label>
                <select
                  className="form-select"
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
    </div>
  );
}
