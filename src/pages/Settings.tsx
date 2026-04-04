import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizations';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Tabs } from '@/components/ui/Tabs';
import { Toggle } from '@/components/ui/Toggle';
import { Shield, Camera, Building2, UserCircle2, Globe2, Save, Upload, ImageIcon } from 'lucide-react';

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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [settingGoogleLogo, setSettingGoogleLogo] = useState(false);

  const [autoReplyFirstOnly, setAutoReplyFirstOnly] = useState(true);
  const [smartTemplateMode, setSmartTemplateMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } } | null } }) => {
      const provider = data?.session?.user?.app_metadata?.provider;
      setIsGoogleUser(provider === 'google');
      const avatarUrl = data?.session?.user?.user_metadata?.avatar_url
        || data?.session?.user?.user_metadata?.picture;
      if (avatarUrl) setGoogleAvatarUrl(avatarUrl);
    });
  }, []);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setOrgIndustry(organization.industry || '');
      setOrgCity(organization.city || '');
      setSmartTemplateMode(!!organization.smart_template_mode);
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
          throw new Error(t.settingsPage.imageUploadNotConfigured);
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
      setProfileMessage(t.settingsPage.avatarUpdated);
    } catch (err: unknown) {
      setProfileMessage((err as Error).message || t.settingsPage.avatarUploadFailed);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    setUploadingLogo(true);
    setOrgMessage('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${organization.id}/logo.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('branding')
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('bucket')) {
          throw new Error(t.settingsPage.imageUploadNotConfigured);
        }
        throw upErr;
      }

      const { data: urlData } = supabase.storage.from('branding').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateErr) throw updateErr;

      await refreshOrganization();
      setOrgMessage(t.settingsPage.logoUpdated);
    } catch (err: unknown) {
      setOrgMessage((err as Error).message || t.settingsPage.logoUploadFailed);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleUseGooglePhoto = async () => {
    if (!googleAvatarUrl || !organization) return;
    setSettingGoogleLogo(true);
    setOrgMessage('');
    try {
      // Use the high-res version of Google avatar (replace s96 with s400)
      const hiResUrl = googleAvatarUrl.replace(/=s\d+-c/, '=s400-c').replace(/\/s\d+-c\//, '/s400-c/');
      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ logo_url: hiResUrl })
        .eq('id', organization.id);
      if (updateErr) throw updateErr;
      await refreshOrganization();
      setOrgMessage(t.settingsPage.googlePhotoSet);
    } catch (err: unknown) {
      setOrgMessage((err as Error).message || t.settingsPage.googlePhotoFailed);
    } finally {
      setSettingGoogleLogo(false);
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
      setOrgMessage(t.settingsPage.savedSuccessfully);
    } catch (err: unknown) {
      setOrgMessage((err as Error).message || t.settingsPage.saveFail);
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
      setProfileMessage(t.settingsPage.savedSuccessfully);
    } catch (err: unknown) {
      setProfileMessage((err as Error).message || t.settingsPage.saveFail);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!organization) return;
    setPolicySaving(true);
    setPolicyMessage('');

    try {
      await organizationService.updateOrganization(organization.id, {
        smart_template_mode: smartTemplateMode,
      } as Partial<typeof organization>);
      if (refreshOrganization) await refreshOrganization();
      setPolicyMessage(t.settingsPage.savedSuccessfully);
    } catch (err: unknown) {
      setPolicyMessage((err as Error).message || t.settingsPage.saveFail);
    } finally {
      setPolicySaving(false);
    }
  };

  if (authLoading) {
    return <LoadingState message={t.settingsPage.loadingSettings} />;
  }

  if (!organization) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8 text-center text-content-secondary shadow-sm">
        {t.settingsPage.noOrganization}
      </div>
    );
  }

  const tabs = [
    { id: 'organization', label: t.settingsPage.organizationTab },
    { id: 'profile', label: t.topbar.profile },
    { id: 'policy', label: t.settingsPage.replyPolicyTab },
    { id: 'general', label: t.settingsPage.general },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={20} className="text-brand-500" />
            {t.settingsPage.title}
          </h1>
          <p className="page-subtitle">
            {t.settingsPage.pageSubtitle}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-2.5 text-xs text-content-tertiary">
          <div className="font-medium text-content-primary">{organization.name}</div>
          <div className="mt-0.5">{organization.industry || t.settingsPage.notSet}</div>
        </div>
      </div>

      {/* Main card */}
      <div className="card overflow-hidden">
        <div className="border-b border-border/70 px-5 py-4 sm:px-6">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          {/* Organization tab */}
          {tab === 'organization' && (
            <div className="mx-auto max-w-3xl">
              {renderMessage(orgMessage)}

              {/* Logo Upload Section */}
              <div className="mb-6 rounded-2xl border border-border bg-surface-secondary/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="relative group self-start">
                    {organization.logo_url ? (
                      <img
                        src={organization.logo_url}
                        alt=""
                        className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 ring-4 ring-white shadow-md">
                        {orgName?.charAt(0) || '?'}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Camera size={20} className="text-white" />
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 flex-shrink-0">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-content-primary">
                          {t.settingsPage.businessLogo}
                        </div>
                        <div className="mt-1 text-xs leading-6 text-content-tertiary">
                          {t.settingsPage.businessLogoDesc}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="btn btn-secondary btn-sm"
                          >
                            <Upload size={13} />
                            {uploadingLogo
                              ? t.settingsPage.uploading
                              : organization.logo_url
                                ? t.settingsPage.changeLogo
                                : t.settingsPage.uploadLogo}
                          </button>
                          {isGoogleUser && googleAvatarUrl && (
                            <button
                              type="button"
                              onClick={handleUseGooglePhoto}
                              disabled={settingGoogleLogo}
                              className="btn btn-sm border border-border bg-white hover:bg-gray-50 text-content-primary gap-1.5"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                              {settingGoogleLogo
                                ? t.settingsPage.settingGooglePhoto
                                : t.settingsPage.useGooglePhoto}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-content-primary">
                    {t.settingsPage.organizationDetails}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-content-tertiary">
                    {t.settingsPage.organizationDetailsDesc}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="form-label">{t.settingsPage.businessName}</label>
                  <input
                    className="form-input"
                    value={orgName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{t.settingsPage.industry}</label>
                  <input
                    className="form-input"
                    value={orgIndustry}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgIndustry(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{t.settingsPage.city}</label>
                  <input
                    className="form-input"
                    value={orgCity}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrgCity(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{t.settingsPage.country}</label>
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
                          {fullName || profile?.email || t.topbar.profile}
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
                            {t.settingsPage.googleAccount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="form-label">{t.settingsPage.fullName}</label>
                  <input
                    className="form-input"
                    value={fullName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">{t.settingsPage.email}</label>
                  <input
                    className="form-input bg-surface-secondary"
                    value={profile?.email || ''}
                    disabled
                    title={
                      isGoogleUser
                        ? t.settingsPage.emailCannotChangeGoogle
                        : ''
                    }
                  />
                  {isGoogleUser && (
                    <p className="mt-2 text-2xs leading-6 text-content-tertiary">
                      {t.settingsPage.emailLinkedToGoogle}
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
                    {t.settingsPage.replyPolicy}
                  </div>
                  <div className="mt-1 text-xs leading-7 text-blue-700">
                    {t.settingsPage.replyPolicyDesc}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {t.settingsPage.autoReplyFirstReviewOnly}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {t.settingsPage.autoReplyFirstReviewOnlyDesc}
                    </div>
                  </div>
                  <Toggle value={autoReplyFirstOnly} onChange={setAutoReplyFirstOnly} />
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {t.settingsPage.followUpReviews}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {t.settingsPage.followUpReviewsDesc}
                    </div>
                  </div>
                  <Toggle value={true} disabled />
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {t.settingsPage.showTemplatesManualReview}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {t.settingsPage.showTemplatesManualReviewDesc}
                    </div>
                  </div>
                  <Toggle value={true} disabled />
                </div>

                <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                  <div>
                    <div className="text-sm font-medium text-content-primary">
                      {t.settingsPage.smartTemplateMode}
                    </div>
                    <div className="mt-1 text-2xs text-content-tertiary">
                      {t.settingsPage.smartTemplateModeDescLong}
                    </div>
                  </div>
                  <Toggle value={smartTemplateMode} onChange={setSmartTemplateMode} />
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
                    {t.settingsPage.languageAndRegion}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-content-tertiary">
                    {t.settingsPage.languageAndRegionDesc}
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
