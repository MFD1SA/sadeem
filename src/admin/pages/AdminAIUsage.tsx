// ============================================================================
// SADEEM Admin — AI Usage Page (Phase 6)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminAIUsageService, type AIUsageOverview, type AIUsageLogItem } from '../services/adminAIUsage.service';
import {
  Zap, Activity, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Clock, Search,
} from 'lucide-react';

const STATUS_MAP: Record<string, { ar: string; color: string }> = {
  success: { ar: 'ناجح', color: 'emerald' },
  error: { ar: 'خطأ', color: 'red' },
  rate_limited: { ar: 'حد المعدل', color: 'amber' },
  limit_exceeded: { ar: 'تجاوز الحد', color: 'red' },
};

export default function AdminAIUsage() {
  const [overview, setOverview] = useState<AIUsageOverview | null>(null);
  const [logs, setLogs] = useState<AIUsageLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const [ov, lg] = await Promise.all([
        adminAIUsageService.getOverview(),
        adminAIUsageService.listByOrg({ status: filterStatus || undefined }),
      ]);
      setOverview(ov);
      setLogs(lg.data);
      setTotal(lg.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally { setIsLoading(false); }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-400 mb-3">{error}</p>
      <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  const costSAR = (overview?.cost_this_month ?? 0) * 3.75; // USD to SAR approx

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white mb-1">استهلاك الذكاء الاصطناعي</h1>
        <p className="text-sm text-slate-400">تتبع استهلاك AI والتكاليف عبر المنصة</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Zap} color="cyan" label="طلبات هذا الشهر" value={String(overview?.calls_this_month ?? 0)} />
        <StatCard icon={Activity} color="blue" label="التوكنز هذا الشهر" value={(overview?.tokens_this_month ?? 0).toLocaleString()} />
        <StatCard icon={DollarSign} color="emerald" label="تكلفة الشهر (تقريبي)"
          value={`$${(overview?.cost_this_month ?? 0).toFixed(4)} ≈ ${costSAR.toFixed(2)} ر.س`} />
        <StatCard icon={AlertTriangle} color="red" label="الطلبات الفاشلة" value={String(overview?.failed_calls ?? 0)} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="admin-stat-card flex items-center gap-4">
          <CheckCircle size={24} className="text-emerald-400" />
          <div>
            <div className="text-lg font-bold text-white">{overview?.successful_calls ?? 0}</div>
            <div className="text-xs text-slate-400">ناجحة</div>
          </div>
        </div>
        <div className="admin-stat-card flex items-center gap-4">
          <XCircle size={24} className="text-red-400" />
          <div>
            <div className="text-lg font-bold text-white">{overview?.failed_calls ?? 0}</div>
            <div className="text-xs text-slate-400">فاشلة</div>
          </div>
        </div>
        <div className="admin-stat-card flex items-center gap-4">
          <AlertTriangle size={24} className="text-amber-400" />
          <div>
            <div className="text-lg font-bold text-white">{overview?.limit_exceeded_calls ?? 0}</div>
            <div className="text-xs text-slate-400">تجاوز الحد</div>
          </div>
        </div>
      </div>

      {/* Top consumers */}
      {overview?.top_consumers && overview.top_consumers.length > 0 && (
        <div className="admin-card mb-6">
          <div className="admin-card-header"><h3>أعلى المشتركين استهلاكًا (هذا الشهر)</h3></div>
          <div className="admin-card-body">
            <div className="space-y-2">
              {overview.top_consumers.map((c, i) => (
                <div key={c.org_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-5 text-center">{i + 1}</span>
                    <span className="text-sm text-white">{c.org_name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <span className="text-slate-400">{c.total_calls} طلب</span>
                    <span className="text-slate-400">{Number(c.total_tokens).toLocaleString()} توكن</span>
                    <span className="text-cyan-400">${Number(c.total_cost).toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Usage log */}
      <div className="admin-card mb-4">
        <div className="p-4 flex items-center gap-3">
          <select className="admin-form-input w-auto min-w-[160px]" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="success">ناجح</option>
            <option value="error">خطأ</option>
            <option value="limit_exceeded">تجاوز الحد</option>
          </select>
          <span className="text-xs text-slate-500">{total} سجل</span>
        </div>
      </div>

      <div className="admin-card">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">لا توجد سجلات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>المنظمة</th>
                  <th>النموذج</th>
                  <th>التوكنز</th>
                  <th>التكلفة</th>
                  <th>المدة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const si = STATUS_MAP[log.status] || STATUS_MAP.error;
                  return (
                    <tr key={log.id}>
                      <td><span className="text-sm text-white">{log.org_name}</span></td>
                      <td><span className="text-xs text-slate-400 font-mono" dir="ltr">{log.model}</span></td>
                      <td><span className="text-sm text-slate-300">{log.total_tokens.toLocaleString()}</span></td>
                      <td><span className="text-sm text-slate-300" dir="ltr">${Number(log.estimated_cost_usd).toFixed(6)}</span></td>
                      <td>
                        <span className="text-sm text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {log.duration_ms ? `${log.duration_ms}ms` : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                            log.status === 'limit_exceeded' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-red-500/10 text-red-400'}`}>
                          {si.ar}
                        </span>
                      </td>
                      <td><span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('ar-SA')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: string;
}) {
  return (
    <div className="admin-stat-card">
      <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
        <Icon size={20} className={`text-${color}-400`} />
      </div>
      <div className="text-lg font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
