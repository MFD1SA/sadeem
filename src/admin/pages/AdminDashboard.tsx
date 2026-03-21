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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white mb-1">
          {greeting()}، {user?.full_name_ar || 'مشرف'}
        </h1>
        <p className="text-sm text-slate-400">مركز التحكم الإداري لمنصة سديم</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Building2} color="cyan" label="المنظمات" value={stats?.total_organizations ?? 0} />
        <StatCard icon={Users} color="blue" label="مشتركين نشطين"
          value={(stats?.total_subscribers_active ?? 0) + (stats?.total_subscribers_trial ?? 0)} />
        <StatCard icon={GitBranch} color="emerald" label="الفروع النشطة" value={stats?.total_branches ?? 0} />
        <StatCard icon={MessageSquare} color="purple" label="إجمالي التقييمات" value={stats?.total_reviews ?? 0} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Zap} color="amber" label="ردود AI المستخدمة" value={stats?.total_ai_replies_used ?? 0} />
        <StatCard icon={FileText} color="slate" label="ردود القوالب" value={stats?.total_template_replies_used ?? 0} />
        <StatCard icon={TrendingUp} color="emerald" label="تقييمات هذا الشهر" value={stats?.reviews_this_month ?? 0} />
        <StatCard icon={ShieldCheck} color="cyan" label="المشرفين النشطين" value={stats?.admin_count ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan distribution */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>توزيع الخطط</h3></div>
          <div className="admin-card-body">
            {stats?.plan_distribution && Object.keys(stats.plan_distribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.plan_distribution).map(([plan, count]) => {
                  const total = Object.values(stats.plan_distribution).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const labels: Record<string, string> = { starter: 'المبتدئ', growth: 'النمو', pro: 'الاحترافي', enterprise: 'المؤسسات' };
                  return (
                    <div key={plan}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-300">{labels[plan] || plan}</span>
                        <span className="text-white font-medium">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">لا توجد بيانات</p>
            )}
          </div>
        </div>

        {/* Recent organizations */}
        <div className="admin-card">
          <div className="admin-card-header"><h3>أحدث المنظمات</h3></div>
          <div className="admin-card-body">
            {stats?.recent_organizations && stats.recent_organizations.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02]">
                    <span className="text-sm text-white">{org.name}</span>
                    <span className="text-xs text-slate-500">{new Date(org.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">لا توجد منظمات بعد</p>
            )}
          </div>
        </div>

        {/* Subscription status breakdown */}
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header"><h3>حالة الاشتراكات</h3></div>
          <div className="admin-card-body">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="نشط" value={stats?.total_subscribers_active ?? 0} color="emerald" />
              <MiniStat label="تجريبي" value={stats?.total_subscribers_trial ?? 0} color="blue" />
              <MiniStat label="منتهي" value={stats?.total_subscribers_expired ?? 0} color="red" />
              <MiniStat label="إجمالي" value={stats?.total_organizations ?? 0} color="slate" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="admin-stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value.toLocaleString('ar-SA')}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center py-3 px-2 rounded-xl bg-white/[0.02]">
      <div className={`text-xl font-bold text-${color}-400 mb-1`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
