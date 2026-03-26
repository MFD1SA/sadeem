import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { teamService, type TeamMemberRow } from '@/services/team';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatDateTime } from '@/utils/helpers';
import { UserPlus } from 'lucide-react';

let _cache: TeamMemberRow[] | null = null;

export default function Team() {
  const { t, lang } = useLanguage();
  const { organization } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    if (_cache === null) setLoading(true);
    setError('');
    try {
      const data = await teamService.listMembers(organization.id);
      _cache = data;
      setMembers(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadMembers} />;

  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';

  const activeCount = members.filter(({ membership: m }) => m.status === 'active').length;
  const adminCount = members.filter(({ membership: m }) => m.role === 'owner' || m.role === 'admin').length;

  return (
    <div className="space-y-5">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-content-primary">{members.length}</div>
          <div className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}
          </div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-content-primary">{activeCount}</div>
          <div className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar' ? 'الأعضاء النشطون' : 'Active Members'}
          </div>
        </div>
        <div className="card card-body text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-content-primary">{adminCount}</div>
          <div className="text-xs text-content-tertiary mt-0.5">
            {lang === 'ar' ? 'المالكون / الإداريون' : 'Owners / Admins'}
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <h3>{t.teamPage.title} ({members.length})</h3>
          <button className="btn btn-primary btn-sm" type="button">
            <UserPlus size={14} />
            {lang === 'ar' ? 'دعوة عضو' : 'Invite Member'}
          </button>
        </div>

        {members.length === 0 ? (
          <EmptyState message={t.common.noData} />
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map(({ membership: m, user: u }: TeamMemberRow) => (
                <div
                  key={m.id}
                  className="card card-body flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold ring-2 ring-border">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-content-primary truncate">
                        {u.full_name || u.email}
                      </div>
                      <div className="text-xs text-content-tertiary truncate">{u.email}</div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Role + Status */}
                  <div className="flex items-center justify-between">
                    <Badge variant="info">{t.roles[m.role]}</Badge>
                    <div className="flex items-center gap-1.5">
                      <StatusDot color={m.status === 'active' ? 'green' : 'gray'} />
                      <span className="text-xs text-content-secondary">{t.status[m.status]}</span>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="text-2xs text-content-tertiary">
                    {lang === 'ar' ? 'تاريخ الانضمام: ' : 'Joined: '}
                    {formatDateTime(u.created_at, locale)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
