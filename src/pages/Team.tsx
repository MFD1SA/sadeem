import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { teamService, type TeamMemberRow } from '@/services/team';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatDateTime } from '@/utils/helpers';
import { UserPlus, X, Lock } from 'lucide-react';

// Module-level cache scoped to organization ID to prevent cross-org data leaks.
let _cache: { orgId: string; data: TeamMemberRow[] } | null = null;

export default function Team() {
  const { t, lang } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا | SENDA — الفريق' : 'SENDA | سيندا — Team'; }, [lang]);
  const { organization } = useAuth();
  const { limits, trial } = usePlan();
  const orgId = organization?.id;
  const validCache = _cache && _cache.orgId === orgId ? _cache.data : null;
  const [members, setMembers] = useState<TeamMemberRow[]>(validCache ?? []);
  const [loading, setLoading] = useState(validCache === null);
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!organization) { setLoading(false); return; }
    if (!_cache || _cache.orgId !== organization.id) setLoading(true);
    setError('');
    try {
      const data = await teamService.listMembers(organization.id);
      _cache = { orgId: organization.id, data };
      setMembers(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    // Re-check limit at submit time (covers race conditions)
    if (members.length >= limits.maxTeamMembers) {
      setInviteError(t.teamExt.memberLimitMsg.replace('{0}', String(limits.maxTeamMembers)));
      return;
    }
    setInviting(true);
    setInviteError('');
    try {
      await teamService.inviteMember(organization.id, inviteEmail, inviteRole);
      _cache = null; // Invalidate to force reload
      await loadMembers();
      setInviteSuccess(true);
      setTimeout(() => { setShowInvite(false); setInviteEmail(''); setInviteRole('member'); setInviteSuccess(false); }, 1500);
    } catch (err: unknown) {
      setInviteError((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <LoadingState message={t.common.loading} />;
  if (error) return <ErrorState message={error} onRetry={loadMembers} />;

  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';

  const activeCount = members.filter(({ membership: m }) => m.status === 'active').length;
  const adminCount = members.filter(({ membership: m }) => m.role === 'owner' || m.role === 'admin').length;

  // Plan limit enforcement
  const maxMembers = limits.maxTeamMembers;
  const canAddMember = !trial.isExpired && members.length < maxMembers;
  const atMemberLimit = !trial.isExpired && members.length >= maxMembers;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <UserPlus size={20} className="text-brand-500" />
          {t.teamExt.teamManagement}
        </h1>
        <p className="page-subtitle">{t.teamExt.teamManagementDesc}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <span className="text-brand-500 text-xs font-bold">{members.length}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{members.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.teamExt.totalMembers}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold">{activeCount}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{activeCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.teamExt.activeMembers}
            </div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
            <span className="text-violet-500 text-xs font-bold">{adminCount}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-violet-600 leading-none">{adminCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">
              {t.teamExt.ownersAdmins}
            </div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-header">
          <h3>
            {t.teamPage.title} ({members.length}
            {maxMembers < 999999 && `/${maxMembers}`})
          </h3>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={!canAddMember}
            title={atMemberLimit ? t.teamExt.memberLimitTitle.replace('{0}', String(maxMembers)) : undefined}
            onClick={() => { if (canAddMember) { setShowInvite(true); setInviteError(''); setInviteSuccess(false); } }}
          >
            {atMemberLimit ? <Lock size={14} /> : <UserPlus size={14} />}
            {t.teamExt.inviteMember}
          </button>
        </div>

        {atMemberLimit && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-600">
            <Lock size={13} className="flex-shrink-0" />
            <span>
              {t.teamExt.memberLimitBanner.replace('{0}', String(maxMembers))}
            </span>
          </div>
        )}

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
                    <Badge variant="info">{(t.roles as Record<string, string>)[m.role] || m.role}</Badge>
                    <div className="flex items-center gap-1.5">
                      <StatusDot color={m.status === 'active' ? 'green' : 'gray'} />
                      <span className="text-xs text-content-secondary">{(t.status as Record<string, string>)[m.status] || m.status}</span>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="text-2xs text-content-tertiary">
                    {t.teamExt.joined}
                    {formatDateTime(u.created_at, locale)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}>
          <div className="bg-surface-primary rounded-2xl shadow-2xl w-full max-w-md border border-border" role="dialog" aria-modal="true" aria-labelledby="invite-modal-title">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 id="invite-modal-title" className="font-semibold text-content-primary text-sm">{t.teamExt.inviteNewMember}</h3>
              <button onClick={() => setShowInvite(false)} className="text-content-tertiary hover:text-content-primary transition-colors focus:outline-2 focus:outline-brand-500 rounded-lg" aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label htmlFor="invite-email" className="block text-xs font-medium text-content-secondary mb-1.5">{t.teamExt.inviteEmail}</label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="input w-full"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-xs font-medium text-content-secondary mb-1.5">{t.teamExt.inviteRole}</label>
                <select id="invite-role" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member' | 'admin')} className="input w-full" aria-label={t.teamExt.inviteRole}>
                  <option value="member">{t.teamExt.member}</option>
                  <option value="admin">{t.teamExt.admin}</option>
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{t.teamExt.memberAdded}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowInvite(false)} className="btn btn-ghost btn-sm flex-1">{t.common.cancel}</button>
                <button type="submit" disabled={inviting} className="btn btn-primary btn-sm flex-1">
                  {inviting ? t.teamExt.adding : t.teamPage.addMember}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
