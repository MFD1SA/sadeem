import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { HelpCircle, Plus, X, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  open:        { label: 'مفتوحة',    labelEn: 'Open',        color: 'info'    as const, icon: MessageSquare },
  in_progress: { label: 'قيد المعالجة', labelEn: 'In Progress', color: 'warning' as const, icon: Clock },
  resolved:    { label: 'محلولة',    labelEn: 'Resolved',    color: 'success' as const, icon: CheckCircle },
  closed:      { label: 'مغلقة',     labelEn: 'Closed',      color: 'neutral' as const, icon: X },
};

const PRIORITY_CONFIG = {
  low:    { label: 'منخفض', labelEn: 'Low',    color: 'neutral' as const },
  medium: { label: 'متوسط', labelEn: 'Medium', color: 'warning' as const },
  high:   { label: 'عالي',  labelEn: 'High',   color: 'danger'  as const },
  urgent: { label: 'عاجل',  labelEn: 'Urgent', color: 'danger'  as const },
};

export default function Support() {
  const { lang } = useLanguage();
  const { organization, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', priority: 'medium' as Ticket['priority'] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTickets = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      setTickets((data || []) as Ticket[]);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      setError(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (!organization || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('support_tickets').insert({
        organization_id: organization.id,
        user_id: user.id,
        subject: form.subject.trim(),
        body: form.body.trim(),
        priority: form.priority,
        status: 'open',
      });
      if (err) throw err;
      setSuccess(lang === 'ar' ? 'تم إرسال التذكرة بنجاح. سنرد عليك خلال 24 ساعة.' : 'Ticket submitted. We\'ll respond within 24 hours.');
      setForm({ subject: '', body: '', priority: 'medium' });
      setShowForm(false);
      await loadTickets();
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError(lang === 'ar' ? 'فشل إرسال التذكرة. يرجى المحاولة لاحقاً.' : 'Failed to submit ticket. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card card-body">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-content-primary">{lang === 'ar' ? 'الدعم الفني' : 'Support'}</h2>
              <p className="text-xs text-content-tertiary mt-0.5">{lang === 'ar' ? 'نرد خلال 24 ساعة • support@sadeem.sa' : 'We respond within 24h • support@sadeem.sa'}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? (lang === 'ar' ? 'إلغاء' : 'Cancel') : (lang === 'ar' ? 'تذكرة جديدة' : 'New Ticket')}
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle size={15} className="mt-0.5 flex-shrink-0" /> {success}
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <div className="card card-body space-y-4">
          <h3 className="text-sm font-semibold text-content-primary">{lang === 'ar' ? 'تذكرة دعم جديدة' : 'New Support Ticket'}</h3>
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="form-label">{lang === 'ar' ? 'عنوان المشكلة *' : 'Subject *'}</label>
            <input className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={lang === 'ar' ? 'وصف مختصر للمشكلة' : 'Brief description of your issue'} />
          </div>
          <div>
            <label className="form-label">{lang === 'ar' ? 'الأولوية' : 'Priority'}</label>
            <div className="flex gap-2 flex-wrap">
              {(['low','medium','high','urgent'] as Ticket['priority'][]).map(p => (
                <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.priority === p ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-content-secondary border-border hover:border-brand-300'}`}>
                  {lang === 'ar' ? PRIORITY_CONFIG[p].label : PRIORITY_CONFIG[p].labelEn}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">{lang === 'ar' ? 'تفاصيل المشكلة *' : 'Details *'}</label>
            <textarea className="form-textarea" rows={5} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder={lang === 'ar' ? 'اشرح مشكلتك بالتفصيل...' : 'Describe your issue in detail...'} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary min-w-[110px]">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (lang === 'ar' ? 'إرسال التذكرة' : 'Submit Ticket')}
            </button>
          </div>
        </div>
      )}

      {/* Tickets list */}
      <div className="card">
        <div className="card-header">
          <h3>{lang === 'ar' ? `تذاكر الدعم (${tickets.length})` : `Support Tickets (${tickets.length})`}</h3>
        </div>
        {tickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-content-tertiary">
            <HelpCircle size={36} strokeWidth={1} className="mx-auto mb-3 text-gray-200" />
            {lang === 'ar' ? 'لا توجد تذاكر دعم حتى الآن' : 'No support tickets yet'}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {tickets.map(ticket => {
              const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
              const StatusIcon = status.icon;
              return (
                <div key={ticket.id} className="px-5 py-4 hover:bg-surface-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0 mt-0.5">
                        <StatusIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-content-primary truncate">{ticket.subject}</div>
                        <div className="text-xs text-content-tertiary mt-0.5 line-clamp-1">{ticket.body}</div>
                        <div className="text-[10px] text-content-tertiary mt-1">{new Date(ticket.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Badge variant={status.color}>{lang === 'ar' ? status.label : status.labelEn}</Badge>
                      <Badge variant={priority.color}>{lang === 'ar' ? priority.label : priority.labelEn}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
