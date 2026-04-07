import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { replyDraftsService, reviewsService } from '@/services/reviews';
import { usageService } from '@/services/usage';
import { reviewSyncService } from '@/services/sync';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { ResponseCard, type ResponseCardProps } from './ResponseCard';
import type { DbReplyDraft } from '@/types/database';

let _cache: DbReplyDraft[] | null = null;

export default function ResponsesInbox() {
  const { t, lang } = useLanguage();
  useEffect(() => { document.title = lang === 'ar' ? 'سيندا — الردود' : 'SENDA — Replies'; }, [lang]);
  const { organization, user, isLoading: authLoading } = useAuth();

  const [drafts, setDrafts] = useState<DbReplyDraft[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const loadDrafts = useCallback(async () => {
    if (!organization?.id) return;

    if (_cache === null) setLoading(true);
    setError('');

    try {
      const data = await replyDraftsService.list(organization.id);
      _cache = data;
      setDrafts(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!organization?.id) { if (!authLoading) setLoading(false); return; }
    void loadDrafts();
  }, [organization?.id, loadDrafts, authLoading]);

  useEffect(() => { _cache = null; }, [organization?.id]);

  const handleApprove = async (draftId: string, finalReply: string) => {
    if (!user || !organization?.id) return;

    try {
      const usageCheck = await usageService.checkAndIncrementTemplateReply(organization.id);

      if (!usageCheck.allowed) {
        setError(t.responsesInbox.templateLimitReached);
        return;
      }

      // Save edited text before sending
      await supabase.from('reply_drafts').update({ reply_text: finalReply }).eq('id', draftId);

      await reviewSyncService.sendReplyToGoogle(draftId, user.id);

      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to approve draft');
    }
  };

  const handleReject = async (draftId: string) => {
    if (!user) return;
    try {
      await replyDraftsService.reject(draftId, user.id);
      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reject draft');
    }
  };

  const handleDefer = async (draftId: string) => {
    if (!user) return;
    try {
      await replyDraftsService.defer(draftId, user.id);
      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to defer draft');
    }
  };

  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDrafts} />;
  }

  const tabs = [
    { id: 'all', label: t.common.all, count: drafts.length },
    {
      id: 'pending',
      label: t.responsesInbox.pendingApproval,
      count: drafts.filter((d: DbReplyDraft) => d.status === 'pending').length,
    },
    {
      id: 'deferred',
      label: t.responsesInbox.deferred,
      count: drafts.filter((d: DbReplyDraft) => d.status === 'deferred').length,
    },
    {
      id: 'auto_sent',
      label: t.responsesInbox.autoSent,
      count: drafts.filter((d: DbReplyDraft) => d.status === 'auto_sent').length,
    },
    {
      id: 'sent',
      label: t.responsesInbox.sent,
      count: drafts.filter((d: DbReplyDraft) => d.status === 'sent').length,
    },
    {
      id: 'rejected',
      label: t.responsesInbox.rejected,
      count: drafts.filter((d: DbReplyDraft) => d.status === 'rejected').length,
    },
  ];

  const filtered = tab === 'all'
    ? drafts
    : drafts.filter((d: DbReplyDraft) => d.status === tab);

  const pendingCount = drafts.filter((d: DbReplyDraft) => d.status === 'pending').length;
  const sentCount = drafts.filter((d: DbReplyDraft) => d.status === 'sent' || d.status === 'auto_sent').length;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {t.responsesInbox.title}
          </h1>
          <p className="page-subtitle">{t.responsesInbox.subtitle}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <span className="text-brand-500 text-xs font-bold">{drafts.length}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-content-primary leading-none">{drafts.length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.responsesInbox.totalDrafts}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pendingCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
            <span className={`text-xs font-bold ${pendingCount > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{pendingCount}</span>
          </div>
          <div>
            <div className={`text-lg font-bold leading-none ${pendingCount > 0 ? 'text-amber-600' : 'text-content-primary'}`}>{pendingCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.responsesInbox.pending}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <span className="text-emerald-500 text-xs font-bold">{sentCount}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-none">{sentCount}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.responsesInbox.sent}</div>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <span className="text-red-500 text-xs font-bold">{drafts.filter((d: DbReplyDraft) => d.status === 'rejected').length}</span>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600 leading-none">{drafts.filter((d: DbReplyDraft) => d.status === 'rejected').length}</div>
            <div className="text-[10px] text-content-tertiary mt-0.5 font-medium">{t.responsesInbox.rejected}</div>
          </div>
        </div>
      </div>

      {/* Main card with tabs */}
      <div className="card">
        <div className="px-5 pt-4 border-b border-border">
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState message={t.common.noResults} />
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((d: DbReplyDraft) => {
              const cardProps: ResponseCardProps = {
                draft: d,
                onApprove: handleApprove,
                onReject: handleReject,
                onDefer: handleDefer,
              };

              return <ResponseCard key={d.id} {...cardProps} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
