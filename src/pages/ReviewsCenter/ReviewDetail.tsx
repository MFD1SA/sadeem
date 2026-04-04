import { useState, useEffect, type ChangeEvent } from 'react';
import { useLanguage } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime, renderStars, getStatusColor, getSentimentColor } from '@/utils/helpers';
import { reviewsService, replyDraftsService } from '@/services/reviews';
import { reviewSyncService } from '@/services/sync';
import { usageService } from '@/services/usage';
import { Send, Clock, X, Edit3, MessageSquare, AlertTriangle } from 'lucide-react';
import type { DbReview, DbReplyDraft } from '@/types/database';
import { auditLog } from '@/services/audit';

interface Props {
  review: DbReview | null;
  branchName: string;
  onUpdate: () => void;
}

export function ReviewDetail({ review, branchName, onUpdate }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DbReplyDraft[]>([]);
  const [editingReply, setEditingReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [manualReply, setManualReply] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!review) { setDrafts([]); return; }
    reviewsService.getWithDrafts(review.id)
      .then(({ drafts: d }) => setDrafts(d))
      .catch(() => setDrafts([]));
  }, [review?.id]);

  if (!review) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-content-tertiary p-4">
        <div className="text-center">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>{t.reviewsCenter.selectReview}</p>
        </div>
      </div>
    );
  }

  const latestDraft = drafts[0] || null;
  const suggestedReply = latestDraft?.ai_reply || latestDraft?.edited_reply || '';
  const isFollowUp = review.is_followup || review.status === 'manual_review_required';

  const handleApprove = async () => {
    if (!latestDraft || !user || !review) return;
    setActionLoading(true);
    setActionError('');
    try {
      // Check quota before sending
      const usageCheck = await usageService.checkAndIncrementTemplateReply(review.organization_id);
      if (!usageCheck.allowed) {
        setActionError(usageCheck.reason || t.reviewsCenter.replyLimitReached);
        return;
      }
      const finalText = replyText || suggestedReply;
      // If user edited the text, save it and audit the edit
      if (replyText && replyText !== suggestedReply) {
        auditLog.track({
          event: 'draft_edited',
          organization_id: review.organization_id,
          entity_id: latestDraft.id,
          entity_type: 'draft',
          user_id: user.id,
          actor_type: 'user',
          details: {
            draft_id: latestDraft.id,
            review_id: review.id,
            previous_text: suggestedReply.substring(0, 200),
            new_text: replyText.substring(0, 200),
          },
        });
        await replyDraftsService.approve(latestDraft.id, user.id, finalText);
      }
      // Always send through the Google-posting path
      await reviewSyncService.sendReplyToGoogle(latestDraft.id, user.id);
      onUpdate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.reviewsCenter.failedToSendReply);
    } finally { setActionLoading(false); }
  };

  const handleDefer = async () => {
    if (!latestDraft) return;
    setActionLoading(true);
    setActionError('');
    try {
      await replyDraftsService.defer(latestDraft.id, user?.id);
      onUpdate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.reviewsCenter.failed);
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!latestDraft) return;
    setActionLoading(true);
    setActionError('');
    try {
      await replyDraftsService.reject(latestDraft.id, user?.id);
      onUpdate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.reviewsCenter.failed);
    } finally { setActionLoading(false); }
  };

  const handleManualSend = async () => {
    if (!manualReply.trim() || !user || !review) return;
    setActionLoading(true);
    setActionError('');
    try {
      // Check quota before sending
      const usageCheck = await usageService.checkAndIncrementTemplateReply(review.organization_id);
      if (!usageCheck.allowed) {
        setActionError(usageCheck.reason || t.reviewsCenter.replyLimitReached);
        return;
      }
      const draft = await replyDraftsService.create({
        review_id: review.id,
        organization_id: review.organization_id,
        edited_reply: manualReply,
        source: 'manual',
      });
      auditLog.track({
        event: 'draft_created',
        organization_id: review.organization_id,
        entity_id: draft.id,
        entity_type: 'draft',
        user_id: user.id,
        actor_type: 'user',
        details: { draft_id: draft.id, review_id: review.id, source: 'manual' },
      });
      await reviewSyncService.sendReplyToGoogle(draft.id, user.id);
      setManualReply('');
      onUpdate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.reviewsCenter.failedToSendReply);
    } finally { setActionLoading(false); }
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Reviewer Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-content-secondary">
            {review.reviewer_name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-content-primary">{review.reviewer_name}</div>
            <div className="text-2xs text-content-tertiary">{formatDateTime(review.published_at)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-500 text-lg">{renderStars(review.rating)}</span>
          <span className="text-sm font-semibold text-content-primary">{review.rating}/5</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="neutral">{branchName}</Badge>
          {review.sentiment && (
            <Badge variant={getSentimentColor(review.sentiment) as 'success' | 'warning' | 'danger'}>
              {(t.sentiment as Record<string, string>)[review.sentiment] || review.sentiment}
            </Badge>
          )}
          <Badge variant={getStatusColor(review.status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>
            {(t.status as Record<string, string>)[review.status] || review.status}
          </Badge>
        </div>
      </div>

      {/* Review text */}
      <div className="bg-surface-secondary rounded-lg p-4 mb-4 border border-border">
        <p className="text-sm text-content-primary leading-relaxed">{review.review_text}</p>
      </div>

      {/* Follow-up warning */}
      {isFollowUp && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-amber-800 mb-0.5">
              {t.reviewsCenter.followUpTitle}
            </div>
            <div className="text-2xs text-amber-700">
              {t.reviewsCenter.followUpText}
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-red-700">{actionError}</span>
        </div>
      )}

      {/* Reply Section */}
      {review.status === 'replied' || review.status === 'auto_replied' ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
            <Send size={13} />
            {(t.status as Record<string, string>)[review.status] || review.status}
          </div>
          <p className="text-sm text-emerald-800">{latestDraft?.final_reply || latestDraft?.edited_reply || latestDraft?.ai_reply || ''}</p>
          {latestDraft?.sent_at && (
            <div className="text-2xs text-emerald-600 mt-2">{formatDateTime(latestDraft.sent_at)}</div>
          )}
        </div>
      ) : isFollowUp ? (
        /* Manual reply for follow-up reviews */
        <div>
          <div className="text-xs font-semibold text-content-secondary mb-2">
            {t.reviewsCenter.manualReply}
          </div>
          <textarea
            className="form-textarea text-sm mb-3"
            rows={4}
            value={manualReply}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setManualReply(e.target.value)}
            placeholder={t.reviewsCenter.manualReplyPlaceholder}
            aria-label={t.reviewsCenter.manualReply}
          />
          <button className="btn btn-primary btn-sm" onClick={handleManualSend} disabled={actionLoading || !manualReply.trim()}>
            <Send size={13} />
            {actionLoading ? t.common.loading : t.reviewsCenter.sendReply}
          </button>
        </div>
      ) : suggestedReply ? (
        /* AI suggested reply */
        <div>
          <div className="text-xs font-semibold text-content-secondary mb-2">{t.reviewsCenter.suggestedReply}</div>
          {editingReply ? (
            <textarea
              className="form-textarea text-sm mb-3"
              rows={4}
              value={replyText || suggestedReply}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
              aria-label={t.reviewsCenter.editReply}
            />
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-800">{suggestedReply}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={actionLoading}>
              <Send size={13} />
              {actionLoading ? t.common.loading : t.reviewsCenter.approve}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setEditingReply(!editingReply); setReplyText(suggestedReply); }}>
              <Edit3 size={13} /> {t.reviewsCenter.editReply}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDefer} disabled={actionLoading}>
              <Clock size={13} /> {t.reviewsCenter.defer}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading}>
              <X size={13} /> {t.reviewsCenter.reject}
            </button>
          </div>
        </div>
      ) : (
        /* No draft yet — show manual reply */
        <div>
          <div className="text-xs font-semibold text-content-secondary mb-2">
            {t.reviewsCenter.writeReply}
          </div>
          <textarea
            className="form-textarea text-sm mb-3"
            rows={3}
            value={manualReply}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setManualReply(e.target.value)}
            placeholder={t.reviewsCenter.writeReplyPlaceholder}
            aria-label={t.reviewsCenter.writeReply}
          />
          <button className="btn btn-primary btn-sm" onClick={handleManualSend} disabled={actionLoading || !manualReply.trim()}>
            <Send size={13} />
            {actionLoading ? t.common.loading : t.reviewsCenter.send}
          </button>
        </div>
      )}
    </div>
  );
}
