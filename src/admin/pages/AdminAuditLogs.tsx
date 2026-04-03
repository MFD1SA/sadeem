// ============================================================================
// SADEEM Admin — Audit Logs Page
// Tab 1: admin_audit_logs (admin operations) via RLS is_active_admin()
// Tab 2: audit_logs (subscriber operations) via RLS is_active_admin()
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminAuditService } from '../services/adminAudit.service';
import type { AdminAuditLog, SubscriberAuditLog } from '../types';
import {
  ClipboardList, Search, Filter, User,
  AlertTriangle, Info, ShieldAlert, Activity,
  Bot, UserCheck,
} from 'lucide-react';

// ── Admin tab constants ──

const SEVERITY_MAP: Record<string, { ar: string; icon: React.ElementType; color: string }> = {
  info: { ar: 'معلومات', icon: Info, color: 'blue' },
  warning: { ar: 'تحذير', icon: AlertTriangle, color: 'amber' },
  critical: { ar: 'حرج', icon: ShieldAlert, color: 'red' },
};

const MODULE_LABELS: Record<string, string> = {
  auth: 'المصادقة',
  admin_users: 'المشرفين',
  roles: 'الأدوار',
  subscribers: 'المشتركين',
  finance: 'المالية',
  settings: 'الإعدادات',
  system: 'النظام',
};

// ── Subscriber tab constants ──

const EVENT_LABELS: Record<string, string> = {
  sync_completed: 'مزامنة ناجحة',
  sync_failed: 'فشل المزامنة',
  ai_reply_generated: 'تم إنشاء رد ذكاء اصطناعي',
  ai_reply_failed: 'فشل إنشاء رد AI',
  ai_limit_reached: 'تم بلوغ حد AI',
  template_matched: 'تم مطابقة قالب',
  template_quota_exhausted: 'نفدت حصة القوالب',
  draft_created: 'تم إنشاء مسودة',
  draft_edited: 'تم تعديل مسودة',
  draft_approved: 'تمت الموافقة على مسودة',
  draft_rejected: 'تم رفض مسودة',
  draft_deferred: 'تم تأجيل مسودة',
  reply_sent_google: 'تم إرسال رد إلى Google',
  reply_auto_sent: 'تم إرسال رد تلقائي',
  reply_send_failed: 'فشل إرسال الرد',
  review_flagged_manual: 'مراجعة يدوية مطلوبة',
  trial_expired: 'انتهاء التجربة',
  branch_created: 'فرع أُنشئ',
  qr_generated: 'QR أُنشئ',
};

const ACTOR_LABELS: Record<string, { ar: string; icon: React.ElementType; color: string }> = {
  user: { ar: 'مستخدم', icon: UserCheck, color: 'blue' },
  system: { ar: 'النظام', icon: Bot, color: 'slate' },
  auto: { ar: 'تلقائي', icon: Activity, color: 'amber' },
};

const ENTITY_LABELS: Record<string, string> = {
  review: 'تقييم',
  draft: 'مسودة',
  branch: 'فرع',
  template: 'قالب',
  subscription: 'اشتراك',
};

type ActiveTab = 'admin' | 'subscriber';

export default function AdminAuditLogs() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('subscriber');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">سجل العمليات</h1>
          <p className="text-sm text-gray-600">
            {activeTab === 'admin' ? 'العمليات الإدارية في لوحة الأدمن' : 'عمليات المشتركين (مزامنة، ردود، مسودات)'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('subscriber')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'subscriber'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity size={14} className="inline-block ml-1.5" />
          عمليات المشتركين
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'admin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShieldAlert size={14} className="inline-block ml-1.5" />
          عمليات الأدمن
        </button>
      </div>

      {activeTab === 'admin' ? <AdminOpsTab /> : <SubscriberOpsTab />}
    </div>
  );
}

// ============================================================================
// Tab 1: Subscriber Operations (audit_logs)
// ============================================================================

function SubscriberOpsTab() {
  const [logs, setLogs] = useState<SubscriberAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterActor, setFilterActor] = useState('');

  const PAGE_SIZE = 30;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await adminAuditService.listSubscriberAudit({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        event: filterEvent || undefined,
        actorType: filterActor || undefined,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل السجلات');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterEvent, filterActor]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCsv = () => {
    const esc = (v: string) => { const s = String(v ?? ''); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; };
    const headers = ['التاريخ', 'الحدث', 'وصف الحدث', 'الفاعل', 'نوع الكيان', 'معرف الكيان', 'معرف المنشأة', 'التفاصيل'];
    const csv = logs.map(l => [
      new Date(l.created_at).toLocaleString('en-US'),
      l.event,
      EVENT_LABELS[l.event] || l.event,
      ACTOR_LABELS[l.actor_type]?.ar || l.actor_type,
      l.entity_type ? (ENTITY_LABELS[l.entity_type] || l.entity_type) : '',
      l.entity_id || '',
      l.organization_id || '',
      l.details ? JSON.stringify(l.details) : '',
    ].map(esc).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + headers.join(',') + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `سجل-عمليات-المشتركين-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="بحث بالحدث أو نوع الكيان..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="admin-form-input pr-9" />
          </div>
          <select className="admin-form-input w-auto min-w-[160px]" value={filterEvent}
            onChange={(e) => { setFilterEvent(e.target.value); setPage(1); }}>
            <option value="">كل الأحداث</option>
            <optgroup label="المزامنة">
              <option value="sync_completed">مزامنة ناجحة</option>
              <option value="sync_failed">فشل المزامنة</option>
            </optgroup>
            <optgroup label="الردود">
              <option value="reply_sent_google">رد أُرسل لـ Google</option>
              <option value="reply_auto_sent">رد تلقائي</option>
              <option value="reply_send_failed">فشل إرسال الرد</option>
            </optgroup>
            <optgroup label="المسودات">
              <option value="draft_created">مسودة أُنشئت</option>
              <option value="draft_edited">مسودة عُدّلت</option>
              <option value="draft_approved">مسودة وُوفق عليها</option>
              <option value="draft_rejected">مسودة رُفضت</option>
              <option value="draft_deferred">مسودة أُجّلت</option>
            </optgroup>
            <optgroup label="AI والقوالب">
              <option value="ai_reply_generated">رد AI تم إنشاؤه</option>
              <option value="ai_limit_reached">حد AI وصل</option>
              <option value="template_matched">قالب مطابق</option>
              <option value="template_quota_exhausted">حصة القوالب نفدت</option>
            </optgroup>
          </select>
          <select className="admin-form-input w-auto min-w-[130px]" value={filterActor}
            onChange={(e) => { setFilterActor(e.target.value); setPage(1); }}>
            <option value="">كل الفاعلين</option>
            <option value="user">مستخدم</option>
            <option value="system">النظام</option>
            <option value="auto">تلقائي</option>
          </select>
          <button onClick={exportCsv} className="admin-btn-secondary text-sm flex items-center gap-2">
            <Filter size={15} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد سجلات عمليات مشتركين بعد</p>
            <p className="text-xs text-gray-400 mt-1">ستظهر الأحداث عند مزامنة التقييمات أو الموافقة/رفض المسودات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الفاعل</th>
                    <th>الحدث</th>
                    <th>الكيان</th>
                    <th>التفاصيل</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const actor = ACTOR_LABELS[log.actor_type] || ACTOR_LABELS.system;
                    const ActorIcon = actor.icon;
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium
                            ${log.actor_type === 'user' ? 'bg-blue-500/10 text-blue-600' :
                              log.actor_type === 'auto' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-slate-500/10 text-slate-600'}`}>
                            <ActorIcon size={12} />
                            {actor.ar}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-900">
                            {EVENT_LABELS[log.event] || log.event}
                          </span>
                          {log.event.includes('failed') && (
                            <AlertTriangle size={12} className="inline-block mr-1 text-red-500" />
                          )}
                        </td>
                        <td>
                          {log.entity_type ? (
                            <span className="text-xs text-slate-500">
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                              {log.entity_id && <span className="text-slate-600 mr-1 font-mono" dir="ltr">#{log.entity_id.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td>
                          <DetailsCell details={log.details} />
                        </td>
                        <td>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('ar-SA', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <span className="text-xs text-slate-500">صفحة {page} من {totalPages} ({total} سجل)</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="admin-btn-secondary text-xs px-3 py-1.5">السابق</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="admin-btn-secondary text-xs px-3 py-1.5">التالي</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** Compact details cell — shows key info from jsonb payload */
function DetailsCell({ details }: { details: Record<string, unknown> | null }) {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-xs text-slate-600">—</span>;
  }

  const parts: string[] = [];
  if (details.message) parts.push(String(details.message));
  if (details.error) parts.push(`خطأ: ${String(details.error).slice(0, 80)}`);
  if (details.source) parts.push(`المصدر: ${details.source}`);
  if (details.reviews_count) parts.push(`${details.reviews_count} تقييم`);

  if (parts.length === 0) {
    // Show first 2 keys as fallback
    const keys = Object.keys(details).slice(0, 2);
    keys.forEach(k => parts.push(`${k}: ${String(details[k]).slice(0, 40)}`));
  }

  return (
    <div className="text-xs text-slate-500 max-w-[250px] truncate" title={JSON.stringify(details, null, 2)}>
      {parts.join(' · ')}
    </div>
  );
}

// ============================================================================
// Tab 2: Admin Operations (admin_audit_logs) — original table
// ============================================================================

function AdminOpsTab() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const PAGE_SIZE = 30;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await adminAuditService.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        module: filterModule || undefined,
        severity: filterSeverity || undefined,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل السجلات');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, filterModule, filterSeverity]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const exportCsv = () => {
    const esc = (v: string) => { const s = String(v ?? ''); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; };
    const headers = ['التاريخ', 'الإجراء', 'القسم', 'اسم القسم', 'المنفذ', 'المستوى', 'وصف المستوى', 'الهدف', 'معرف الهدف'];
    const csv = logs.map(l => [
      new Date(l.created_at).toLocaleString('en-US'),
      l.action,
      l.module,
      MODULE_LABELS[l.module] || l.module,
      l.admin_email || 'system',
      l.severity,
      SEVERITY_MAP[l.severity]?.ar || l.severity,
      l.target_type || '',
      l.target_id || '',
    ].map(esc).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + headers.join(',') + '\n' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `سجل-عمليات-الأدمن-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="بحث بالإجراء أو البريد..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="admin-form-input pr-9" />
          </div>
          <select className="admin-form-input w-auto min-w-[130px]" value={filterModule}
            onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}>
            <option value="">كل الأقسام</option>
            <option value="auth">المصادقة</option>
            <option value="admin_users">المشرفين</option>
            <option value="roles">الأدوار</option>
            <option value="subscribers">المشتركين</option>
            <option value="finance">المالية</option>
            <option value="settings">الإعدادات</option>
            <option value="support">الدعم الفني</option>
            <option value="system">النظام</option>
          </select>
          <select className="admin-form-input w-auto min-w-[130px]" value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}>
            <option value="">كل المستويات</option>
            <option value="info">معلومات</option>
            <option value="warning">تحذير</option>
            <option value="critical">حرج</option>
          </select>
          <button onClick={exportCsv} className="admin-btn-secondary text-sm flex items-center gap-2">
            <Filter size={15} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="admin-spinner" /></div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد سجلات</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>المستوى</th>
                    <th>الإجراء</th>
                    <th>القسم</th>
                    <th>المنفّذ</th>
                    <th>الهدف</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const sev = SEVERITY_MAP[log.severity] || SEVERITY_MAP.info;
                    const SevIcon = sev.icon;
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium
                            ${log.severity === 'critical' ? 'bg-red-500/10 text-red-600' :
                              log.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-blue-500/10 text-blue-600'}`}>
                            <SevIcon size={12} />
                            {sev.ar}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-900 font-mono" dir="ltr">{log.action}</span>
                        </td>
                        <td>
                          <span className="text-sm text-gray-700">{MODULE_LABELS[log.module] || log.module}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500" dir="ltr">{log.admin_email || 'system'}</span>
                          </div>
                        </td>
                        <td>
                          {log.target_type ? (
                            <span className="text-xs text-slate-500">
                              {log.target_type}
                              {log.target_id && <span className="text-slate-600 mr-1 font-mono" dir="ltr">#{log.target_id.slice(0, 8)}</span>}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('ar-SA', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <span className="text-xs text-slate-500">صفحة {page} من {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    className="admin-btn-secondary text-xs px-3 py-1.5">السابق</button>
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    className="admin-btn-secondary text-xs px-3 py-1.5">التالي</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
