import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { teamService, type TeamMemberRow } from '@/services/team';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatDateTime } from '@/utils/helpers';

export default function Team() {
  const { t, lang } = useLanguage();
  const { organization } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const data = await teamService.listMembers(organization.id);
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

  return (
    <div className="card">
      <div className="card-header">
        <h3>{t.teamPage.title} ({members.length})</h3>
      </div>
      {members.length === 0 ? (
        <EmptyState message={t.common.noData} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-right rtl:text-right ltr:text-left px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.teamPage.name}</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.teamPage.email}</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.teamPage.role}</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.teamPage.status}</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-content-secondary bg-surface-secondary border-b border-border">{t.teamPage.lastLogin}</th>
              </tr>
            </thead>
            <tbody>
              {members.map(({ membership: m, user: u }: TeamMemberRow) => (
                <tr key={m.id} className="border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                          {u.full_name.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="font-medium">{u.full_name || u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">{u.email}</td>
                  <td className="px-4 py-3"><Badge variant="info">{t.roles[m.role]}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusDot color={m.status === 'active' ? 'green' : 'gray'} />
                      <span className="text-xs">{t.status[m.status]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">{formatDateTime(u.created_at, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
