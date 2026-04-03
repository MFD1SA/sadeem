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
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3>{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h3>
          {unreadCount > 0 && <Badge variant="danger">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCircle size={13} />
            {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </button>
        )}
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
              className={`px-5 py-3 transition-colors ${n.is_read ? '' : 'bg-brand-50/30'}`}
              onClick={() => !n.is_read && notificationService.markRead(n.id).then(loadNotifications)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  n.type === 'critical_review' ? 'bg-red-50' : n.type === 'complaint' ? 'bg-amber-50' : 'bg-blue-50'
                }`}>
                  {n.type === 'critical_review'
                    ? <Star size={14} className="text-red-500" />
                    : n.type === 'complaint'
                      ? <AlertTriangle size={14} className="text-amber-500" />
                      : <Bell size={14} className="text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] ${n.is_read ? 'text-content-secondary' : 'font-semibold text-content-primary'}`}>
                      {n.title}
                    </span>
                    <span className="text-2xs text-content-tertiary flex-shrink-0">{formatTimeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-content-tertiary mt-0.5">{n.body}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
