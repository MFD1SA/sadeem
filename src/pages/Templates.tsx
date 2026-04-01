import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { templatesService } from '@/services/templates';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import type { DbReplyTemplate } from '@/types/database';

type TemplateForm = { name: string; body: string; category: string; rating_min: number; rating_max: number; is_active: boolean };

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

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>{t.templatesPage.title} ({templates.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> {t.templatesPage.addTemplate}</button>
        </div>
        {templates.length === 0 ? (
          <EmptyState
            message={lang === 'ar' ? 'لا توجد قوالب بعد. أنشئ أول قالب.' : 'No templates yet.'}
            action={<button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> {t.templatesPage.addTemplate}</button>}
          />
        ) : (
          <div className="divide-y divide-border">
            {templates.map((tpl: DbReplyTemplate) => (
              <div key={tpl.id} className="px-5 py-4 hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-content-primary">{tpl.name}</span>
                    <Badge variant={categoryColors[tpl.category]}>{t.templatesPage[tpl.category as keyof typeof t.templatesPage] as string}</Badge>
                    {!tpl.is_active && <Badge variant="neutral">{t.status.inactive}</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle value={tpl.is_active} onChange={() => handleToggle(tpl.id, tpl.is_active)} />
                    <button className="btn-icon" onClick={() => openEdit(tpl)}><Edit3 size={14} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(tpl.id)}><Trash2 size={14} className="text-red-500" /></button>
                  </div>
                </div>
                <p className="text-xs text-content-secondary mb-2 line-clamp-2">{tpl.body}</p>
                <div className="flex items-center gap-4 text-2xs text-content-tertiary">
                  <span>{t.templatesPage.ratingRange}: {tpl.rating_min}–{tpl.rating_max} ★</span>
                  <span>{t.templatesPage.usage}: {tpl.usage_count}</span>
                </div>
              </div>
            ))}
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
