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

const TICKET_RATE_LIMIT = 5;
const _ticketTimestamps: number[] = [];

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
  const { lang, t } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا — الدعم' : 'SENDA — Support'; }, [lang]);
  const { organization, user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', priority: 'medium' as Ticket['priority'] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Unread admin replies: set of ticket IDs where the last reply is from support
  const [ticketsWithNewReply, setTicketsWithNewReply] = useState<Set<string>>(new Set());

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
      setError(t.supportExt.loadFailed);
    } finally { setLoading(false); }
  }, [organization, lang]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Check which tickets have unread admin replies (last reply is from 'support')
  useEffect(() => {
    if (!tickets.length) { setTicketsWithNewReply(new Set()); return; }
    const checkUnread = async () => {
      try {
        const ticketIds = tickets.map(t => t.id);
        const { data } = await supabase
          .from('ticket_replies')
          .select('id, ticket_id, sender_type, created_at')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: false });
        if (!data) return;
        // For each ticket, find the most recent reply and check if it's from support
        const lastReplyByTicket = new Map<string, { sender_type: string }>();
        for (const reply of data) {
          const tid = (reply as { ticket_id: string }).ticket_id;
          if (!lastReplyByTicket.has(tid)) {
            lastReplyByTicket.set(tid, { sender_type: reply.sender_type });
          }
        }
        const unread = new Set<string>();
        lastReplyByTicket.forEach((val, ticketId) => {
          if (val.sender_type === 'support') unread.add(ticketId);
        });
        setTicketsWithNewReply(unread);
      } catch {
        // Silently ignore — badge is non-critical
      }
    };
    checkUnread();
  }, [tickets]);

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
      setError(t.supportExt.loadRepliesFailed);
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
      setError(t.supportExt.fillAllFields);
      return;
    }
    if (!organization || !user) return;

    // Rate limiting: max 5 tickets per day
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recentCount = _ticketTimestamps.filter(ts => ts > dayAgo).length;
    if (recentCount >= TICKET_RATE_LIMIT) {
      setError(lang === 'ar' ? 'لقد تجاوزت الحد الأقصى لإنشاء التذاكر اليوم. يرجى المحاولة غداً.' : 'You have reached the daily ticket limit. Please try again tomorrow.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('support_tickets').insert({
        organization_id: organization.id,
        subject: form.subject.trim(),
        description: form.body.trim(),
        submitted_by_email: user.email || null,
        submitted_by_name: profile?.full_name || user.email || null,
        priority: form.priority,
        status: 'open',
      });
      if (err) throw err;
      _ticketTimestamps.push(Date.now());
      setSuccess(t.supportExt.ticketSubmitted);
      setForm({ subject: '', body: '', priority: 'medium' });
      setShowForm(false);
      await loadTickets();
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError(t.supportExt.submitFailed);
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
      // Re-fetch the selected ticket directly
      const { data: updated } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', selectedTicket.id)
        .single();
      if (updated) setSelectedTicket(updated);
    } catch {
      setError(t.supportExt.sendReplyFailed);
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
            <button onClick={() => { setSelectedTicket(null); setReplies([]); setReplyBody(''); }} className="p-2 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors" aria-label={lang === 'ar' ? 'العودة للقائمة' : 'Back to list'}>
              <ChevronRight size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-content-primary truncate">{selectedTicket.subject}</h2>
              <p className="text-[10px] text-content-tertiary mt-0.5">#{selectedTicket.id.slice(0, 8)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={status.color}>{(t.status as Record<string, string>)[selectedTicket.status] || selectedTicket.status}</Badge>
              <Badge variant={priority.color}>{t.priority[selectedTicket.priority as keyof typeof t.priority]}</Badge>
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
            <h3>{t.supportExt.conversation}</h3>
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
                    <span className="text-sm font-medium text-content-primary">{selectedTicket.submitted_by_name || t.supportExt.you}</span>
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
                      }`}>{reply.sender_type === 'support' ? t.supportExt.supportTeam : t.supportExt.you}</span>
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
              placeholder={t.supportExt.typeReply}
              aria-label={t.supportExt.typeReply}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-content-tertiary">Ctrl+Enter {t.supportExt.toSend}</span>
              <button
                onClick={handleSendReply}
                disabled={!replyBody.trim() || replySending}
                className="btn btn-primary min-w-[100px]"
              >
                {replySending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t.supportPage.send}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ───
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HelpCircle size={20} className="text-brand-500" />
            {t.supportPage.title}
          </h1>
          <p className="page-subtitle">{t.supportExt.supportSubtitle}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? t.common.cancel : t.supportPage.newTicket}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <MessageSquare size={16} className="text-brand-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{tickets.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.supportExt.totalTickets}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${openTickets > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <Clock size={16} className={openTickets > 0 ? 'text-amber-500' : 'text-gray-400'} />
          </div>
          <div>
            <div className={`text-lg font-bold leading-none ${openTickets > 0 ? 'text-amber-600' : 'text-content-primary'}`}>{openTickets}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.supportExt.processing}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{resolvedTickets}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.supportExt.resolved}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ticketsWithNewReply.size > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <span className={`text-xs font-bold ${ticketsWithNewReply.size > 0 ? 'text-blue-500' : 'text-gray-400'}`}>{ticketsWithNewReply.size}</span>
          </div>
          <div>
            <div className={`text-lg font-bold leading-none ${ticketsWithNewReply.size > 0 ? 'text-blue-600' : 'text-content-primary'}`}>{ticketsWithNewReply.size}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.supportExt.newReplies}</div>
          </div>
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
          <h3 className="text-sm font-semibold text-content-primary">{t.supportExt.newSupportTicket}</h3>
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          <div>
            <label htmlFor="ticket-subject" className="form-label">{t.supportExt.subjectLabel}</label>
            <input id="ticket-subject" className="form-input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={t.supportExt.subjectPlaceholder} />
          </div>
          <div>
            <label className="form-label" id="ticket-priority-label">{t.supportPage.priority}</label>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-labelledby="ticket-priority-label">
              {(['low','medium','high','urgent'] as Ticket['priority'][]).map(p => (
                <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))} role="radio" aria-checked={form.priority === p} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.priority === p ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-content-secondary border-border hover:border-brand-300'}`}>
                  {t.priority[p as keyof typeof t.priority]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="ticket-details" className="form-label">{t.supportExt.detailsLabel}</label>
            <textarea id="ticket-details" className="form-textarea" rows={5} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder={t.supportExt.detailsPlaceholder} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">{t.common.cancel}</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary min-w-[110px]">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? t.supportExt.sending : t.supportExt.submitTicket}
            </button>
          </div>
        </div>
      )}

      {/* Tickets list */}
      <div className="card">
        <div className="card-header">
          <h3>{`${t.supportExt.supportTickets} (${tickets.length})`}</h3>
        </div>
        {tickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-content-tertiary">
            <HelpCircle size={36} strokeWidth={1} className="mx-auto mb-3 text-gray-200" />
            {t.supportExt.noTicketsYet}
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
                  role="button"
                  tabIndex={0}
                  aria-label={`${ticket.subject} — ${(t.status as Record<string, string>)[ticket.status] || ticket.status}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTicket(ticket); } }}
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
                      {ticketsWithNewReply.has(ticket.id) && (
                        <Badge variant="success">{t.supportExt.newReply}</Badge>
                      )}
                      <Badge variant={status.color}>{(t.status as Record<string, string>)[ticket.status] || ticket.status}</Badge>
                      <Badge variant={priority.color}>{t.priority[ticket.priority as keyof typeof t.priority]}</Badge>
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
