// ============================================================================
// SADEEM Admin — Support Tickets (Enhanced)
// List + detail panel + status actions + better admin UX.
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminTicketsService, type TicketItem } from '../services/adminTickets.service';
import { PERMISSIONS } from '../utils/constants';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Headphones, MoreVertical, CheckCircle, Clock, XCircle, ChevronLeft, User, Building2, Calendar, Tag } from 'lucide-react';

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

const statusColor = (s: string) => s === 'open' ? 'bg-blue-500/10 text-blue-400' : s === 'in_progress' ? 'bg-amber-500/10 text-amber-400' : s === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400';
const prioColor = (p: string) => p === 'urgent' ? 'bg-red-500/10 text-red-400' : p === 'high' ? 'bg-amber-500/10 text-amber-400' : p === 'medium' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400';

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
  const [selected, setSelected] = useState<TicketItem | null>(null);

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

  const handleStatus = async (id: string, status: string) => {
    try {
      await adminTicketsService.updateStatus(id, status);
      showMsg('تم تحديث حالة التذكرة', 'success');
      loadData();
      if (selected?.id === id) setSelected({ ...selected, status, updated_at: new Date().toISOString() });
    } catch (e) { showMsg(e instanceof Error ? e.message : 'فشل', 'error'); }
  };

  // ─── Detail View ───
  if (selected) {
    const si = STATUS_MAP[selected.status] || STATUS_MAP.open;
    const pi = PRIORITY_MAP[selected.priority] || PRIORITY_MAP.medium;

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{selected.subject}</h1>
            <p className="text-xs text-slate-500">تذكرة #{selected.id.slice(0, 8)}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${statusColor(selected.status)}`}>{si.ar}</span>
        </div>

        {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{msg.text}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="admin-card">
              <div className="admin-card-header"><h3>تفاصيل التذكرة</h3></div>
              <div className="admin-card-body">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.subject}</p>
              </div>
            </div>

            {/* Status actions */}
            {canManage && si.next.length > 0 && (
              <div className="admin-card">
                <div className="admin-card-header"><h3>تحديث الحالة</h3></div>
                <div className="admin-card-body">
                  <div className="flex flex-wrap gap-2">
                    {si.next.map((ns, i) => (
                      <button key={ns} onClick={() => handleStatus(selected.id, ns)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                          ns === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' :
                          ns === 'in_progress' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' :
                          ns === 'closed' ? 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20' :
                          'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
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
                <div className="flex items-center gap-2 text-slate-400">
                  <Tag size={14} className="flex-shrink-0" />
                  <span>الأولوية:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${prioColor(selected.priority)}`}>{pi.ar}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={14} className="flex-shrink-0" />
                  <span>العميل:</span>
                  <span className="text-white">{selected.submitted_by_name || '—'}</span>
                </div>
                {selected.submitted_by_email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-[14px]" />
                    <span className="text-xs text-slate-500" dir="ltr">{selected.submitted_by_email}</span>
                  </div>
                )}
                {selected.org_name && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 size={14} className="flex-shrink-0" />
                    <span>المنشأة:</span>
                    <span className="text-white">{selected.org_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span>تاريخ الإنشاء:</span>
                  <span className="text-slate-300">{new Date(selected.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} className="flex-shrink-0" />
                  <span>آخر تحديث:</span>
                  <span className="text-slate-300">{new Date(selected.updated_at).toLocaleDateString('ar-SA')}</span>
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
        <h1 className="text-xl font-bold text-white mb-1">الدعم الفني</h1>
        <p className="text-sm text-slate-400">إدارة تذاكر الدعم ({total} تذكرة)</p>
      </div>
      {msg && <div className={`text-xs rounded-lg p-3 mb-4 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>{msg.text}</div>}

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
        : error ? <div className="text-center py-16"><p className="text-sm text-red-400 mb-3">{error}</p><button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button></div>
        : tickets.length === 0 ? <div className="text-center py-16"><Headphones size={40} className="text-slate-600 mx-auto mb-3" /><p className="text-sm text-slate-400">لا توجد تذاكر</p></div>
        : <div className="overflow-x-auto"><table className="admin-table"><thead><tr>
          <th>الموضوع</th><th>العميل</th><th>الأولوية</th><th>الحالة</th><th>التاريخ</th>
        </tr></thead><tbody>
          {tickets.map((t) => {
            const si = STATUS_MAP[t.status] || STATUS_MAP.open;
            const pi = PRIORITY_MAP[t.priority] || PRIORITY_MAP.medium;
            return (
              <tr key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                <td><div><div className="text-sm text-white">{t.subject}</div>{t.org_name && <div className="text-xs text-slate-500">{t.org_name}</div>}</div></td>
                <td><span className="text-sm text-slate-300">{t.submitted_by_name || '—'}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${prioColor(t.priority)}`}>{pi.ar}</span></td>
                <td><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(t.status)}`}>{si.ar}</span></td>
                <td><span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('ar-SA')}</span></td>
              </tr>
            );
          })}
        </tbody></table></div>}
      </div>
    </div>
  );
}
