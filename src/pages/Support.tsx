import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { Badge } from '@/components/ui/Badge';
import { HelpCircle, Plus, X, Send, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2, ChevronRight, User } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  submitted_by_name: string | null;
}

interface TicketReply {
  id: string;
  sender_type: 'customer' | 'support';
  sender_name: string;
  body: string;
  created_at: string;
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

  // Detail / thread state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      setTickets((data || []) as Ticket[]);
    } catch {
      setError(lang === 'ar' ? 'فشل في تحميل التذاكر' : 'Failed to load tickets');
    } finally { setLoading(false); }
  }, [organization, lang]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Load replies for selected ticket
  const loadReplies = useCallback(async (ticketId: string) => {
    try {
      setRepliesLoading(true);
      const { data, error: err } = await supabase
        .from('ticket_replies')
        .select('id, sender_type, sender_name, body, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setReplies((data || []) as TicketReply[]);
    } catch {
      setReplies([]);
      setError(lang === 'ar' ? 'فشل في تحميل الردود' : 'Failed to load replies');
      setTimeout(() => setError(''), 4000);
    } finally {
      setRepliesLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    if (selectedTicket) loadReplies(selectedTicket.id);
    else setReplies([]);
  }, [selectedTicket, loadReplies]);

  // Scroll to bottom when replies update
  useEffect(() => {
    if (replies.length) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies.length]);

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
        subject: form.subject.trim(),
        description: form.body.trim(),
        submitted_by_email: user.email || null,
        submitted_by_name: user.email || null,
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

  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedTicket) return;
    try {
      setReplySending(true);
      const { error: err } = await supabase.rpc('subscriber_add_ticket_reply', {
        p_ticket_id: selectedTicket.id,
        p_body: replyBody.trim(),
      });
      if (err) throw err;
      setReplyBody('');
      // Reload replies and ticket list (status may have changed)
      await loadReplies(selectedTicket.id);
      await loadTickets();
      // Update selected ticket status if it was reopened
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    } catch {
      setError(lang === 'ar' ? 'فشل في إرسال الرد' : 'Failed to send reply');
      setTimeout(() => setError(''), 4000);
    } finally {
      setReplySending(false);
    }
  };

  if (loading) return <LoadingState />;

  // ─── Ticket Detail View ───
  if (selectedTicket) {
    const status = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
    const priority = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.medium;

    return (
      <div className="space-y-4">
        {/* Back + header */}
        <div className="card card-body">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedTicket(null); setReplies([]); setReplyBody(''); }} className="p-2 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors">
              <ChevronRight size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-content-primary truncate">{selectedTicket.subject}</h2>
              <p className="text-[10px] text-content-tertiary mt-0.5">#{selectedTicket.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={status.color}>{lang === 'ar' ? status.label : status.labelEn}</Badge>
              <Badge variant={priority.color}>{lang === 'ar' ? priority.label : priority.labelEn}</Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Conversation thread */}
        <div className="card">
          <div className="card-header">
            <h3>{lang === 'ar' ? 'المحادثة' : 'Conversation'}</h3>
          </div>
          <div className="divide-y divide-border/40">
            {/* Original ticket message */}
            <div className="px-5 py-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-content-primary">{selectedTicket.submitted_by_name || (lang === 'ar' ? 'أنت' : 'You')}</span>
                    <span className="text-[10px] text-content-tertiary">{new Date(selectedTicket.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {selectedTicket.description && (
                    <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Loading replies */}
            {repliesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-content-tertiary" />
              </div>
            )}

            {/* Replies */}
            {!repliesLoading && replies.map((reply) => (
              <div key={reply.id} className="px-5 py-4">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    reply.sender_type === 'support' ? 'bg-emerald-50' : 'bg-brand-50'
                  }`}>
                    <User size={14} className={reply.sender_type === 'support' ? 'text-emerald-600' : 'text-brand-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-content-primary">{reply.sender_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        reply.sender_type === 'support' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'
                      }`}>{reply.sender_type === 'support' ? (lang === 'ar' ? 'دعم فني' : 'Support') : (lang === 'ar' ? 'أنت' : 'You')}</span>
                      <span className="text-[10px] text-content-tertiary">{new Date(reply.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>
        </div>

        {/* Reply form — only if ticket is not closed */}
        {selectedTicket.status !== 'closed' && (
          <div className="card card-body">
            <textarea
              className="form-textarea w-full"
              rows={3}
              placeholder={lang === 'ar' ? 'اكتب ردك هنا...' : 'Type your reply...'}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-content-tertiary">Ctrl+Enter {lang === 'ar' ? 'للإرسال' : 'to send'}</span>
              <button
                onClick={handleSendReply}
                disabled={!replyBody.trim() || replySending}
                className="btn btn-primary min-w-[100px]"
              >
                {replySending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {lang === 'ar' ? 'إرسال' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ───
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

      {/* Error message */}
      {error && !showForm && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

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
                <div
                  key={ticket.id}
                  className="px-5 py-4 hover:bg-surface-secondary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0 mt-0.5">
                        <StatusIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-content-primary truncate">{ticket.subject}</div>
                        <div className="text-xs text-content-tertiary mt-0.5 line-clamp-1">{ticket.description}</div>
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
