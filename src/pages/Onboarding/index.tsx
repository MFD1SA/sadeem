const handleFinish = async () => {
  setSaving(true);
  setError('');

  try {
    await organizationService.createOrganization(user!.id, {
      name: form.businessName,
      industry: form.businessType,
      country: form.country,
      city: form.city,
    });

    await refreshOrganization();
  } catch (err) {
    console.error('[Onboarding] Failed:', err);
    setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
  } finally {
    setSaving(false);
  }
};
