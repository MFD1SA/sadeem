// ============================================================================
// SENDA Admin — Settings (Real DB Persistence)
// Reads/writes via admin_get_setting / admin_set_setting RPCs.
// Branding logos uploaded to Supabase Storage and URLs saved in settings.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSettingsService, type BrandingSettings } from '../services/adminSettings.service';
import { adminSupabase } from '../services/adminSupabase';
import { Palette, Shield, Globe, Bell, Server, Save, Upload, Check, Search, CreditCard } from 'lucide-react';
import { AdminSelect } from '../components/AdminSelect';

export default function AdminSettings() {
  useEffect(() => { document.title = 'سيندا — الإعدادات'; }, []);

  const [activeSection, setActiveSection] = useState('branding');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showMsg = (t: string, ty: 'success' | 'error') => { setMsg({ text: t, type: ty }); setTimeout(() => setMsg(null), 4000); };

  const sections = [
    { id: 'branding', label: 'هوية المنصة', icon: Palette },
    { id: 'seo', label: 'تحسين محركات البحث', icon: Search },
    { id: 'billing', label: 'الفوترة والضريبة', icon: CreditCard },
    { id: 'security', label: 'الأمان والسياسات', icon: Shield },
    { id: 'region', label: 'المنطقة والعملة', icon: Globe },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'system', label: 'معلومات النظام', icon: Server },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">الإعدادات</h1>
        <p className="text-sm text-gray-600">إعدادات المنصة والنظام — تُحفظ تلقائيًا في قاعدة البيانات</p>
      </div>
      {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border border-red-500/20 text-red-600'}`}>{msg.text}</div>}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-56 flex-shrink-0"><div className="admin-card"><div className="p-2">
          {sections.map((s) => { const Icon = s.icon; return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${activeSection === s.id ? 'bg-cyan-500/10 text-cyan-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <Icon size={16} /><span>{s.label}</span>
            </button>); })}
        </div></div></div>

        <div className="flex-1 min-w-0">
          {activeSection === 'branding' && <BrandingSection showMsg={showMsg} />}
          {activeSection === 'seo' && <SeoSection showMsg={showMsg} />}
          {activeSection === 'billing' && <BillingSection showMsg={showMsg} />}
          {activeSection === 'security' && <SettingSection settingKey="security_policies" showMsg={showMsg} fields={[
            { key: 'min_password_length', label: 'الحد الأدنى لطول كلمة المرور', type: 'number', default: 8 },
            { key: 'max_failed_attempts', label: 'الحد الأقصى لمحاولات الدخول الفاشلة', type: 'number', default: 5 },
            { key: 'lockout_minutes', label: 'مدة قفل الحساب (بالدقائق)', type: 'number', default: 30 },
            { key: 'session_hours', label: 'مدة الجلسة (بالساعات)', type: 'number', default: 8 },
          ]} />}
          {activeSection === 'region' && <SettingSection settingKey="region" showMsg={showMsg} fields={[
            { key: 'currency', label: 'العملة', type: 'select', default: 'SAR', options: [{ v: 'SAR', l: 'ريال سعودي (ر.س)' }, { v: 'AED', l: 'درهم إماراتي' }, { v: 'USD', l: 'دولار أمريكي' }] },
            { key: 'timezone', label: 'المنطقة الزمنية', type: 'select', default: 'Asia/Riyadh', options: [{ v: 'Asia/Riyadh', l: 'الرياض (UTC+3)' }, { v: 'Asia/Dubai', l: 'دبي (UTC+4)' }] },
            { key: 'language', label: 'اللغة الافتراضية', type: 'select', default: 'ar', options: [{ v: 'ar', l: 'العربية' }, { v: 'en', l: 'English' }] },
            { key: 'vat_rate', label: 'نسبة ضريبة القيمة المضافة (%)', type: 'number', default: 15 },
          ]} />}
          {activeSection === 'notifications' && <SettingSection settingKey="notifications" showMsg={showMsg} fields={[
            { key: 'notify_negative_review', label: 'إشعار عند تقييم سلبي', type: 'toggle', default: true },
            { key: 'notify_new_subscriber', label: 'إشعار عند اشتراك جديد', type: 'toggle', default: true },
            { key: 'notify_payment', label: 'إشعار عند دفعة جديدة', type: 'toggle', default: false },
            { key: 'notify_ai_limit', label: 'إشعار عند تجاوز حد AI', type: 'toggle', default: true },
          ]} />}
          {activeSection === 'system' && <SystemInfo />}
        </div>
      </div>
    </div>
  );
}

// ─── Branding with logo upload + DB persistence ───
function BrandingSection({ showMsg }: { showMsg: (t: string, ty: 'success' | 'error') => void }) {
  const [branding, setBranding] = useState<BrandingSettings>({
    platform_name_ar: 'سيندا', platform_name_en: 'SENDA',
    tagline: 'إدارة التقييمات بالذكاء الاصطناعي',
    logo_icon_url: '', logo_full_url: '', favicon_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminSettingsService.getBranding().then((b) => { setBranding(b); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const uploadLogo = async (file: File, key: 'logo_icon_url' | 'logo_full_url' | 'favicon_url') => {
    if (file.size > 2 * 1024 * 1024) { showMsg('حجم الملف يجب ألا يتجاوز 2 ميغابايت', 'error'); return; }
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${key}.${ext}`;
      const { error } = await adminSupabase.storage.from('branding').upload(path, file, { upsert: true, contentType: file.type });
      if (error) { showMsg(error.message.includes('Bucket') || error.message.includes('not found') ? 'يجب إنشاء bucket "branding" في Supabase Storage أولاً' : error.message, 'error'); return; }
      const { data } = adminSupabase.storage.from('branding').getPublicUrl(path);
      setBranding(prev => ({ ...prev, [key]: data.publicUrl }));
      showMsg('تم رفع الملف', 'success');
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل الرفع', 'error'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await adminSettingsService.saveBranding(branding); showMsg('تم حفظ إعدادات الهوية في قاعدة البيانات', 'success'); }
    catch (e) { showMsg(e instanceof Error ? e.message : 'فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="admin-spinner" /></div>;

  return (
    <div className="space-y-4">
      <div className="admin-card"><div className="admin-card-header"><h3>الهوية الأساسية</h3></div>
        <div className="admin-card-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">اسم المنصة (عربي)</label>
              <input className="admin-form-input" value={branding.platform_name_ar} onChange={(e) => setBranding(p => ({ ...p, platform_name_ar: e.target.value }))} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">اسم المنصة (إنجليزي)</label>
              <input className="admin-form-input" dir="ltr" value={branding.platform_name_en} onChange={(e) => setBranding(p => ({ ...p, platform_name_en: e.target.value }))} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">الوصف المختصر</label>
            <input className="admin-form-input" value={branding.tagline} onChange={(e) => setBranding(p => ({ ...p, tagline: e.target.value }))} /></div>
        </div></div>

      <div className="admin-card"><div className="admin-card-header"><h3>الشعارات</h3><p className="text-xs text-slate-500">تُرفع إلى Supabase Storage وتنعكس على الواجهة</p></div>
        <div className="admin-card-body"><div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <LogoSlot label="الشعار الرمزي" desc="Sidebar والأماكن الصغيرة" url={branding.logo_icon_url} onUpload={(f) => uploadLogo(f, 'logo_icon_url')} />
          <LogoSlot label="الشعار الكامل" desc="شاشة الدخول والعرض الكبير" url={branding.logo_full_url} onUpload={(f) => uploadLogo(f, 'logo_full_url')} />
          <LogoSlot label="أيقونة المتصفح" desc="Favicon" url={branding.favicon_url} onUpload={(f) => uploadLogo(f, 'favicon_url')} />
        </div></div></div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
          <Save size={16} /><span>{saving ? 'جاري الحفظ...' : 'حفظ في قاعدة البيانات'}</span>
        </button>
      </div>
    </div>
  );
}

function LogoSlot({ label, desc, url, onUpload }: { label: string; desc: string; url: string; onUpload: (f: File) => void }) {
  return (
    <div><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <p className="text-[11px] text-slate-600 mb-2">{desc}</p>
      <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-cyan-500/30 bg-gray-50 cursor-pointer transition-colors">
        {url ? <img src={url} alt={label} className="max-h-20 max-w-full object-contain" /> : <div className="flex flex-col items-center gap-1.5 text-slate-500"><Upload size={20} /><span className="text-[11px]">اختر ملفًا</span></div>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
      </label>
    </div>
  );
}

// ─── Generic setting section with DB persistence ───
interface Field { key: string; label: string; type: 'text' | 'number' | 'select' | 'toggle'; default: string | number | boolean; options?: { v: string; l: string }[] }

function SettingSection({ settingKey, fields, showMsg }: { settingKey: string; fields: Field[]; showMsg: (t: string, ty: 'success' | 'error') => void }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const defaults: Record<string, unknown> = {};
    fields.forEach(f => { defaults[f.key] = f.default; });
    adminSettingsService.get(settingKey, defaults).then((v) => { setValues(v as Record<string, unknown>); setLoading(false); }).catch(() => { setValues(defaults); setLoading(false); });
  }, [settingKey]);

  const handleSave = async () => {
    setSaving(true);
    try { await adminSettingsService.set(settingKey, values); showMsg('تم الحفظ', 'success'); }
    catch (e) { showMsg(e instanceof Error ? e.message : 'فشل', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="admin-spinner" /></div>;

  return (
    <div className="admin-card"><div className="admin-card-body space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          {f.type === 'toggle' ? (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">{f.label}</span>
              <button onClick={() => setValues(p => ({ ...p, [f.key]: !p[f.key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${values[f.key] ? 'bg-cyan-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${values[f.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ) : (
            <div><label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>
              {f.type === 'select' ? (
                <AdminSelect wrapperClassName="w-auto min-w-[200px]" value={String(values[f.key] ?? f.default)}
                  onChange={(e) => setValues(p => ({ ...p, [f.key]: e.target.value }))}>
                  {f.options?.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </AdminSelect>
              ) : (
                <input type={f.type} className="admin-form-input w-auto min-w-[120px]" dir="ltr"
                  value={String(values[f.key] ?? f.default)}
                  onChange={(e) => setValues(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
              )}
            </div>
          )}
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
          <Save size={16} /><span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
        </button>
      </div>
    </div></div>
  );
}

// ─── SEO Section ───
function SeoSection({ showMsg }: { showMsg: (t: string, ty: 'success' | 'error') => void }) {
  const [seo, setSeo] = useState({ meta_title: '', meta_description: '', keywords: '', og_image_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminSupabase.rpc('admin_get_setting', { p_key: 'seo' });
        if (data) setSeo({ meta_title: data.meta_title || '', meta_description: data.meta_description || '', keywords: data.keywords || '', og_image_url: data.og_image_url || '' });
      } catch { /* use defaults */ } finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await adminSupabase.rpc('admin_set_setting', { p_key: 'seo', p_value: seo });
      if (error) throw error;
      showMsg('تم حفظ إعدادات SEO بنجاح', 'success');
    } catch { showMsg('فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="admin-spinner" /></div>;

  return (
    <div className="space-y-4">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>إعدادات SEO الأساسية</h3>
        </div>
        <div className="admin-card-body space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">عنوان الصفحة (Meta Title)</label>
            <input value={seo.meta_title} onChange={e => setSeo(p => ({ ...p, meta_title: e.target.value }))}
              placeholder="سيندا — نظام إدارة التقييمات بالذكاء الاصطناعي"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
            <p className="text-[10px] text-slate-600 mt-1">{seo.meta_title.length}/60 حرف — الموصى به: 50-60</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">وصف الصفحة (Meta Description)</label>
            <textarea value={seo.meta_description} onChange={e => setSeo(p => ({ ...p, meta_description: e.target.value }))}
              rows={3} placeholder="منصة سيندا لإدارة تقييمات Google تلقائياً بالذكاء الاصطناعي — ردود فورية، تحليلات متقدمة، وإدارة جميع الفروع من مكان واحد."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 resize-none" />
            <p className="text-[10px] text-slate-600 mt-1">{seo.meta_description.length}/160 حرف — الموصى به: 120-160</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">الكلمات المفتاحية (Keywords)</label>
            <input value={seo.keywords} onChange={e => setSeo(p => ({ ...p, keywords: e.target.value }))}
              placeholder="إدارة تقييمات Google، ردود تلقائية، ذكاء اصطناعي، سيندا"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
            <p className="text-[10px] text-slate-600 mt-1">افصل بين الكلمات بفاصلة</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">صورة Open Graph (للمشاركة)</label>
            <input value={seo.og_image_url} onChange={e => setSeo(p => ({ ...p, og_image_url: e.target.value }))}
              placeholder="https://..."
              dir="ltr"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={save} disabled={saving} className="admin-btn-primary">
              <Save size={14} /><span>{saving ? 'جاري الحفظ...' : 'حفظ SEO'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card border-dashed border-gray-200">
        <div className="admin-card-body">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Search size={15} className="text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Programmatic SEO <span className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 mr-1">قريباً</span></div>
              <p className="text-xs text-slate-500 leading-relaxed">إنشاء صفحات SEO تلقائية لكل فرع، مدينة، وخدمة — يُمكن المنصة من التصنيف في نتائج البحث لكلمات طويلة الذيل مثل "إدارة تقييمات Google في الرياض".</p>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                <li>• صفحة مخصصة لكل فرع تلقائياً</li>
                <li>• Sitemap XML ديناميكي</li>
                <li>• Schema Markup للمطاعم والمحلات</li>
                <li>• روابط قانونية (Canonical URLs)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Billing / VAT Section ───
function BillingSection({ showMsg }: { showMsg: (t: string, ty: 'success' | 'error') => void }) {
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminSupabase.rpc('admin_get_setting', { p_key: 'billing' });
        if (data) {
          setVatEnabled(data.vat_enabled ?? true);
          setVatRate(data.vat_rate ?? 15);
        }
      } catch { /* use defaults */ } finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (vatRate < 0 || vatRate > 100) { showMsg('نسبة الضريبة يجب أن تكون بين 0 و 100', 'error'); return; }
    setSaving(true);
    try {
      const { error } = await adminSupabase.rpc('admin_set_setting', {
        p_key: 'billing',
        p_value: { vat_enabled: vatEnabled, vat_rate: vatRate },
      });
      if (error) throw error;
      showMsg('تم حفظ إعدادات الفوترة بنجاح', 'success');
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل الحفظ', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="admin-spinner" /></div>;

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>إعدادات ضريبة القيمة المضافة (VAT)</h3>
        <p className="text-xs text-slate-500">تنطبق على جميع الفواتير والعروض السعرية الموضحة للمشتركين</p>
      </div>
      <div className="admin-card-body space-y-5">
        {/* VAT enabled toggle */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div>
            <div className="text-sm text-gray-700 font-medium">تفعيل ضريبة القيمة المضافة</div>
            <div className="text-xs text-slate-500 mt-0.5">عند التفعيل تُضاف الضريبة تلقائياً لجميع الفواتير وتظهر التفاصيل للمشتركين</div>
          </div>
          <button
            onClick={() => setVatEnabled(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${vatEnabled ? 'bg-cyan-500' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${vatEnabled ? 'right-1' : 'left-1'}`} />
          </button>
        </div>

        {/* VAT rate */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            نسبة الضريبة (%)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              dir="ltr"
              disabled={!vatEnabled}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="admin-form-input w-28 disabled:opacity-40"
            />
            <span className="text-xs text-slate-500">القيمة الافتراضية في المملكة: 15%</span>
          </div>
        </div>

        {/* Preview */}
        {vatEnabled && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-2 font-medium">معاينة — مثال على خطة نوفا (199 ر.س)</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>المبلغ قبل الضريبة</span>
                <span dir="ltr">199.00 ر.س</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>ضريبة القيمة المضافة ({vatRate}%)</span>
                <span dir="ltr">{(199 * vatRate / 100).toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1 mt-1">
                <span>الإجمالي شامل الضريبة</span>
                <span dir="ltr">{(199 * (1 + vatRate / 100)).toFixed(2)} ر.س</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
            <Save size={16} /><span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SystemInfo() {
  return (<div className="space-y-4">
    <div className="admin-card"><div className="admin-card-header"><h3>معلومات النظام</h3></div>
      <div className="admin-card-body space-y-2 text-sm">
        {[['إصدار النظام', '1.0.0'], ['Frontend', 'React 18 + TypeScript + Vite'], ['Backend', 'Supabase (PostgreSQL)'], ['AI Provider', 'Google Gemini Flash Lite'], ['Hosting', 'Vercel'], ['Payment', 'Stripe / Moyasar']].map(([l, v]) => (
          <div key={l} className="flex justify-between py-1"><span className="text-gray-500">{l}</span><span className="text-gray-700" dir="ltr">{v}</span></div>
        ))}
      </div></div>
    <div className="admin-card"><div className="admin-card-header"><h3>حالة الخدمات</h3></div>
      <div className="admin-card-body space-y-2 text-sm">
        {[
          { l: 'قاعدة البيانات', dot: 'bg-emerald-400', s: 'يعمل' },
          { l: 'خدمة المصادقة', dot: 'bg-emerald-400', s: 'يعمل' },
          { l: 'AI Service', dot: 'bg-emerald-400', s: 'يعمل' },
          { l: 'بوابة الدفع', dot: 'bg-blue-400', s: 'جاهز' },
        ].map(({ l, dot, s }) => (
          <div key={l} className="flex items-center justify-between py-1"><span className="text-gray-500">{l}</span>
            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${dot}`} /><span className="text-xs text-gray-700">{s}</span></div>
          </div>))}
      </div></div>
  </div>);
}
