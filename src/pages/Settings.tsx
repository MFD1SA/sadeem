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
  const {
    organization,
    profile,
    user,
    refreshProfile,
    refreshOrganization,
    isLoading: authLoading,
  } = useAuth();

  const [tab, setTab] = useState('organization');

  // Per-tab UI state
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgMessage, setOrgMessage] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [policySaving, setPolicySaving] = useState(false);
  const [policyMessage, setPolicyMessage] = useState('');

  const [generalMessage, setGeneralMessage] = useState('');

  // Org form
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [orgCity, setOrgCity] = useState('');

  // Profile form
  const [fullName, setFullName] = useState('');

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Detect if logged in via Google
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Policy settings
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
        className={`text-xs rounded-md p-3 mb-4 ${
          isSuccessMessage(msg)
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
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

      if (upErr) throw upErr;

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
   
