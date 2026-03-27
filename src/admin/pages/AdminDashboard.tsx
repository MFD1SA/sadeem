// ============================================================================
// SADEEM Admin — Dashboard (Phase 4)
// Real stats from admin_get_dashboard_stats RPC.
// ============================================================================

import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { adminSubscribersService, type DashboardStats } from '../services/adminSubscribers.service';
import {
  Building2, Users, GitBranch, MessageSquare,
  Zap, FileText, ShieldCheck, TrendingUp,
  Puzzle, Star, Activity,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await adminSubscribersService.getDashboardStats();
      setStats(data);
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
    orbit:    { bar: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   text: '#06B6D4' },
    nova:     { bar: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  text: '#8B5CF6' },
    galaxy:   { bar: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
    infinity: { bar: '#10B981', bg: 'rgba(16,185,129,0.1)',  text: '#10B981' },
    starter:  { bar: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   text: '#06B6D4' },
    growth:   { bar: '#8B5CF6', bg: 'rgba(139,92,246,0.1)',  text: '#8B5CF6' },
    pro:      { bar: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B' },
    enterprise:{ bar: '#10B981', bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
  };

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="admin-page-title">
            {greeting()}، <span style={{ color: '#06B6D4' }}>{user?.full_name_ar || 'مشرف'}</span>
          </h1>
          <p className="admin-page-subtitle">مركز التحكم الإداري — نظرة عامة على المنصة</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
          النظام يعمل بشكل طبيعي
        </div>
      </div>

      {/* ── Primary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} iconColor="#06B6D4" iconBg="rgba(6,182,212,0.1)"
          label="المنظمات" value={stats?.total_organizations ?? 0} />
        <StatCard icon={Users} iconColor="#8B5CF6" iconBg="rgba(139,92,246,0.1)"
          label="مشتركين نشطين" value={(stats?.total_subscribers_active ?? 0) + (stats?.total_subscribers_trial ?? 0)} />
        <StatCard icon={GitBranch} iconColor="#10B981" iconBg="rgba(16,185,129,0.1)"
          label="الفروع النشطة" value={stats?.total_branches ?? 0} />
        <StatCard icon={MessageSquare} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)"
          label="إجمالي التقييمات" value={stats?.total_reviews ?? 0} />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)"
          label="ردود AI" value={stats?.total_ai_replies_used ?? 0} />
        <StatCard icon={FileText} iconColor="#9CA3AF" iconBg="rgba(107,114,128,0.1)"
          label="ردود القوالب" value={stats?.total_template_replies_used ?? 0} />
        <StatCard icon={TrendingUp} iconColor="#10B981" iconBg="rgba(16,185,129,0.1)"
          label="تقييمات الشهر" value={stats?.reviews_this_month ?? 0} />
        <StatCard icon={ShieldCheck} iconColor="#06B6D4" iconBg="rgba(6,182,212,0.1)"
          label="المشرفين النشطين" value={stats?.admin_count ?? 0} />
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Plan distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3>توزيع الخطط</h3>
              <p>تفاصيل اشتراكات المنظمات الحالية</p>
            </div>
          </div>
          <div className="admin-card-body">
            {stats?.plan_distribution && Object.keys(stats.plan_distribution).length > 0 ? (
              <div className="space-y-3.5">
                {Object.entries(stats.plan_distribution).map(([plan, count]) => {
                  const total = Object.values(stats.plan_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const labels: Record<string, string> = {
                    orbit: 'مدار', nova: 'نوفا', galaxy: 'جالاكسي', infinity: 'إنفينيتي',
                    starter: 'المبتدئ', growth: 'النمو', pro: 'الاحترافي', enterprise: 'المؤسسات',
                  };
                  const pc = planColors[plan] || { bar: '#6B7280', bg: 'rgba(107,114,128,0.1)', text: '#9CA3AF' };
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.bar }} />
                          <span className="text-[13px] font-medium" style={{ color: '#E5E7EB' }}>
                            {labels[plan] || plan}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                            style={{ background: pc.bg, color: pc.text }}>
                            {count}
                          </span>
                          <span className="text-xs tabular-nums" style={{ color: '#6B7280' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: pc.bar, boxShadow: `0 0 8px ${pc.bar}50` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Activity size={28} style={{ color: '#374151' }} />
                <p className="text-sm" style={{ color: '#6B7280' }}>لا توجد بيانات متاحة</p>
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
                  color="#10B981" bg="rgba(16,185,129,0.1)" />
                <MiniStat label="تجريبي" value={stats?.total_subscribers_trial ?? 0}
                  color="#06B6D4" bg="rgba(6,182,212,0.1)" />
                <MiniStat label="منتهي" value={stats?.total_subscribers_expired ?? 0}
                  color="#EF4444" bg="rgba(239,68,68,0.1)" />
                <MiniStat label="إجمالي" value={stats?.total_organizations ?? 0}
                  color="#9CA3AF" bg="rgba(107,114,128,0.1)" />
              </div>
            </div>
          </div>

          {/* Recent organizations */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>أحدث المنظمات</h3></div>
            <div className="admin-card-body p-0">
              {stats?.recent_organizations && stats.recent_organizations.length > 0 ? (
                <div className="divide-y" style={{ borderColor: '#1F2937' }}>
                  {stats.recent_organizations.slice(0, 5).map((org) => (
                    <div key={org.id}
                      className="flex items-center justify-between px-5 py-3 transition-colors"
                      style={{ color: '#9CA3AF' }}
                      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}>
                          {org.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium" style={{ color: '#E5E7EB' }}>{org.name}</span>
                      </div>
                      <span className="text-[11px]">
                        {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                  <Building2 size={24} style={{ color: '#374151' }} />
                  <p className="text-xs" style={{ color: '#6B7280' }}>لا توجد منظمات بعد</p>
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
              <Activity size={15} style={{ color: '#8B5CF6' }} />
              <h3>نظرة عامة على النظام</h3>
            </div>
            <span className="admin-badge admin-badge-success">نشط</span>
          </div>
          <div className="admin-card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Star,      color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  value: (stats?.total_reviews ?? 0).toLocaleString('en-US'),          label: 'تقييمات Google' },
                { icon: Zap,       color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', value: (stats?.total_ai_replies_used ?? 0).toLocaleString('en-US'), label: 'ردود AI' },
                { icon: Puzzle,    color: '#10B981', bg: 'rgba(16,185,129,0.1)', value: '5',                                                           label: 'تكاملات مفعّلة' },
                { icon: TrendingUp,color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',  value: (stats?.reviews_this_month ?? 0).toLocaleString('en-US'),     label: 'تقييمات الشهر' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1F2937' }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold" style={{ color: '#E5E7EB' }}>{value}</div>
                    <div className="text-[10px] truncate" style={{ color: '#6B7280' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid #1F2937' }}>
              {[
                { label: 'Gemini AI', status: 'نشط', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                { label: 'Google Business', status: 'مربوط', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                { label: 'ChatGPT', status: 'قريباً', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-2.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1F2937' }}>
                  <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{s.label}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{ color: s.color, background: s.bg }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>إجراءات سريعة</h3></div>
          <div className="admin-card-body">
            <div className="space-y-2.5">
              {[
                { label: 'إدارة المشتركين', path: '/admin/subscribers', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)',  icon: Building2 },
                { label: 'الفواتير المعلّقة', path: '/admin/billing',    color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: FileText },
                { label: 'تذاكر الدعم',      path: '/admin/tickets',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', icon: MessageSquare },
                { label: 'استهلاك AI',       path: '/admin/ai-usage',   color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: Zap },
              ].map(({ label, path, color, bg, border, icon: Icon }) => (
                <a key={path} href={path}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-150"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <Icon size={15} />
                  {label}
                </a>
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
      <div className="text-2xl font-bold mb-1" style={{ color: '#E5E7EB' }}>
        {value.toLocaleString('en-US')}
      </div>
      <div className="text-xs" style={{ color: '#6B7280' }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="text-center py-3 px-2 rounded-xl transition-colors"
      style={{ background: bg, border: `1px solid ${color}30` }}>
      <div className="text-xl font-bold mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{label}</div>
    </div>
  );
}
