// ============================================================================
// SADEEM Admin — Support Tickets
// List + detail + reply + status actions + who replied
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminTicketsService, type TicketItem } from '../services/adminTickets.service';
import { PERMISSIONS } from '../utils/constants';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Headphones, CheckCircle, Clock, ChevronLeft, User, Building2, Calendar, Tag, Send, MessageSquare, Reply } from 'lucide-react';

const STATUS_MAP: Record<string, { ar: string; color: string; next: string[]; nextLabels: string[] }> = {
  open: { ar: 'مفتوحة', color: 'blue', next: ['in_progress', 'resolved', 'closed'], nextLabels: ['بدء المعالجة', 'حل مباشر', 'إغلاق'] },
  in_progress: { ar: 'قيد المعالجة', color: 'amber', next: ['resolved', 'closed'], nextLabels: ['تم الحل', 'إغلاق'] },
  resolved: { ar: 'محلولة', color: 'emerald', next: ['closed', 'open'], nextLabels: ['إغلاق نهائي', 'إعادة فتح'] },
  closed: { ar: 'مغلقة', color: 'slate', next: ['open'], nextLabels: ['إعادة فتح'] },
};

const PRIORITY_MAP: Record<string, { ar: string; color: string }> = {
  low: { ar: 'منخفضة', color: 'slate' }, medium: { ar: 'متوسطة', color: 'blue' },
  high: { ar: 'عالية', color: 'amber' }, urgent: { ar: 'عاجلة', color: 'red' },
};

const statusColor = (s: string) =>
  s === 'open' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
  s === 'in_progress' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
  s === 'resolved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
  'bg-slate-500/15 text-slate-400 border-slate-500/20';

const prioColor = (p: string) =>
  p === 'urgent' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
  p === 'high' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
  p === 'medium' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
  'bg-slate-500/15 text-slate-400 border-slate-500/20';

export default function AdminTickets() {
  const { hasPermission, user } = useAdminAuth();
  const canManage = hasPermission(PERMISSIONS.SUPPORT_MANAGE);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [selected, setSelected] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const showMsg = (t: string, ty: 'success' | 'error') => { setMsg({ text: t, type: ty }); setTimeout(() => setMsg(null), 4000); };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const r = await adminTicketsService.list({ status: filterStatus || undefined, priority: filterPriority || undefined });
      setTickets(r.data); setTotal(r.total);
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل'); }
    finally { setIsLoading(false); }
  }, [filterStatus, filterPriority]);

  useEffect(() => { loadData(); }, [loadData]);

  const openTicket = async (t: TicketItem) => {
    setDetailLoading(true);
    setSelected(t);
    setReplyText(t.admin_reply || '');
    const full = await adminTicketsService.getTicket(t.id);
    if (full) { setSelected(full); setReplyText(full.admin_reply || ''); }
    setDetailLoading(false);
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await adminTicketsService.updateStatus(id, status);
      showMsg('تم تحديث حالة التذكرة', 'success');
      loadData();
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status, updated_at: new Date().toISOString() } : null);
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل', 'error'); }
  };

  const handleSendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const adminName = user?.full_name_ar || user?.email || 'مشرف';
      await adminTicketsService.replyToTicket(selected.id, replyText.trim(), adminName);
      const updated: TicketItem = {
        ...selected,
        admin_reply: replyText.trim(),
        admin_replied_by_name: adminName,
        replied_at: new Date().toISOString(),
        status: selected.status === 'open' ? 'in_progress' : selected.status,
      };
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: updated.status } : t));
      showMsg('تم إرسال الرد بنجاح', 'success');
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل', 'error'); }
    finally { setSendingReply(false); }
  };

  // ─── Detail View ───
  if (selected) {
    const si = STATUS_MAP[selected.status] || STATUS_MAP.open;
    const pi = PRIORITY_MAP[selected.priority] || PRIORITY_MAP.medium;

    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setSelected(null); setReplyText(''); }} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">{selected.subject}</h1>
            <p className="text-xs text-slate-500">#{selected.id.slice(0, 8)}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusColor(selected.status)}`}>{si.ar}</span>
        </div>

        {msg && <div className={`text-xs rounded-lg p-3 mb-4 border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}

        {detailLoading && <div className="flex justify-center py-6"><div className="admin-spinner" /></div>}

        {!detailLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Ticket body */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-slate-400" />
                    <h3>رسالة العميل</h3>
                  </div>
                </div>
                <div className="admin-card-body">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selected.body || selected.subject || '—'}
                  </p>
                </div>
              </div>

              {/* Previous reply if exists */}
              {selected.admin_reply && (
                <div className="admin-card" style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)' }}>
                  <div className="admin-card-header">
                    <div className="flex items-center gap-2">
                      <Reply size={14} className="text-indigo-400" />
                      <h3 className="text-indigo-300">الرد المُرسل</h3>
                    </div>
                    {selected.admin_replied_by_name && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User size={12} />
                        <span>{selected.admin_replied_by_name}</span>
                        {selected.replied_at && (
                          <span className="text-slate-500">• {new Date(selected.replied_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="admin-card-body">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selected.admin_reply}</p>
                  </div>
                </div>
              )}

              {/* Reply form */}
              {canManage && (
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div className="flex items-center gap-2">
                      <Send size={14} className="text-slate-400" />
                      <h3>{selected.admin_reply ? 'تعديل الرد' : 'الرد على التذكرة'}</h3>
                    </div>
                  </div>
                  <div className="admin-card-body space-y-3">
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      rows={5}
                      placeholder="اكتب ردك على العميل هنا..."
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-white resize-y"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">سيتم إرسال الرد للعميل عبر البريد الإلكتروني</p>
                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="admin-btn-primary text-xs px-4 py-2"
                      >
                        <Send size={13} />
                        {sendingReply ? 'جاري الإرسال...' : (selected.admin_reply ? 'تحديث الرد' : 'إرسال الرد')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status actions */}
              {canManage && si.next.length > 0 && (
                <div className="admin-card">
                  <div className="admin-card-header"><h3>تحديث الحالة</h3></div>
                  <div className="admin-card-body">
                    <div className="flex flex-wrap gap-2">
                      {si.next.map((ns, i) => (
                        <button key={ns} onClick={() => handleStatus(selected.id, ns)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            ns === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' :
                            ns === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' :
                            ns === 'closed' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                          }`}>
                          {si.nextLabels[i]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              <div className="admin-card">
                <div className="admin-card-header"><h3>معلومات التذكرة</h3></div>
                <div className="admin-card-body space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">الأولوية:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${prioColor(selected.priority)}`}>{pi.ar}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400 text-xs">العميل:</span>
                    <span className="text-white text-xs">{selected.submitted_by_name || '—'}</span>
                  </div>
                  {selected.submitted_by_email && (
                    <div className="flex items-start gap-2 pr-5">
                      <span className="text-xs text-slate-500 break-all" dir="ltr">{selected.submitted_by_email}</span>
                    </div>
                  )}
                  {selected.org_name && (
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-slate-500 flex-shrink-0" />
                      <span className="text-slate-400 text-xs">المنشأة:</span>
                      <span className="text-white text-xs">{selected.org_name}</span>
                    </div>
                  )}
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-500 flex-shrink-0" />
                      <span className="text-slate-400 text-xs">تاريخ الإنشاء:</span>
                      <span className="text-slate-300 text-xs">{new Date(selected.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    {selected.replied_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-slate-400 text-xs">تاريخ الرد:</span>
                        <span className="text-emerald-400 text-xs">{new Date(selected.replied_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                    {selected.admin_replied_by_name && (
                      <div className="flex items-center gap-2">
                        <User size={13} className="text-indigo-400 flex-shrink-0" />
                        <span className="text-slate-400 text-xs">رد بواسطة:</span>
                        <span className="text-indigo-300 text-xs font-medium">{selected.admin_replied_by_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── List View ───
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white mb-1">الدعم الفني</h1>
        <p className="text-xs text-slate-400">إدارة تذاكر الدعم ({total} تذكرة)</p>
      </div>
      {msg && <div className={`text-xs rounded-lg p-3 mb-4 border ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.text}</div>}

      <div className="admin-card mb-3">
        <div className="p-3 flex flex-wrap items-center gap-2">
          <select className="admin-form-input w-auto min-w-[120px] text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="open">مفتوحة</option>
            <option value="in_progress">قيد المعالجة</option>
            <option value="resolved">محلولة</option>
            <option value="closed">مغلقة</option>
          </select>
          <select className="admin-form-input w-auto min-w-[120px] text-xs" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="urgent">عاجلة</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>
        </div>
      </div>

      <div className="admin-card">
        {isLoading ? <div className="flex items-center justify-center py-12"><div className="admin-spinner" /></div>
        : error ? <div className="text-center py-12"><p className="text-sm text-red-400 mb-3">{error}</p><button onClick={loadData} className="admin-btn-secondary text-xs">إعادة المحاولة</button></div>
        : tickets.length === 0 ? <div className="text-center py-12"><Headphones size={36} className="text-slate-700 mx-auto mb-3" /><p className="text-xs text-slate-500">لا توجد تذاكر</p></div>
        : <div className="overflow-x-auto"><table className="admin-table"><thead><tr>
          <th>الموضوع</th><th>العميل</th><th>الأولوية</th><th>الحالة</th><th>الرد</th><th>التاريخ</th>
        </tr></thead><tbody>
          {tickets.map((t) => {
            const si = STATUS_MAP[t.status] || STATUS_MAP.open;
            const pi = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
            return (
              <tr key={t.id} className="cursor-pointer" onClick={() => openTicket(t)}>
                <td>
                  <div className="text-sm text-white">{t.subject}</div>
                  {t.org_name && <div className="text-xs text-slate-500">{t.org_name}</div>}
                </td>
                <td><span className="text-xs text-slate-300">{t.submitted_by_name || '—'}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${prioColor(t.priority)}`}>{pi.ar}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor(t.status)}`}>{si.ar}</span></td>
                <td>
                  {t.admin_replied_by_name ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400">{t.admin_replied_by_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">لم يُرد بعد</span>
                  )}
                </td>
                <td><span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</span></td>
              </tr>
            );
          })}
        </tbody></table></div>}
      </div>
    </div>
  );
}
