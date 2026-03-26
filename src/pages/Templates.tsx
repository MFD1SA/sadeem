import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { templatesService } from '@/services/templates';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Plus, Edit3, Trash2, BarChart2 } from 'lucide-react';
import type { DbReplyTemplate } from '@/types/database';

type TemplateForm = { name: string; body: string; category: string; rating_min: number; rating_max: number; is_active: boolean };

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
  const [templates, setTemplates] = useState<DbReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<DbReplyTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TemplateForm>({
    name: '', body: '', category: 'general', rating_min: 1, rating_max: 5, is_active: true,
  });

  const loadTemplates = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const data = await templatesService.list(organization.id);
      setTemplates(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: '', body: '', category: 'general', rating_min: 1, rating_max: 5, is_active: true });
    setShowModal(true);
  };

  const openEdit = (tpl: DbReplyTemplate) => {
    setEditTemplate(tpl);
    setForm({
      name: tpl.name, body: tpl.body, category: tpl.category,
      rating_min: tpl.rating_min, rating_max: tpl.rating_max, is_active: tpl.is_active,
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
        });
      } else {
        await templatesService.create({
          organization_id: organization.id,
          name: form.name, body: form.body, category: form.category,
          rating_min: form.rating_min, rating_max: form.rating_max, is_active: form.is_active,
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
    } catch {}
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await templatesService.toggleActive(id, !current);
      await loadTemplates();
    } catch {}
  };

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error && templates.length === 0) return <ErrorState message={error} onRetry={loadTemplates} />;

  const categoryColors: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
    positive: 'success', negative: 'danger', neutral: 'warning', general: 'neutral',
  };

  const categoryDotColors: Record<string, string> = {
    positive: 'bg-green-500',
    negative: 'bg-red-500',
    neutral: 'bg-amber-500',
    general: 'bg-slate-400',
  };

  const activeCount = templates.filter((tpl) => tpl.is_active).length;
  const categoryCounts = ['positive', 'negative', 'neutral', 'general'].map((cat) => ({
    key: cat,
    label: t.templatesPage[cat as keyof typeof t.templatesPage] as string,
    count: templates.filter((tpl) => tpl.category === cat).length,
  }));

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-content-primary">{templates.length}</div>
          <div className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar' ? 'إجمالي القوالب' : 'Total Templates'}
          </div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-content-primary">{activeCount}</div>
          <div className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar' ? 'القوالب النشطة' : 'Active Templates'}
          </div>
        </div>
        <div className="card card-body col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-content-secondary mb-2">
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

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <h3>{t.templatesPage.title} ({templates.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> {t.templatesPage.addTemplate}
          </button>
        </div>

        {templates.length === 0 ? (
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
              {templates.map((tpl: DbReplyTemplate) => (
                <div
                  key={tpl.id}
                  className={`card card-body flex flex-col gap-3 transition-shadow hover:shadow-md ${!tpl.is_active ? 'opacity-60' : ''}`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-content-primary truncate">{tpl.name}</div>
                      <div className="mt-1">
                        <Badge variant={categoryColors[tpl.category]}>
                          {t.templatesPage[tpl.category as keyof typeof t.templatesPage] as string}
                        </Badge>
                      </div>
                    </div>
                    <Toggle value={tpl.is_active} onChange={() => handleToggle(tpl.id, tpl.is_active)} />
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
                    <div className="flex items-center gap-1 text-xs text-content-tertiary">
                      <BarChart2 size={12} />
                      <span>{tpl.usage_count}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button className="btn-icon" onClick={() => openEdit(tpl)} title={t.common.edit}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(tpl.id)} title={t.common.delete}>
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editTemplate ? (lang === 'ar' ? 'تعديل القالب' : 'Edit Template') : t.templatesPage.addTemplate}
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
                <label className="form-label">{t.templatesPage.ratingRange}</label>
                <div className="flex gap-2">
                  <input className="form-input" type="number" min={1} max={5} value={form.rating_min} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p: TemplateForm) => ({ ...p, rating_min: +e.target.value }))} />
                  <input className="form-input" type="number" min={1} max={5} value={form.rating_max} onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((p: TemplateForm) => ({ ...p, rating_max: +e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
