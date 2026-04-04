import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, type DbNotification } from '@/services/notifications';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Bell, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatTimeAgo } from '@/utils/helpers';

export default function Notifications() {
  const { lang } = useLanguage();
  const { organization } = useAuth();
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setError('');
    try {
      const data = await notificationService.list(organization.id);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationService.markRead(id);
      await loadNotifications();
    } catch (err) {
      console.warn('[Sadeem] Mark read failed:', err);
    }
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    if (!organization) return;
    try {
      await notificationService.markAllRead(organization.id);
      await loadNotifications();
    } catch (err) {
      console.warn('[Sadeem] Mark all read failed:', err);
    }
  };

  if (loading) return <LoadingState />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={loadNotifications} />;

  const unreadCount = items.filter((n: DbNotification) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={20} className="text-brand-500" />
            {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h1>
          <p className="page-subtitle">{lang === 'ar' ? 'تابع آخر التحديثات والتنبيهات المتعلقة بتقييماتك' : 'Stay updated with the latest alerts about your reviews'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCircle size={13} />
            {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <Bell size={16} className="text-brand-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{items.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{lang === 'ar' ? 'إجمالي الإشعارات' : 'Total'}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${unreadCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
            <span className={`text-xs font-bold ${unreadCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{unreadCount}</span>
          </div>
          <div>
            <div className={`text-lg font-bold leading-none ${unreadCount > 0 ? 'text-red-600' : 'text-content-primary'}`}>{unreadCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{lang === 'ar' ? 'غير مقروءة' : 'Unread'}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{items.length - unreadCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{lang === 'ar' ? 'مقروءة' : 'Read'}</div>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <h3>{lang === 'ar' ? 'جميع الإشعارات' : 'All Notifications'}</h3>
            {unreadCount > 0 && <Badge variant="danger">{unreadCount}</Badge>}
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState
            message={lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
            icon={<Bell size={44} strokeWidth={1} className="text-gray-200" />}
          />
        ) : (
          <div className="divide-y divide-border/60">
            {items.map((n: DbNotification) => (
              <div
                key={n.id}
                className={`px-5 py-3.5 transition-all duration-150 cursor-pointer hover:bg-surface-secondary/40 ${n.is_read ? '' : 'bg-brand-50/30 border-s-[3px] border-brand-400'}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.type === 'critical_review' ? 'bg-red-50' : n.type === 'complaint' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}>
                    {n.type === 'critical_review'
                      ? <Star size={15} className="text-red-500" />
                      : n.type === 'complaint'
                        ? <AlertTriangle size={15} className="text-amber-500" />
                        : <Bell size={15} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] leading-tight ${n.is_read ? 'text-content-secondary' : 'font-semibold text-content-primary'}`}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-content-tertiary flex-shrink-0">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-content-tertiary mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0 mt-2 animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
