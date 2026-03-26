import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { replyDraftsService, reviewsService } from '@/services/reviews';
import { usageService } from '@/services/usage';
import { LoadingState, ErrorState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { ResponseCard, type ResponseCardProps } from './ResponseCard';
import type { DbReplyDraft } from '@/types/database';

let _cache: DbReplyDraft[] | null = null;

export default function ResponsesInbox() {
  const { t, lang } = useLanguage();
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
    if (authLoading) return;
    if (!organization?.id) { setLoading(false); return; }
    void loadDrafts();
  }, [authLoading, organization?.id, loadDrafts]);

  const handleApprove = async (draftId: string, finalReply: string) => {
    if (!user || !organization?.id) return;

    try {
      const usageCheck = await usageService.checkAndIncrementTemplateReply(organization.id);

      if (!usageCheck.allowed) {
        setError(
          lang === 'ar'
            ? 'لقد وصلت إلى الحد المسموح من الردود الجاهزة.'
            : 'Template reply limit reached. Upgrade to continue.'
        );
        return;
      }

      await replyDraftsService.approve(draftId, user.id, finalReply);

      const draft = drafts.find((d: DbReplyDraft) => d.id === draftId);
      if (draft?.review_id) {
        await reviewsService.updateStatus(draft.review_id, 'replied');
      }

      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to approve draft');
    }
  };

  const handleReject = async (draftId: string) => {
    try {
      await replyDraftsService.reject(draftId);
      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reject draft');
    }
  };

  const handleDefer = async (draftId: string) => {
    try {
      await replyDraftsService.defer(draftId);
      await loadDrafts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to defer draft');
    }
  };

  if (authLoading || loading) {
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

  return (
    <div className="card">
      <div className="px-5 pt-4">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={t.common.noResults} />
      ) : (
        <div>
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
  );
}
