// ============================================================================
// SADEEM Admin — Support Tickets (with Reply Threading)
// List + detail panel + reply thread + status actions.
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminTicketsService, type TicketItem, type TicketDetail, type TicketReply } from '../services/adminTickets.service';
import { PERMISSIONS } from '../utils/constants';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Headphones, ChevronLeft, User, Building2, Calendar, Clock, Tag, Send, Loader2 } from 'lucide-react';

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

const statusColor = (s: string) => s === 'open' ? 'bg-blue-500/10 text-blue-600' : s === 'in_progress' ? 'bg-amber-500/10 text-amber-600' : s === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600';
const prioColor = (p: string) => p === 'urgent' ? 'bg-red-500/10 text-red-600' : p === 'high' ? 'bg-amber-500/10 text-amber-600' : p === 'medium' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-600';

export default function AdminTickets() {
  const { hasPermission } = useAdminAuth();
  const canManage = hasPermission(PERMISSIONS.SUPPORT_MANAGE);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Detail state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replySending, setReplySending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

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

  // Load ticket detail when selected
  const loadDetail = useCallback(async (ticketId: string) => {
    try {
      setDetailLoading(true);
      const d = await adminTicketsService.getDetail(ticketId);
      setDetail(d);
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'فشل في جلب التفاصيل', 'error');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  // Scroll to bottom of thread when replies change
  useEffect(() => {
    if (detail?.replies?.length) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detail?.replies?.length]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await adminTicketsService.updateStatus(id, status);
      showMsg('تم تحديث حالة التذكرة', 'success');
      loadData();
      if (detail && detail.id === id) {
        setDetail({ ...detail, status, updated_at: new Date().toISOString() });
      }
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل', 'error'); }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !detail) return;
    try {
      setReplySending(true);
      await adminTicketsService.addReply(detail.id, replyBody.trim());
      setReplyBody('');
      showMsg('تم إرسال الرد', 'success');
      // Reload detail to get updated replies and status
      await loadDetail(detail.id);
    } catch (e) {
      showMsg(e instanceof Error ? e.message : 'فشل في إرسال الرد', 'error');
    } finally {
      setReplySending(false);
    }
  };

  // ─── Detail View ───
  if (selectedId) {
    if (detailLoading || !detail) {
      return (
        <div className="flex items-center justify-center py-24">
          <div className="admin-spinner" />
        </div>
      );
    }

    const si = STATUS_MAP[detail.status] || STATUS_MAP.open;
    const pi = PRIORITY_MAP[detail.priority] || PRIORITY_MAP.medium;

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setSelectedId(null); loadData(); }} className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{detail.subject}</h1>
            <p className="text-xs text-slate-500">تذكرة #{detail.id.slice(0, 8)}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusColor(detail.status)}`}>{si.ar}</span>
        </div>

        {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border border-red-500/20 text-red-600'}`}>{msg.text}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content — thread */}
          <div className="lg:col-span-2 space-y-4">
            {/* Conversation thread */}
            <div className="admin-card">
              <div className="admin-card-header"><h3>المحادثة</h3></div>
              <div className="admin-card-body space-y-0">
                {/* Original ticket as first message */}
                <div className="flex gap-3 pb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{detail.submitted_by_name || 'العميل'}</span>
                      <span className="text-[10px] text-slate-500">{new Date(detail.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-1">{detail.subject}</div>
                    {detail.description && (
                      <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{detail.description}</p>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {detail.replies.map((reply: TicketReply) => (
                  <div key={reply.id} className={`flex gap-3 py-4 border-t border-gray-200 ${reply.sender_type === 'support' ? '' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      reply.sender_type === 'support' ? 'bg-cyan-500/10' : 'bg-blue-500/10'
                    }`}>
                      <User size={14} className={reply.sender_type === 'support' ? 'text-cyan-600' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{reply.sender_name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          reply.sender_type === 'support' ? 'bg-cyan-500/10 text-cyan-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>{reply.sender_type === 'support' ? 'دعم فني' : 'عميل'}</span>
                        <span className="text-[10px] text-slate-500">{new Date(reply.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
            </div>

            {/* Reply input */}
            {canManage && detail.status !== 'closed' && (
              <div className="admin-card">
                <div className="admin-card-body">
                  <textarea
                    className="admin-form-input w-full min-h-[80px] resize-y"
                    placeholder="اكتب ردك هنا..."
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-600">Ctrl+Enter للإرسال</span>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyBody.trim() || replySending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {replySending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      إرسال الرد
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
                      <button key={ns} onClick={() => handleStatus(detail.id, ns)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          ns === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' :
                          ns === 'in_progress' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' :
                          ns === 'closed' ? 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20' :
                          'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
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
              <div className="admin-card-body space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Tag size={14} className="flex-shrink-0" />
                  <span>الأولوية:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${prioColor(detail.priority)}`}>{pi.ar}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <User size={14} className="flex-shrink-0" />
                  <span>العميل:</span>
                  <span className="text-gray-900">{detail.submitted_by_name || '—'}</span>
                </div>
                {detail.submitted_by_email && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="w-[14px]" />
                    <span className="text-xs text-gray-500" dir="ltr">{detail.submitted_by_email}</span>
                  </div>
                )}
                {detail.org_name && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Building2 size={14} className="flex-shrink-0" />
                    <span>المنشأة:</span>
                    <span className="text-gray-900">{detail.org_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>تاريخ الإنشاء:</span>
                  <span className="text-gray-700">{new Date(detail.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock size={14} className="flex-shrink-0" />
                  <span>آخر تحديث:</span>
                  <span className="text-gray-700">{new Date(detail.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">الدعم الفني</h1>
        <p className="text-sm text-gray-500">إدارة تذاكر الدعم ({total} تذكرة)</p>
        {tickets.filter(t => t.status === 'open').length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-600 border border-blue-500/20 mt-1">
            {tickets.filter(t => t.status === 'open').length} مفتوحة
          </span>
        )}
      </div>
      {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border border-red-500/20 text-red-600'}`}>{msg.text}</div>}

      <div className="admin-card mb-4"><div className="p-4 flex flex-wrap items-center gap-3">
        <select className="admin-form-input w-auto min-w-[130px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">كل الحالات</option><option value="open">مفتوحة</option><option value="in_progress">قيد المعالجة</option>
          <option value="resolved">محلولة</option><option value="closed">مغلقة</option>
        </select>
        <select className="admin-form-input w-auto min-w-[130px]" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">كل الأولويات</option><option value="urgent">عاجلة</option><option value="high">عالية</option>
          <option value="medium">متوسطة</option><option value="low">منخفضة</option>
        </select>
      </div></div>

      <div className="admin-card">
        {isLoading ? <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        : error ? <div className="text-center py-16"><p className="text-sm text-red-600 mb-3">{error}</p><button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button></div>
        : tickets.length === 0 ? <div className="text-center py-16"><Headphones size={40} className="text-gray-400 mx-auto mb-3" /><p className="text-sm text-gray-500">لا توجد تذاكر</p></div>
        : <div className="overflow-x-auto"><table className="admin-table"><thead><tr>
          <th>الموضوع</th><th>العميل</th><th>الأولوية</th><th>الحالة</th><th>التاريخ</th>
        </tr></thead><tbody>
          {tickets.map((t) => {
            const si = STATUS_MAP[t.status] || STATUS_MAP.open;
            const pi = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
            return (
              <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                <td><div><div className="text-sm text-gray-900">{t.subject}</div>{t.org_name && <div className="text-xs text-gray-500">{t.org_name}</div>}</div></td>
                <td><span className="text-sm text-gray-700">{t.submitted_by_name || '—'}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${prioColor(t.priority)}`}>{pi.ar}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(t.status)}`}>{si.ar}</span></td>
                <td><span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></td>
              </tr>
            );
          })}
        </tbody></table></div>}
      </div>
    </div>
  );
}
