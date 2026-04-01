import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizations';

const industries = [
  { ar: 'مطاعم', en: 'Restaurants' },
  { ar: 'مقاهي', en: 'Cafes' },
  { ar: 'فنادق', en: 'Hotels' },
  { ar: 'صحي', en: 'Healthcare' },
  { ar: 'تجزئة', en: 'Retail' },
  { ar: 'خدمات', en: 'Services' },
  { ar: 'تعليم', en: 'Education' },
  { ar: 'سياحة', en: 'Tourism' },
  { ar: 'أخرى', en: 'Other' },
];

const cities = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام',
  'الخبر', 'الظهران', 'الطائف', 'تبوك', 'بريدة', 'أبها', 'جازان', 'أخرى',
];

export default function Onboarding() {
  const { t, lang } = useLanguage();
  const { user, refreshOrganization } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await organizationService.createOrganization(user.id, {
        name,
        industry,
        country: 'SA',
        city,
      });
      await refreshOrganization();
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError((err as Error).message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = step === 1 ? !!name : step === 2 ? !!industry : !!city;

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-content-primary mb-1">{t.appName}</h1>
          <p className="text-sm text-content-secondary">
            {lang === 'ar' ? 'أكمل إعداد نشاطك التجاري' : 'Complete your business setup'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-brand-600 w-12' : 'bg-gray-200 w-8'
              }`}
            />
          ))}
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3 mb-4">
                {error}
              </div>
            )}

            {/* Step 1: Business Name */}
            {step === 1 && (
              <div>
                <h2 className="text-base font-semibold text-content-primary mb-1">
                  {lang === 'ar' ? 'ما اسم نشاطك التجاري؟' : 'What is your business name?'}
                </h2>
                <p className="text-xs text-content-secondary mb-4">
                  {lang === 'ar' ? 'اسم المنشأة كما يظهر للعملاء' : 'Your business name as shown to customers'}
                </p>
                <input
                  className="form-input text-base"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: مطاعم الأفق' : 'e.g. Al Ofoq Restaurants'}
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Industry */}
            {step === 2 && (
              <div>
                <h2 className="text-base font-semibold text-content-primary mb-1">
                  {lang === 'ar' ? 'ما قطاع نشاطك؟' : 'What is your industry?'}
                </h2>
                <p className="text-xs text-content-secondary mb-4">
                  {lang === 'ar' ? 'اختر القطاع الأقرب لنشاطك' : 'Choose the closest industry'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {industries.map(ind => (
                    <button
                      key={ind.ar}
                      onClick={() => setIndustry(ind.ar)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        industry === ind.ar
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-border bg-white text-content-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {lang === 'ar' ? ind.ar : ind.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: City */}
            {step === 3 && (
              <div>
                <h2 className="text-base font-semibold text-content-primary mb-1">
                  {lang === 'ar' ? 'في أي مدينة؟' : 'Which city?'}
                </h2>
                <p className="text-xs text-content-secondary mb-4">
                  {lang === 'ar' ? 'المدينة الرئيسية لنشاطك' : 'Your main city of operation'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {cities.map(c => (
                    <button
                      key={c}
                      onClick={() => setCity(c)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        city === c
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-border bg-white text-content-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              {step > 1 ? (
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(step - 1)}>
                  {t.common.back}
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  className="btn btn-primary"
                  disabled={!canProceed}
                  onClick={() => setStep(step + 1)}
                >
                  {lang === 'ar' ? 'التالي' : 'Next'}
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={!canProceed || loading}
                  onClick={handleComplete}
                >
                  {loading ? t.common.loading : (lang === 'ar' ? 'ابدأ الآن' : 'Get Started')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
