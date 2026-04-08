// ============================================================================
// SENDA Admin — Dashboard (Phase 4)
// Real stats from admin_get_dashboard_stats RPC.
// ============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSubscribersService, type DashboardStats } from '../services/adminSubscribers.service';
import { adminIntegrationsService, type AdminIntegration } from '../services/adminIntegrations.service';
import {
  Building2, Users, GitBranch, MessageSquare,
  Zap, FileText, ShieldCheck, TrendingUp,
  Puzzle, Star, Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [integrations, setIntegrations] = useState<AdminIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'سيندا | SENDA — لوحة الإدارة';
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [data, intgs] = await Promise.all([
        adminSubscribersService.getDashboardStats(),
        adminIntegrationsService.list().catch(() => [] as AdminIntegration[]),
      ]);
      setStats(data);
      setIntegrations(intgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الإحصائيات');
    } finally {
      setIsLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'صباح الخير' : 'مساء الخير';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="admin-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button onClick={loadStats} className="admin-btn-secondary text-sm">إعادة المحاولة</button>
      </div>
    );
  }

  // Plan color map
  const planColors: Record<string, { bar: string; bg: string; text: string }> = {
    orbit:    { bar: '#0891b2', bg: 'rgba(8,145,178,0.08)',   text: '#0891b2' },
    nova:     { bar: '#7c3aed', bg: 'rgba(124,58,237,0.08)',  text: '#7c3aed' },
    galaxy:   { bar: '#d97706', bg: 'rgba(217,119,6,0.08)',  text: '#d97706' },
    infinity: { bar: '#059669', bg: 'rgba(5,150,105,0.08)',  text: '#059669' },
    starter:  { bar: '#0891b2', bg: 'rgba(8,145,178,0.08)',   text: '#0891b2' },
    growth:   { bar: '#7c3aed', bg: 'rgba(124,58,237,0.08)',  text: '#7c3aed' },
    pro:      { bar: '#d97706', bg: 'rgba(217,119,6,0.08)',  text: '#d97706' },
    enterprise:{ bar: '#059669', bg: 'rgba(5,150,105,0.08)', text: '#059669' },
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">
            {greeting()}، <span style={{ color: '#0891b2' }}>{user?.full_name_ar || 'مشرف'}</span>
          </h1>
          <p className="admin-page-subtitle">مركز التحكم الإداري — نظرة عامة على المنصة</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#059669' }} />
          النظام يعمل بشكل طبيعي
        </div>
      </div>

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} iconColor="#0891b2" iconBg="rgba(8,145,178,0.08)"
          label="المشتركين" value={stats?.total_organizations ?? 0} />
        <StatCard icon={Users} iconColor="#7c3aed" iconBg="rgba(124,58,237,0.08)"
          label="مشتركين نشطين" value={(stats?.total_subscribers_active ?? 0) + (stats?.total_subscribers_trial ?? 0)} />
        <StatCard icon={GitBranch} iconColor="#059669" iconBg="rgba(5,150,105,0.08)"
          label="الفروع النشطة" value={stats?.total_branches ?? 0} />
        <StatCard icon={MessageSquare} iconColor="#d97706" iconBg="rgba(217,119,6,0.08)"
          label="إجمالي التقييمات" value={stats?.total_reviews ?? 0} />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} iconColor="#d97706" iconBg="rgba(217,119,6,0.08)"
          label="ردود AI" value={stats?.total_ai_replies_used ?? 0} />
        <StatCard icon={FileText} iconColor="#6b7280" iconBg="rgba(107,114,128,0.08)"
          label="ردود القوالب" value={stats?.total_template_replies_used ?? 0} />
        <StatCard icon={TrendingUp} iconColor="#059669" iconBg="rgba(5,150,105,0.08)"
          label="تقييمات الشهر" value={stats?.reviews_this_month ?? 0} />
        <StatCard icon={ShieldCheck} iconColor="#0891b2" iconBg="rgba(8,145,178,0.08)"
          label="المشرفين النشطين" value={stats?.admin_count ?? 0} />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Plan distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>توزيع الخطط</h3>
              <p>تفاصيل اشتراكات المشتركين الحالية</p>
            </div>
          </div>
          <div className="admin-card-body">
            {stats?.plan_distribution && Object.keys(stats.plan_distribution).length > 0 ? (
              <div className="space-y-3.5">
                {Object.entries(stats.plan_distribution).map(([plan, count]) => {
                  const total = Object.values(stats.plan_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const labels: Record<string, string> = {
                    orbit: 'مدار', nova: 'نوفا', galaxy: 'جالكسي', infinity: 'إنفينيتي',
                    starter: 'مدار', growth: 'نوفا', pro: 'جالكسي', enterprise: 'إنفينيتي',
                  };
                  const pc = planColors[plan] || { bar: '#6b7280', bg: 'rgba(107,114,128,0.08)', text: '#6b7280' };
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.bar }} />
                          <span className="text-[13px] font-medium" style={{ color: '#111827' }}>
                            {labels[plan] || plan}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                            style={{ background: pc.bg, color: pc.text }}>
                            {count}
                          </span>
                          <span className="text-xs tabular-nums" style={{ color: '#6b7280' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pc.bar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Activity size={28} style={{ color: '#9ca3af' }} />
                <p className="text-sm" style={{ color: '#6b7280' }}>لا توجد بيانات متاحة</p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription status + recent orgs */}
        <div className="space-y-4">
          {/* Status breakdown */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>حالة الاشتراكات</h3>
            </div>
            <div className="admin-card-body">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="نشط" value={stats?.total_subscribers_active ?? 0}
                  color="#059669" bg="rgba(5,150,105,0.08)" />
                <MiniStat label="تجريبي" value={stats?.total_subscribers_trial ?? 0}
                  color="#0891b2" bg="rgba(8,145,178,0.08)" />
                <MiniStat label="منتهي" value={stats?.total_subscribers_expired ?? 0}
                  color="#dc2626" bg="rgba(220,38,38,0.08)" />
                <MiniStat label="إجمالي" value={stats?.total_organizations ?? 0}
                  color="#6b7280" bg="rgba(107,114,128,0.08)" />
              </div>
            </div>
          </div>

          {/* Recent organizations */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>أحدث المشتركين</h3></div>
            <div className="admin-card-body p-0">
              {stats?.recent_organizations && stats.recent_organizations.length > 0 ? (
                <div className="divide-y" style={{ borderColor: '#e5e7eb' }}>
                  {stats.recent_organizations.slice(0, 5).map((org) => (
                    <div key={org.id}
                      className="flex items-center justify-between px-5 py-3 transition-colors"
                      style={{ color: '#6b7280' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: 'rgba(8,145,178,0.08)', color: '#0891b2' }}>
                          {org.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium" style={{ color: '#111827' }}>{org.name}</span>
                      </div>
                      <span className="text-[11px]">
                        {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                  <Building2 size={24} style={{ color: '#9ca3af' }} />
                  <p className="text-xs" style={{ color: '#6b7280' }}>لا يوجد مشتركين بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── System status + quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* System overview */}
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header">
            <div className="flex items-center gap-2">
              <Activity size={15} style={{ color: '#7c3aed' }} />
              <h3>نظرة عامة على النظام</h3>
            </div>
            <span className="admin-badge admin-badge-success">نشط</span>
          </div>
          <div className="admin-card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Star,      color: '#d97706', bg: 'rgba(217,119,6,0.08)',  value: (stats?.total_reviews ?? 0).toLocaleString('en-US'),          label: 'تقييمات Google' },
                { icon: Zap,       color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', value: (stats?.total_ai_replies_used ?? 0).toLocaleString('en-US'), label: 'ردود AI' },
                { icon: Puzzle,    color: '#059669', bg: 'rgba(5,150,105,0.08)', value: integrations.filter(i => i.enabled).length.toLocaleString('en-US'), label: 'تكاملات مفعّلة' },
                { icon: TrendingUp,color: '#0891b2', bg: 'rgba(8,145,178,0.08)',  value: (stats?.reviews_this_month ?? 0).toLocaleString('en-US'),     label: 'تقييمات الشهر' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = '#f9fafb'}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold" style={{ color: '#111827' }}>{value}</div>
                    <div className="text-[10px] truncate" style={{ color: '#6b7280' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            {integrations.length > 0 && (
              <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid #e5e7eb' }}>
                {integrations.slice(0, 3).map(intg => {
                  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                    connected:    { label: 'مربوط', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
                    disconnected: { label: 'غير مربوط', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
                    error:        { label: 'خطأ', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
                  };
                  const s = intg.enabled
                    ? (statusMap[intg.status] || statusMap.disconnected)
                    : { label: 'معطّل', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' };
                  return (
                    <div key={intg.id} className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                      <span className="text-[11px]" style={{ color: '#6b7280' }}>{intg.name_ar || intg.name_en}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{ color: s.color, background: s.bg }}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>إجراءات سريعة</h3></div>
          <div className="admin-card-body">
            <div className="space-y-2.5">
              {[
                { label: 'إدارة المشتركين', path: '/admin/subscribers', color: '#0891b2', bg: 'rgba(8,145,178,0.06)',  border: 'rgba(8,145,178,0.2)',  icon: Building2 },
                { label: 'الفواتير المعلّقة', path: '/admin/billing',    color: '#d97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)', icon: FileText },
                { label: 'تذاكر الدعم',      path: '/admin/tickets',    color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.2)', icon: MessageSquare },
                { label: 'استهلاك AI',       path: '/admin/ai-usage',   color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.2)', icon: Zap },
              ].map(({ label, path, color, bg, border, icon: Icon }) => (
                <Link key={path} to={path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-150"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value }: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <div className="admin-stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon size={19} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: '#111827' }}>
        {value.toLocaleString('en-US')}
      </div>
      <div className="text-xs" style={{ color: '#6b7280' }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="text-center py-3 px-2 rounded-xl transition-colors"
      style={{ background: bg, border: `1px solid ${color}30` }}>
      <div className="text-xl font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[11px]" style={{ color: '#6b7280' }}>{label}</div>
    </div>
  );
}
