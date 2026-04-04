import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { templatesService } from '@/services/templates';
import { DEFAULT_TEMPLATES, type BuiltInTemplate } from '@/services/default-templates';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Plus, Edit3, Trash2, BarChart2, Lock } from 'lucide-react';
import type { DbReplyTemplate } from '@/types/database';

let _cache: DbReplyTemplate[] | null = null;

/** Unified display type for both custom and built-in templates */
type DisplayTemplate = {
  id: string;
  name: string;
  body: string;
  category: string;
  rating_min: number;
  rating_max: number;
  is_active: boolean;
  usage_count: number;
  language: 'ar' | 'en' | 'any';
  isBuiltIn: boolean;
  original?: DbReplyTemplate;
};

function builtInToDisplay(tpl: BuiltInTemplate, index: number, lang: 'ar' | 'en'): DisplayTemplate {
  return {
    id: `builtin-${index}`,
    name: lang === 'ar' ? tpl.nameAr : tpl.nameEn,
    body: lang === 'ar' ? tpl.bodyAr : tpl.bodyEn,
    category: tpl.category,
    rating_min: tpl.ratingMin,
    rating_max: tpl.ratingMax,
    is_active: true,
    usage_count: 0,
    language: 'any',
    isBuiltIn: true,
  };
}

function customToDisplay(tpl: DbReplyTemplate): DisplayTemplate {
  return {
    id: tpl.id,
    name: tpl.name,
    body: tpl.body,
    category: tpl.category,
    rating_min: tpl.rating_min,
    rating_max: tpl.rating_max,
    is_active: tpl.is_active,
    usage_count: tpl.usage_count,
    language: tpl.language || 'ar',
    isBuiltIn: false,
    original: tpl,
  };
}

type TemplateForm = { name: string; body: string; category: string; rating_min: number; rating_max: number; is_active: boolean; language: 'ar' | 'en' | 'any' };

function StarDisplay({ min, max }: { min: number; max: number }) {
  const renderStars = (filled: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < filled ? 'text-amber-400' : 'text-content-tertiary opacity-40'}>
        ★
      </span>
    ));

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="flex">{renderStars(min)}</span>
      {min !== max && (
        <>
          <span className="text-content-tertiary text-xs mx-0.5">–</span>
          <span className="flex">{renderStars(max)}</span>
        </>
      )}
    </div>
  );
}

export default function Templates() {
  const { t, lang } = useLanguage();
  const { organization } = useAuth();
  const [customTemplates, setCustomTemplates] = useState<DbReplyTemplate[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<DbReplyTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewTab, setViewTab] = useState<'all' | 'custom' | 'builtin'>('all');

  const [form, setForm] = useState<TemplateForm>({
    name: '', body: '', category: 'general', rating_min: 1, rating_max: 5, is_active: true, language: 'ar',
  });

  // Merge built-in + custom templates for display
  const builtInDisplay = DEFAULT_TEMPLATES.map((tpl, i) => builtInToDisplay(tpl, i, lang as 'ar' | 'en'));
  const customDisplay = customTemplates.map(customToDisplay);
  const allTemplates: DisplayTemplate[] = viewTab === 'custom' ? customDisplay
    : viewTab === 'builtin' ? builtInDisplay
    : [...customDisplay, ...builtInDisplay];
  // Keep "templates" alias for stats that reference it
  const templates = customTemplates;

  const loadTemplates = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    if (_cache === null) setLoading(true);
    setError('');
    try {
      const data = await templatesService.list(organization.id);
      _cache = data;
      setCustomTemplates(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: '', body: '', category: 'general', rating_min: 1, rating_max: 5, is_active: true, language: 'ar' });
    setShowModal(true);
  };

  const openEdit = (tpl: DbReplyTemplate) => {
    setEditTemplate(tpl);
    setForm({
      name: tpl.name, body: tpl.body, category: tpl.category,
      rating_min: tpl.rating_min, rating_max: tpl.rating_max, is_active: tpl.is_active,
      language: tpl.language || 'ar',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!organization || !form.name.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      if (editTemplate) {
        await templatesService.update(editTemplate.id, {
          name: form.name, body: form.body, category: form.category as DbReplyTemplate['category'],
          rating_min: form.rating_min, rating_max: form.rating_max, is_active: form.is_active,
          language: form.language,
        });
      } else {
        await templatesService.create({
          organization_id: organization.id,
          name: form.name, body: form.body, category: form.category,
          rating_min: form.rating_min, rating_max: form.rating_max, is_active: form.is_active,
          language: form.language,
        });
      }
      setShowModal(false);
      await loadTemplates();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا القالب؟' : 'Delete this template?')) return;
    try {
      await templatesService.remove(id);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await templatesService.toggleActive(id, !current);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error && customTemplates.length === 0 && builtInDisplay.length === 0) return <ErrorState message={error} onRetry={loadTemplates} />;

  const categoryColors: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
    positive: 'success', negative: 'danger', neutral: 'warning', general: 'neutral',
  };

  const categoryDotColors: Record<string, string> = {
    positive: 'bg-green-500',
    negative: 'bg-red-500',
    neutral: 'bg-amber-500',
    general: 'bg-slate-400',
  };

  const activeCount = allTemplates.filter((tpl) => tpl.is_active).length;
  const categoryCounts = ['positive', 'negative', 'neutral', 'general'].map((cat) => ({
    key: cat,
    label: t.templatesPage[cat as keyof typeof t.templatesPage] as string,
    count: allTemplates.filter((tpl) => tpl.category === cat).length,
  }));

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart2 size={20} className="text-brand-500" />
          {t.templatesPage.title}
        </h1>
        <p className="page-subtitle">{lang === 'ar' ? 'إنشاء وإدارة قوالب الردود الجاهزة والمخصصة' : 'Create and manage built-in and custom reply templates'}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <span className="text-brand-500 text-xs font-bold">{allTemplates.length}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{allTemplates.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {lang === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold">{activeCount}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{activeCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.common.active}
            </div>
          </div>
        </div>
        <div className="stat-card col-span-2 sm:col-span-1">
          <div className="text-[10px] font-semibold text-content-tertiary mb-2 uppercase tracking-wider">
            {lang === 'ar' ? 'حسب الفئة' : 'By Category'}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {categoryCounts.map(({ key, label, count }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${categoryDotColors[key]}`} />
                <span className="text-xs text-content-secondary">{label}</span>
                <span className="text-xs font-semibold text-content-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all' as const, label: t.common.all, count: customDisplay.length + builtInDisplay.length },
          { key: 'custom' as const, label: t.templatesExt.custom, count: customDisplay.length },
          { key: 'builtin' as const, label: t.templatesExt.builtIn, count: builtInDisplay.length },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface-secondary text-content-secondary hover:text-content-primary'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <h3>{t.templatesPage.title} ({allTemplates.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> {t.templatesPage.addTemplate}
          </button>
        </div>

        {allTemplates.length === 0 ? (
          <EmptyState
            message={lang === 'ar' ? 'لا توجد قوالب بعد. أنشئ أول قالب.' : 'No templates yet.'}
            action={
              <button className="btn btn-primary btn-sm" onClick={openCreate}>
                <Plus size={14} /> {t.templatesPage.addTemplate}
              </button>
            }
          />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`card card-body flex flex-col gap-3 transition-shadow hover:shadow-md ${!tpl.is_active ? 'opacity-60' : ''} ${tpl.isBuiltIn ? 'border-dashed' : ''}`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-content-primary truncate">{tpl.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <Badge variant={categoryColors[tpl.category]}>
                          {t.templatesPage[tpl.category as keyof typeof t.templatesPage] as string}
                        </Badge>
                        {tpl.isBuiltIn ? (
                          <Badge variant="info">
                            <Lock size={9} className="inline -mt-px" />{' '}
                            {t.templatesExt.builtIn}
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            {tpl.language === 'ar' ? (lang === 'ar' ? 'عربي' : 'AR') : tpl.language === 'en' ? (lang === 'ar' ? 'إنجليزي' : 'EN') : (lang === 'ar' ? 'الكل' : 'Any')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!tpl.isBuiltIn && tpl.original && (
                      <Toggle value={tpl.is_active} onChange={() => handleToggle(tpl.id, tpl.is_active)} />
                    )}
                  </div>

                  {/* Body Preview */}
                  <p className="text-xs text-content-secondary line-clamp-3 leading-relaxed flex-1">
                    {tpl.body}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Star Rating Range */}
                  <div className="flex items-center justify-between">
                    <StarDisplay min={tpl.rating_min} max={tpl.rating_max} />
                    {!tpl.isBuiltIn && (
                      <div className="flex items-center gap-1 text-xs text-content-tertiary">
                        <BarChart2 size={12} />
                        <span>{tpl.usage_count}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions — only for custom templates */}
                  {!tpl.isBuiltIn && tpl.original && (
                    <div className="flex items-center justify-end gap-1 pt-1">
                      <button className="btn-icon" onClick={() => openEdit(tpl.original!)} title={t.common.edit}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(tpl.id)} title={t.common.delete}>
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editTemplate ? t.templatesExt.editTemplate : t.templatesPage.addTemplate}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim() || !form.body.trim()}>
                {saving ? t.common.loading : t.common.save}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.common.cancel}</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="form-label">{t.templatesPage.name} *</label>
              <input className="form-input" value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p: TemplateForm) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">{t.templatesPage.body} *</label>
              <textarea className="form-textarea" rows={4} value={form.body} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm((p: TemplateForm) => ({ ...p, body: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t.templatesPage.category}</label>
                <select className="form-select" value={form.category} onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm((p: TemplateForm) => ({ ...p, category: e.target.value }))}>
                  <option value="positive">{t.templatesPage.positive}</option>
                  <option value="negative">{t.templatesPage.negative}</option>
                  <option value="neutral">{t.templatesPage.neutral}</option>
                  <option value="general">{t.templatesPage.general}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{lang === 'ar' ? 'اللغة' : 'Language'}</label>
                <select className="form-select" value={form.language} onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm((p: TemplateForm) => ({ ...p, language: e.target.value as 'ar' | 'en' | 'any' }))}>
                  <option value="ar">{lang === 'ar' ? 'عربي' : 'Arabic'}</option>
                  <option value="en">{lang === 'ar' ? 'إنجليزي' : 'English'}</option>
                  <option value="any">{lang === 'ar' ? 'الكل' : 'Any'}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">{t.templatesPage.ratingRange}</label>
              <div className="flex gap-2">
                <input className="form-input" type="number" min={1} max={5} value={form.rating_min} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p: TemplateForm) => ({ ...p, rating_min: +e.target.value }))} />
                <input className="form-input" type="number" min={1} max={5} value={form.rating_max} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p: TemplateForm) => ({ ...p, rating_max: +e.target.value }))} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
