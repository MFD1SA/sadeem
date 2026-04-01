// ============================================================================
// SADEEM — Onboarding (5-Step)
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizations';
import { Building2, MapPin, Globe, MessageSquare, CheckCircle, ChevronLeft, ChevronRight, Loader2, Layers } from 'lucide-react';

const GCC_COUNTRIES: { code: string; name: string; cities: string[] }[] = [
  {
    code: 'SA',
    name: 'المملكة العربية السعودية',
    cities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الأحساء', 'الطائف', 'تبوك', 'أبها', 'القصيم', 'حائل', 'الجوف', 'نجران', 'جازان', 'الباحة', 'ينبع', 'الخرج'],
  },
  {
    code: 'AE',
    name: 'الإمارات العربية المتحدة',
    cities: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'],
  },
  {
    code: 'KW',
    name: 'الكويت',
    cities: ['الكويت', 'الفروانية', 'حولي', 'مبارك الكبير', 'الأحمدي', 'الجهراء'],
  },
  {
    code: 'QA',
    name: 'قطر',
    cities: ['الدوحة', 'الريان', 'الوكرة', 'الشمال', 'الخور', 'الظعاين'],
  },
  {
    code: 'BH',
    name: 'البحرين',
    cities: ['المنامة', 'المحرق', 'الرفاع', 'مدينة عيسى', 'مدينة حمد', 'سترة'],
  },
  {
    code: 'OM',
    name: 'سلطنة عُمان',
    cities: ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'البريمي', 'مطرح'],
  },
];

const BUSINESS_TYPES = [
  'مطاعم وكافيهات', 'فنادق وشقق فندقية', 'عيادات طبية', 'صالونات ومراكز تجميل',
  'محلات تجارية', 'سوبرماركت وبقالة', 'خدمات سيارات', 'تعليم وتدريب',
  'عقارات', 'خدمات قانونية', 'بنوك وخدمات مالية', 'أخرى',
];

const TONES = [
  { id: 'professional', label: 'رسمي', desc: 'لغة رسمية ومحترفة' },
  { id: 'friendly',     label: 'ودي',  desc: 'أسلوب دافئ ومريح' },
  { id: 'luxury',       label: 'فاخر', desc: 'راقٍ ومميز' },
];

const LANGUAGES = [
  { id: 'ar',    label: 'العربية فقط' },
  { id: 'en',    label: 'English Only' },
  { id: 'ar_en', label: 'عربي + إنجليزي' },
];

interface FormData {
  businessName: string;
  businessType: string;
  country: string;
  city: string;
  language: string;
  tone: string;
}

const STEPS = [
  { id: 1, title: 'معلومات النشاط',  icon: Building2 },
  { id: 2, title: 'الموقع الجغرافي', icon: MapPin },
  { id: 3, title: 'ربط Google',      icon: Globe },
  { id: 4, title: 'اللغة والأسلوب', icon: MessageSquare },
  { id: 5, title: 'اكتمل!',          icon: CheckCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshOrganization, hasOrganization } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    businessName: '', businessType: '', country: 'SA', city: '', language: 'ar', tone: 'professional',
  });

  // Navigate to dashboard once organization is confirmed in auth state.
  // This eliminates the race between React setState batching and navigate().
  useEffect(() => {
    if (hasOrganization) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasOrganization, navigate]);

  const selectedCountry = GCC_COUNTRIES.find(c => c.code === form.country);

  const update = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canGoNext = () => {
    if (step === 1) return form.businessName.trim().length >= 2 && form.businessType;
    if (step === 2) return form.country && form.city;
    if (step === 3) return true; // Google connect is optional
    if (step === 4) return form.language && form.tone;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      await organizationService.createOrganization(user!.id, {
        name: form.businessName,
        industry: form.businessType,
        country: form.country,
        city: form.city,
        language: form.language,
        tone: form.tone,
      });
      // Refresh auth state — useEffect above navigates when hasOrganization becomes true
      await refreshOrganization();
    } catch (err) {
      console.error('[Onboarding] Failed:', err);
      setError('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-start sm:justify-center px-4 py-8 pb-24 sm:pb-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Layers size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold text-white">سديم</span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />
          <div
            className="absolute top-4 right-0 h-0.5 bg-gradient-to-l from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="relative flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  done ? 'bg-cyan-500 border-cyan-500' :
                  active ? 'bg-[#0a0e1a] border-cyan-500' :
                  'bg-[#0a0e1a] border-white/10'
                }`}>
                  <Icon size={14} className={done || active ? 'text-white' : 'text-slate-600'} />
                </div>
                <span className={`hidden sm:block text-[10px] whitespace-nowrap ${active ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8">
        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">أخبرنا عن نشاطك</h2>
              <p className="text-sm text-slate-400">هذه المعلومات تُستخدم لتخصيص الردود</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">اسم النشاط التجاري *</label>
              <input
                value={form.businessName}
                onChange={e => update('businessName', e.target.value)}
                placeholder="مثال: مطعم الشرق"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">نوع النشاط *</label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => update('businessType', type)}
                    className={`px-3 py-2.5 rounded-lg text-sm text-right transition-colors border ${
                      form.businessType === type
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">الموقع الجغرافي</h2>
              <p className="text-sm text-slate-400">تُستخدم لتحديد عملاتك وإعداداتك الإقليمية</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">الدولة *</label>
              <div className="grid grid-cols-2 gap-2">
                {GCC_COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { update('country', c.code); update('city', ''); }}
                    className={`px-3 py-2.5 rounded-lg text-sm text-right transition-colors border ${
                      form.country === c.code
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedCountry && (
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">المدينة *</label>
                <select
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                >
                  <option value="" className="bg-slate-900">اختر المدينة</option>
                  {selectedCountry.cities.map(city => (
                    <option key={city} value={city} className="bg-slate-900">{city}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Google Connect */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">ربط Google Business</h2>
              <p className="text-sm text-slate-400">اربط نشاطك لجلب التقييمات تلقائياً</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
              <Globe size={40} className="mx-auto mb-3 text-slate-500" />
              <p className="text-slate-300 text-sm mb-4">
                يمكنك ربط Google Business الآن أو لاحقاً من لوحة التحكم
              </p>
              <button className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white text-gray-800 rounded-xl font-medium text-sm hover:bg-gray-100 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                ربط Google Business
              </button>
              <p className="text-xs text-slate-500 mt-3">اختياري — يمكن ربطه لاحقاً</p>
            </div>
          </div>
        )}

        {/* Step 4: Language & Tone */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">اللغة والأسلوب</h2>
              <p className="text-sm text-slate-400">كيف تريد أن يرد سديم على تقييماتك؟</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">لغة الردود</label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    onClick={() => update('language', l.id)}
                    className={`py-2.5 rounded-lg text-sm transition-colors border ${
                      form.language === l.id
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">أسلوب الرد</label>
              <div className="space-y-2">
                {TONES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => update('tone', t.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors border ${
                      form.tone === t.id
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">{t.label}</span>
                    <span className="text-xs text-slate-400">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3 text-right">
                {error}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">جاهز للبدء!</h2>
              <p className="text-sm text-slate-400">
                {form.businessName} — {form.city}، {GCC_COUNTRIES.find(c => c.code === form.country)?.name}
              </p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm text-slate-300 space-y-2 text-right">
              <div className="flex justify-between"><span className="text-slate-500">النشاط</span><span>{form.businessName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">النوع</span><span>{form.businessType}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">المدينة</span><span>{form.city}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">اللغة</span><span>{LANGUAGES.find(l => l.id === form.language)?.label}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">الأسلوب</span><span>{TONES.find(t => t.id === form.tone)?.label}</span></div>
            </div>
          </div>
        )}

        {/* Navigation — hidden on mobile (shown in sticky bar below) */}
        <div className="hidden sm:flex items-center justify-between mt-8">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} /> السابق
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {step === 3 ? 'تخطي' : 'التالي'} <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              ابدأ الآن
            </button>
          )}
        </div>
      </div>

      {/* Mobile sticky navigation bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-[#0a0e1a]/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center justify-between z-50">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} /> السابق
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {step === 3 ? 'تخطي' : 'التالي'} <ChevronLeft size={16} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            ابدأ الآن
          </button>
        )}
      </div>

      <p className="text-xs text-slate-600 mt-6">
        بالمتابعة، أنت توافق على <a href="#" className="text-slate-400 hover:text-white">شروط الاستخدام</a> و<a href="#" className="text-slate-400 hover:text-white">سياسة الخصوصية</a>
      </p>
    </div>
  );
}
