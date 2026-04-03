// ============================================================================
// SADEEM — Tasks Page
// DB-backed task management with smart suggestions from dashboard stats.
// ============================================================================

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { tasksService, type DbTask } from '@/services/tasks';
import { dashboardService } from '@/services/dashboard';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { Modal } from '@/components/ui/Modal';
import {
  CheckCircle, Circle, Plus, Trash2, Sparkles,
  MessageSquare, Camera, FileText, BarChart2,
} from 'lucide-react';

const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger', medium: 'warning', low: 'neutral',
};

const PRIORITY_LABEL_AR: Record<string, string> = { high: 'مهم', medium: 'متوسط', low: 'منخفض' };
const PRIORITY_LABEL_EN: Record<string, string> = { high: 'High', medium: 'Med', low: 'Low' };

export default function Tasks() {
  const { lang } = useLanguage();
  const { organization } = useAuth();

  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as DbTask['priority'] });
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Smart suggestions generated from live stats
  const [suggestions, setSuggestions] = useState<Array<{
    id: string; icon: React.ReactNode; titleAr: string; titleEn: string;
    descAr: string; descEn: string; priority: DbTask['priority'];
  }>>([]);

  const loadAll = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoadError('');
    try {
      const [dbTasks, stats] = await Promise.all([
        tasksService.list(organization.id),
        dashboardService.getStats(organization.id).catch(() => null),
      ]);
      setTasks(dbTasks);

      // Build smart suggestions from current stats
      const s: typeof suggestions = [];
      if (stats) {
        if (stats.unrepliedCount > 0) {
          s.push({
            id: 'smart_reply',
            icon: <MessageSquare size={14} />,
            titleAr: `رد على ${stats.unrepliedCount} تقييم بدون رد`,
            titleEn: `Reply to ${stats.unrepliedCount} unanswered reviews`,
            descAr: 'الرد السريع يحسّن تقييمك على Google',
            descEn: 'Quick responses boost your Google ranking',
            priority: 'high',
          });
        }
        if (stats.responseRate < 80) {
          s.push({
            id: 'smart_rate',
            icon: <BarChart2 size={14} />,
            titleAr: `ارفع نسبة الرد من ${stats.responseRate}% إلى 80%+`,
            titleEn: `Raise response rate from ${stats.responseRate}% to 80%+`,
            descAr: 'نسبة الرد العالية تؤثر إيجابياً على ترتيبك',
            descEn: 'High response rate positively impacts your ranking',
            priority: 'medium',
          });
        }
      }
      s.push(
        {
          id: 'smart_photos',
          icon: <Camera size={14} />,
          titleAr: 'أضف صوراً جديدة لنشاطك على Google',
          titleEn: 'Add new photos to your Google listing',
          descAr: 'الصور تزيد تفاعل العملاء بنسبة 42%',
          descEn: 'Photos increase customer engagement by 42%',
          priority: 'medium',
        },
        {
          id: 'smart_desc',
          icon: <FileText size={14} />,
          titleAr: 'حدّث وصف نشاطك التجاري',
          titleEn: 'Update your business description',
          descAr: 'وصف محدّث بالكلمات المفتاحية يحسّن ظهورك',
          descEn: 'Updated keywords improve search visibility',
          priority: 'low',
        }
      );
      setSuggestions(s);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggle = async (task: DbTask) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === 'pending' ? 'done' : 'pending' } : t));
    try {
      await tasksService.toggleStatus(task.id, task.status);
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDelete = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await tasksService.remove(taskId).catch(() => loadAll());
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { setFormError(lang === 'ar' ? 'العنوان مطلوب' : 'Title is required'); return; }
    if (!organization) return;
    setSaving(true);
    setFormError('');
    try {
      await tasksService.create({
        organization_id: organization.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        source: 'manual',
      });
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium' });
      await loadAll();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSuggestion = async (s: typeof suggestions[0]) => {
    if (!organization) return;
    try {
      await tasksService.create({
        organization_id: organization.id,
        title: lang === 'ar' ? s.titleAr : s.titleEn,
        description: lang === 'ar' ? s.descAr : s.descEn,
        priority: s.priority,
        source: 'smart',
      });
      await loadAll();
    } catch (err) {
      console.warn('[Sadeem] Failed to add suggestion:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (loadError && tasks.length === 0) return <ErrorState message={loadError} onRetry={loadAll} />;

  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'done');

  // Suggestions not already in tasks (by title matching)
  const taskTitles = new Set(tasks.map(t => t.title));
  const activeSuggestions = suggestions.filter(s =>
    !taskTitles.has(lang === 'ar' ? s.titleAr : s.titleEn)
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-content-primary">
            {lang === 'ar' ? 'المهام' : 'Tasks'}
          </h2>
          <p className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar'
              ? `${pending.length} مهمة معلقة`
              : `${pending.length} pending`}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <Plus size={14} />
          {lang === 'ar' ? 'مهمة جديدة' : 'New Task'}
        </button>
      </div>

      {/* Smart Suggestions */}
      {activeSuggestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <h3>{lang === 'ar' ? 'اقتراحات ذكية' : 'Smart Suggestions'}</h3>
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {activeSuggestions.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <div className="text-content-tertiary flex-shrink-0">{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-content-primary">
                    {lang === 'ar' ? s.titleAr : s.titleEn}
                  </div>
                  <div className="text-2xs text-content-tertiary">
                    {lang === 'ar' ? s.descAr : s.descEn}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={PRIORITY_BADGE[s.priority]}>
                    {lang === 'ar' ? PRIORITY_LABEL_AR[s.priority] : PRIORITY_LABEL_EN[s.priority]}
                  </Badge>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddSuggestion(s)}
                    title={lang === 'ar' ? 'إضافة كمهمة' : 'Add as task'}
                  >
                    <Plus size={12} />
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      <div className="card">
        <div className="card-header">
          <h3>{lang === 'ar' ? 'المهام المعلقة' : 'Pending'}</h3>
          <Badge variant={pending.length > 0 ? 'warning' : 'success'}>{pending.length}</Badge>
        </div>
        {pending.length === 0 ? (
          <div className="py-10 text-center text-sm text-content-tertiary">
            {lang === 'ar' ? 'لا توجد مهام معلقة' : 'No pending tasks'}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {pending.map(task => (
              <TaskRow key={task.id} task={task} lang={lang} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {done.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>{lang === 'ar' ? 'المكتملة' : 'Completed'}</h3>
            <Badge variant="success">{done.length}</Badge>
          </div>
          <div className="divide-y divide-border/60">
            {done.map(task => (
              <TaskRow key={task.id} task={task} lang={lang} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showForm && (
        <Modal
          title={lang === 'ar' ? 'مهمة جديدة' : 'New Task'}
          onClose={() => { setShowForm(false); setFormError(''); }}
          footer={
            <>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !form.title.trim()}>
                {saving ? (lang === 'ar' ? 'جاري الحفظ…' : 'Saving…') : (lang === 'ar' ? 'إضافة' : 'Add Task')}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {formError && (
              <div className="text-xs rounded-md p-3 bg-red-50 text-red-700 border border-red-200">{formError}</div>
            )}
            <div>
              <label className="form-label">{lang === 'ar' ? 'العنوان' : 'Title'} *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder={lang === 'ar' ? 'وصف المهمة...' : 'Task title...'}
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">{lang === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
              <select
                className="form-select"
                value={form.priority}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm(p => ({ ...p, priority: e.target.value as DbTask['priority'] }))}
              >
                <option value="high">{lang === 'ar' ? 'مهم' : 'High'}</option>
                <option value="medium">{lang === 'ar' ? 'متوسط' : 'Medium'}</option>
                <option value="low">{lang === 'ar' ? 'منخفض' : 'Low'}</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskRow({ task, lang, onToggle, onDelete }: {
  task: DbTask;
  lang: string;
  onToggle: (t: DbTask) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = task.status === 'done';
  return (
    <div className={`px-5 py-3.5 flex items-start gap-3 ${isDone ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 flex-shrink-0 transition-colors hover:text-brand-600"
        title={isDone ? 'Mark pending' : 'Mark done'}
      >
        {isDone
          ? <CheckCircle size={18} className="text-emerald-500" />
          : <Circle size={18} className="text-content-tertiary" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-[13px] font-medium ${isDone ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-2xs text-content-tertiary mt-0.5 line-clamp-1">{task.description}</div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {task.source === 'smart' && (
          <span title={lang === 'ar' ? 'مقترح ذكي' : 'Smart suggestion'}>
            <Sparkles size={12} className="text-amber-400" />
          </span>
        )}
        <Badge variant={PRIORITY_BADGE[task.priority]}>
          {lang === 'ar' ? PRIORITY_LABEL_AR[task.priority] : PRIORITY_LABEL_EN[task.priority]}
        </Badge>
        <button
          className="btn-icon text-red-400 hover:text-red-600"
          onClick={() => onDelete(task.id)}
          title={lang === 'ar' ? 'حذف' : 'Delete'}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
