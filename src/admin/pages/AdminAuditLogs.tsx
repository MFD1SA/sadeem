// ============================================================================
// SADEEM Admin — Audit Logs Page
// Reads from admin_audit_logs via RLS (is_active_admin).
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminAuditService } from '../services/adminAudit.service';
import type { AdminAuditLog } from '../types';
import {
  ClipboardList, Search, Filter, User,
  AlertTriangle, Info, ShieldAlert, Activity,
} from 'lucide-react';

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

export default function AdminAuditLogs() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">سجل العمليات</h1>
        <p className="text-sm text-slate-400">جميع العمليات الإدارية المسجّلة في النظام ({total} سجل)</p>
      </div>

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
          </select>
          <select className="admin-form-input w-auto min-w-[130px]" value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}>
            <option value="">كل المستويات</option>
            <option value="info">معلومات</option>
            <option value="warning">تحذير</option>
            <option value="critical">حرج</option>
          </select>
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
            <p className="text-sm text-slate-400">لا توجد سجلات</p>
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
                            ${log.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                              log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'}`}>
                            <SevIcon size={12} />
                            {sev.ar}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-white font-mono" dir="ltr">{log.action}</span>
                        </td>
                        <td>
                          <span className="text-sm text-slate-300">{MODULE_LABELS[log.module] || log.module}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-slate-500 flex-shrink-0" />
                            <span className="text-xs text-slate-400" dir="ltr">{log.admin_email || 'system'}</span>
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

            {/* Pagination */}
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
    </div>
  );
}
