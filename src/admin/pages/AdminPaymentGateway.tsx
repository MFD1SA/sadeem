// ============================================================================
// SADEEM Admin — Payment Gateway Page (Phase 7)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { adminGatewayService, type GatewayOverview, type PaymentEventItem } from '../services/adminGateway.service';
import {
  CreditCard, Activity, CheckCircle, XCircle,
  AlertTriangle, Webhook, Search,
} from 'lucide-react';

const EVT_STATUS: Record<string, { ar: string; color: string }> = {
  received: { ar: 'مستلم', color: 'blue' },
  processed: { ar: 'معالَج', color: 'emerald' },
  failed: { ar: 'فشل', color: 'red' },
  ignored: { ar: 'متجاهَل', color: 'slate' },
};

export default function AdminPaymentGateway() {
  const [overview, setOverview] = useState<GatewayOverview | null>(null);
  const [events, setEvents] = useState<PaymentEventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProvider, setFilterProvider] = useState('');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true); setError('');
      const [ov, ev] = await Promise.all([
        adminGatewayService.getOverview(),
        adminGatewayService.listEvents({
          status: filterStatus || undefined,
          provider: filterProvider || undefined,
        }),
      ]);
      setOverview(ov);
      setEvents(ev.data);
      setTotal(ev.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally { setIsLoading(false); }
  }, [filterStatus, filterProvider]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="admin-spinner" /></div>;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-sm text-red-400 mb-3">{error}</p>
      <button onClick={loadData} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">بوابة الدفع</h1>
        <p className="text-sm text-gray-500">مراقبة أحداث الدفع وحالة البوابة</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OvCard icon={Webhook} color="cyan" label="إجمالي الأحداث" value={String(overview?.total_events ?? 0)} />
        <OvCard icon={Activity} color="blue" label="أحداث اليوم" value={String(overview?.events_today ?? 0)} />
        <OvCard icon={CheckCircle} color="emerald" label="معالجة بنجاح" value={String(overview?.processed ?? 0)} />
        <OvCard icon={XCircle} color="red" label="فشلت" value={String(overview?.failed ?? 0)} />
      </div>

      {/* Gateway subs + revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="admin-card">
          <div className="admin-card-header"><h3>الاشتراكات النشطة عبر البوابة</h3></div>
          <div className="admin-card-body text-center py-6">
            <div className="text-3xl font-bold text-gray-900">{overview?.active_gateway_subs ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">اشتراك مرتبط ببوابة دفع</div>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card-header"><h3>الإيرادات حسب البوابة</h3></div>
          <div className="admin-card-body">
            {overview?.gateway_revenue && Object.keys(overview.gateway_revenue).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(overview.gateway_revenue).map(([gw, rev]) => (
                  <div key={gw} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-900 capitalize">{gw}</span>
                    <span className="text-sm text-emerald-600 font-medium" dir="ltr">{Number(rev).toLocaleString()} ر.س</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">لا توجد إيرادات مسجلة عبر البوابة بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Event type breakdown */}
      {overview?.by_event_type && Object.keys(overview.by_event_type).length > 0 && (
        <div className="admin-card mb-6">
          <div className="admin-card-header"><h3>حسب نوع الحدث</h3></div>
          <div className="admin-card-body">
            <div className="flex flex-wrap gap-3">
              {Object.entries(overview.by_event_type).map(([type, cnt]) => (
                <div key={type} className="px-3 py-2 rounded-lg bg-gray-50 text-xs">
                  <span className="text-gray-500 font-mono" dir="ltr">{type}</span>
                  <span className="text-gray-900 font-medium mr-2">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <select className="admin-form-input w-auto min-w-[140px]" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="received">مستلم</option>
            <option value="processed">معالج</option>
            <option value="failed">فشل</option>
            <option value="ignored">متجاهل</option>
          </select>
          <select className="admin-form-input w-auto min-w-[140px]" value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}>
            <option value="">كل البوابات</option>
            <option value="stripe">Stripe</option>
            <option value="moyasar">Moyasar</option>
          </select>
          <span className="text-xs text-slate-500">{total} حدث</span>
        </div>
      </div>

      {/* Events table */}
      <div className="admin-card">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <Webhook size={40} className="text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500">لا توجد أحداث دفع بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>البوابة</th>
                  <th>نوع الحدث</th>
                  <th>المشترك</th>
                  <th>الحالة</th>
                  <th>المعالجة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const si = EVT_STATUS[ev.status] || EVT_STATUS.received;
                  return (
                    <tr key={ev.id}>
                      <td><span className="text-xs text-cyan-600 capitalize">{ev.gateway_provider}</span></td>
                      <td><span className="text-xs text-gray-700 font-mono" dir="ltr">{ev.event_type}</span></td>
                      <td><span className="text-sm text-gray-900">{ev.org_name || '—'}</span></td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                          ${ev.status === 'processed' ? 'bg-emerald-500/10 text-emerald-600' :
                            ev.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                            ev.status === 'ignored' ? 'bg-slate-500/10 text-slate-600' :
                            'bg-blue-500/10 text-blue-600'}`}>{si.ar}</span>
                      </td>
                      <td><span className="text-xs text-slate-500">
                        {ev.processed_at ? new Date(ev.processed_at).toLocaleString('en-US') : '—'}
                      </span></td>
                      <td><span className="text-xs text-slate-500">{new Date(ev.created_at).toLocaleString('en-US')}</span></td>
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

const OV_COLORS: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-600' },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-600' },
  red:     { bg: 'bg-red-500/10',     text: 'text-red-600' },
};

function OvCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: string;
}) {
  const c = OV_COLORS[color] || OV_COLORS.blue;
  return (
    <div className="admin-stat-card">
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={c.text} />
      </div>
      <div className="text-lg font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
