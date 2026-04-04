import { useState, type ChangeEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/i18n';
import { formatTimeAgo, getStatusColor } from '@/utils/helpers';
import { Check, Clock, X, Edit3, Sparkles, FileText, User } from 'lucide-react';
import type { DbReplyDraft } from '@/types/database';

export interface ResponseCardProps {
  draft: DbReplyDraft;
  onApprove: (draftId: string, finalReply: string) => Promise<void>;
  onReject: (draftId: string) => Promise<void>;
  onDefer: (draftId: string) => Promise<void>;
}

const SOURCE_ICONS: Record<string, typeof Sparkles> = {
  ai: Sparkles,
  template: FileText,
  manual: User,
};

export function ResponseCard({ draft, onApprove, onReject, onDefer }: ResponseCardProps) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const replyText = draft.edited_reply || draft.ai_reply || draft.final_reply || '';
  const sourceLabels: Record<string, string> = { ai: t.responsesInbox.ai, template: t.responsesInbox.template, manual: t.responsesInbox.manual };
  const canAct = draft.status === 'pending' || draft.status === 'deferred';
  const SourceIcon = SOURCE_ICONS[draft.source] || Sparkles;

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
    <div className="rounded-xl border border-border bg-white p-4 hover:border-border-dark hover:shadow-sm transition-all duration-150">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            draft.source === 'ai' ? 'bg-violet-50' : draft.source === 'template' ? 'bg-blue-50' : 'bg-gray-100'
          }`}>
            <SourceIcon size={13} className={
              draft.source === 'ai' ? 'text-violet-500' : draft.source === 'template' ? 'text-blue-500' : 'text-gray-500'
            } />
          </div>
          <span className="text-[13px] font-semibold text-content-primary">{sourceLabels[draft.source] || draft.source}</span>
          <Badge variant={getStatusColor(draft.status) as 'success' | 'warning' | 'danger' | 'info' | 'neutral'}>
            {(t.status as Record<string, string>)[draft.status] || draft.status}
          </Badge>
        </div>
        <span className="text-[10px] text-content-tertiary">{formatTimeAgo(draft.created_at)}</span>
      </div>

      {/* Reply content */}
      {editing ? (
        <textarea
          className="form-textarea text-[13px] mb-3"
          rows={3}
          value={editText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
          aria-label={t.responsesInbox.edit}
          autoFocus
        />
      ) : (
        <div className="rounded-lg p-3.5 mb-3" style={{
          background: draft.status === 'sent' ? 'rgba(5,150,105,0.06)' : 'rgba(76,110,245,0.05)',
          border: `1px solid ${draft.status === 'sent' ? 'rgba(5,150,105,0.12)' : 'rgba(76,110,245,0.1)'}`,
        }}>
          <p className="text-[13px] leading-relaxed" style={{ color: draft.status === 'sent' ? '#065f46' : '#1e3a8a' }}>
            {replyText}
          </p>
        </div>
      )}

      {/* Sent info */}
      {draft.final_reply && draft.status === 'sent' && draft.sent_at && (
        <div className="text-[11px] text-emerald-600 font-medium mb-3 flex items-center gap-1">
          <Check size={12} />
          {t.responsesInbox.sent}: {formatTimeAgo(draft.sent_at)}
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="flex items-center gap-2 pt-1">
          <button className="btn btn-primary btn-sm" onClick={handleApprove} disabled={actionLoading}>
            <Check size={13} /> {t.reviewsCenter.approve}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(!editing); setEditText(replyText); }}>
            <Edit3 size={13} /> {t.responsesInbox.edit}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleDefer} disabled={actionLoading}>
            <Clock size={13} /> {t.responsesInbox.defer}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={actionLoading} title={t.responsesInbox.reject} aria-label={t.responsesInbox.reject}>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
