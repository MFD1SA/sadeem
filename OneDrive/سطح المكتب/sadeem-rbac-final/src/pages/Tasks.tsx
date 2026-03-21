import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { dashboardService } from '@/services/dashboard';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { Camera, MessageSquare, FileText, CheckCircle, Circle } from 'lucide-react';

interface ActionItem {
  id: string;
  icon: ReactNode;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

export default function Tasks() {
  const { lang } = useLanguage();
  const { organization } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActions = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    try {
      const stats = await dashboardService.getStats(organization.id);
      const items: ActionItem[] = [];

      if (stats.unrepliedCount > 0) {
        items.push({
          id: 'reply_reviews',
          icon: <MessageSquare size={16} />,
          titleAr: `رد على ${stats.unrepliedCount} تقييم بدون رد`,
          titleEn: `Reply to ${stats.unrepliedCount} unreplied reviews`,
          descAr: 'الرد السريع يحسّن تقييمك على Google',
          descEn: 'Quick responses improve your Google rating',
          priority: 'high',
          done: false,
        });
      }

      if (stats.responseRate < 80) {
        items.push({
          id: 'improve_response_rate',
          icon: <MessageSquare size={16} />,
          titleAr: `ارفع نسبة الرد من ${stats.responseRate}% إلى 80%+`,
          titleEn: `Raise response rate from ${stats.responseRate}% to 80%+`,
          descAr: 'نسبة الرد العالية تؤثر إيجابياً على ترتيبك',
          descEn: 'High response rate positively impacts your ranking',
          priority: 'medium',
          done: false,
        });
      }

      items.push({
        id: 'add_photos',
        icon: <Camera size={16} />,
        titleAr: 'أضف صوراً جديدة لنشاطك على Google',
        titleEn: 'Add new photos to your Google listing',
        descAr: 'الصور تزيد تفاعل العملاء بنسبة 42%',
        descEn: 'Photos increase customer engagement by 42%',
        priority: 'medium',
        done: false,
      });

      items.push({
        id: 'update_description',
        icon: <FileText size={16} />,
        titleAr: 'حدّث وصف نشاطك التجاري',
        titleEn: 'Update your business description',
        descAr: 'وصف محدّث بالكلمات المفتاحية يحسّن ظهورك',
        descEn: 'Updated description with keywords improves visibility',
        priority: 'low',
        done: false,
      });

      setActions(items);
    } catch {} finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadActions(); }, [loadActions]);

  const toggleDone = (id: string) => {
    setActions((prev: ActionItem[]) => prev.map((a: ActionItem) => a.id === id ? { ...a, done: !a.done } : a));
  };

  if (loading) return <LoadingState />;

  const pending = actions.filter((a: ActionItem) => !a.done);
  const completed = actions.filter((a: ActionItem) => a.done);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <h3>{lang === 'ar' ? 'إجراءات مطلوبة' : 'Action Items'}</h3>
          <Badge variant={pending.length > 0 ? 'warning' : 'success'}>{pending.length}</Badge>
        </div>
        {actions.length === 0 ? (
          <div className="py-12 text-center text-sm text-content-tertiary">
            {lang === 'ar' ? 'لا توجد إجراءات مطلوبة حالياً' : 'No action items right now'}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {actions.map((action: ActionItem) => (
              <button
                key={action.id}
                onClick={() => toggleDone(action.id)}
                className={`w-full text-start px-5 py-3.5 flex items-start gap-3 transition-colors hover:bg-surface-secondary/40 ${action.done ? 'opacity-50' : ''}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {action.done
                    ? <CheckCircle size={18} className="text-emerald-500" />
                    : <Circle size={18} className="text-content-tertiary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[13px] font-medium ${action.done ? 'line-through text-content-tertiary' : 'text-content-primary'}`}>
                    {lang === 'ar' ? action.titleAr : action.titleEn}
                  </div>
                  <div className="text-2xs text-content-tertiary mt-0.5">
                    {lang === 'ar' ? action.descAr : action.descEn}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-content-tertiary`}>{action.icon}</span>
                  <Badge variant={action.priority === 'high' ? 'danger' : action.priority === 'medium' ? 'warning' : 'neutral'}>
                    {action.priority === 'high' ? (lang === 'ar' ? 'مهم' : 'High') : action.priority === 'medium' ? (lang === 'ar' ? 'متوسط' : 'Med') : (lang === 'ar' ? 'منخفض' : 'Low')}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
