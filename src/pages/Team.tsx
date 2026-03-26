import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { teamService, type TeamMemberRow } from '@/services/team';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatDateTime } from '@/utils/helpers';
import { UserPlus, X } from 'lucide-react';

let _cache: TeamMemberRow[] | null = null;

export default function Team() {
  const { t, lang } = useLanguage();
  const { organization } = useAuth();
  const [members, setMembers] = useState<TeamMemberRow[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError('');
    try {
      await teamService.inviteMember(organization.id, inviteEmail, inviteRole);
      _cache = null;
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
          <button className="btn btn-primary btn-sm" type="button" onClick={() => { setShowInvite(true); setInviteError(''); setInviteSuccess(false); }}>
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

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}>
          <div className="bg-surface-primary rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-content-primary text-sm">{lang === 'ar' ? 'دعوة عضو جديد' : 'Invite New Member'}</h3>
              <button onClick={() => setShowInvite(false)} className="text-content-tertiary hover:text-content-primary transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder={lang === 'ar' ? 'example@email.com' : 'example@email.com'}
                  className="input w-full"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-content-secondary mb-1.5">{lang === 'ar' ? 'الدور' : 'Role'}</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member' | 'admin')} className="input w-full">
                  <option value="member">{lang === 'ar' ? 'عضو' : 'Member'}</option>
                  <option value="admin">{lang === 'ar' ? 'مشرف' : 'Admin'}</option>
                </select>
              </div>
              {inviteError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{lang === 'ar' ? 'تمت الدعوة بنجاح!' : 'Member added successfully!'}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowInvite(false)} className="btn btn-ghost btn-sm flex-1">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={inviting} className="btn btn-primary btn-sm flex-1">
                  {inviting ? (lang === 'ar' ? 'جاري الإضافة…' : 'Adding…') : (lang === 'ar' ? 'إضافة العضو' : 'Add Member')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
