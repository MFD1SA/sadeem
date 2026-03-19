import { useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/i18n';
import { formatTimeAgo, getStatusColor } from '@/utils/helpers';
import { Check, Clock, X, Edit3 } from 'lucide-react';
import type { DbReplyDraft } from '@/types/database';

export interface ResponseCardProps {
  draft: DbReplyDraft;
  onApprove: (draftId: string, finalReply: string) => Promise<void>;
  onReject: (draftId: string) => Promise<void>;
  onDefer: (draftId: string) => Promise<void>;
}

export function ResponseCard({ draft, onApprove, onReject, onDefer }: ResponseCardProps) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const replyText = draft.edited_reply || draft.ai_reply || draft.final_reply || '';
  const sourceLabels: Record<string, string> = { ai: t.responsesInbox.ai, template: t.responsesInbox.template, manual: t.responsesInbox.manual };
  const canAct = draft.status === 'pending' || draft.status === 'deferred';

  const handleApprove = async () => {
    setActionLoading(true);
    try { await onApprove(draft.id, editing ? editText : replyText); } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try { await onReject(draft.id); } finally { setActionLoading(false); }
  };

  const handleDefer = async () => {
    setActionLoading(true);
    try { await onDefer(draft.id); } finally { setActionLoading(false); }
  };

  return (
    <div className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{sourceLabels[draft.source] || draft.source}</Badge>
          <Badge variant={getStatusColor(draft.status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>
            {t.status[draft.status] || draft.status}
          </Badge>
        </div>
        <span className="text-2xs text-content-tertiary">{formatTimeAgo(draft.created_at)}</span>
      </div>

      {editing ? (
        <textarea
          className="form-textarea text-xs mb-2"
          rows={3}
          value={editText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
        />
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-2">
          <p className="text-xs text-blue-800">{replyText}</p>
        </div>
      )}

      {draft.final_reply && draft.status === 'sent' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 mb-2">
          <p className="text-xs text-emerald-800">{draft.final_reply}</p>
          {draft.sent_at && <div className="text-2xs text-emerald-600 mt-1">{lang === 'ar' ? 'أُرسل' : 'Sent'}: {formatTimeAgo(draft.sent_at)}</div>}
        </div>
      )}

      {canAct && (
        <div className="flex items-center gap-1.5 mt-2">
          <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={actionLoading}>
            <Check size={12} /> {t.reviewsCenter.approve}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(!editing); setEditText(replyText); }}>
            <Edit3 size={12} /> {t.reviewsCenter.editReply}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleDefer} disabled={actionLoading}>
            <Clock size={12} /> {t.reviewsCenter.defer}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
