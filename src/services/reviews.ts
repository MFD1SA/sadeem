import { supabase } from '@/lib/supabase';
import type { DbReview, DbReplyDraft } from '@/types/database';
import { auditLog } from '@/services/audit';

export const reviewsService = {
  async list(organizationId: string, filters?: {
    branchId?: string;
    status?: string;
    rating?: number;
    sentiment?: string;
  }): Promise<DbReview[]> {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('organization_id', organizationId)
      .order('published_at', { ascending: false });

    if (filters?.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.rating) query = query.eq('rating', filters.rating);
    if (filters?.sentiment) query = query.eq('sentiment', filters.sentiment);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DbReview[];
  },

  async getWithDrafts(reviewId: string): Promise<{ review: DbReview; drafts: DbReplyDraft[] }> {
    const { data: review, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (revErr || !review) throw revErr || new Error('Review not found');

    const { data: drafts, error: draftErr } = await supabase
      .from('reply_drafts')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: false });

    if (draftErr) throw draftErr;

    return { review: review as DbReview, drafts: (drafts || []) as DbReplyDraft[] };
  },

  async updateStatus(reviewId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({ status } as Record<string, unknown>)
      .eq('id', reviewId);

    if (error) throw error;
  },

  async isFollowUp(branchId: string, reviewerGoogleId: string | null): Promise<boolean> {
    if (!reviewerGoogleId) return false;

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('branch_id', branchId)
      .eq('reviewer_google_id', reviewerGoogleId)
      .in('status', ['replied', 'auto_replied'])
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  },
};

// Tracks in-flight draft creation requests by review_id within the same
// browser session. Prevents duplicate drafts from double-clicks or rapid
// retries while a request is still in flight.
const _pendingDraftCreations = new Set<string>();

export const replyDraftsService = {
  async list(organizationId: string, status?: string): Promise<DbReplyDraft[]> {
    let query = supabase
      .from('reply_drafts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DbReplyDraft[];
  },

  async create(draft: {
    review_id: string;
    organization_id: string;
    ai_reply?: string;
    edited_reply?: string;
    source: string;
  }): Promise<DbReplyDraft> {
    if (_pendingDraftCreations.has(draft.review_id)) {
      throw new Error('Draft creation already in progress for this review');
    }
    _pendingDraftCreations.add(draft.review_id);
    try {
      const { data, error } = await supabase
        .from('reply_drafts')
        .insert({
          review_id: draft.review_id,
          organization_id: draft.organization_id,
          ai_reply: draft.ai_reply ?? null,
          edited_reply: draft.edited_reply ?? null,
          source: draft.source,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as DbReplyDraft;
    } finally {
      _pendingDraftCreations.delete(draft.review_id);
    }
  },

  async approve(draftId: string, userId: string, finalReply: string): Promise<void> {
    // Fetch draft context for audit before updating
    const { data: draftData } = await supabase
      .from('reply_drafts')
      .select('review_id, organization_id, ai_reply, source')
      .eq('id', draftId)
      .single();
    const ctx = draftData as { review_id: string; organization_id: string; ai_reply: string | null; source: string } | null;

    const { error } = await supabase
      .from('reply_drafts')
      .update({
        status: 'sent',
        final_reply: finalReply,
        approved_by: userId,
        sent_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', draftId);

    if (error) throw error;

    if (ctx) {
      const wasEdited = ctx.ai_reply !== null && finalReply !== ctx.ai_reply;
      auditLog.track({
        event: 'draft_approved',
        organization_id: ctx.organization_id,
        entity_id: draftId,
        entity_type: 'draft',
        user_id: userId,
        actor_type: 'user',
        details: {
          draft_id: draftId,
          review_id: ctx.review_id,
          source: ctx.source,
          ...(wasEdited ? { message: 'Reply was edited before approval' } : {}),
        },
      });
    }
  },

  async reject(draftId: string, userId?: string): Promise<void> {
    const { data: draftData } = await supabase
      .from('reply_drafts')
      .select('review_id, organization_id, source')
      .eq('id', draftId)
      .single();
    const ctx = draftData as { review_id: string; organization_id: string; source: string } | null;

    const { error } = await supabase
      .from('reply_drafts')
      .update({ status: 'rejected' } as Record<string, unknown>)
      .eq('id', draftId);

    if (error) throw error;

    if (ctx) {
      auditLog.track({
        event: 'draft_rejected',
        organization_id: ctx.organization_id,
        entity_id: draftId,
        entity_type: 'draft',
        user_id: userId,
        actor_type: 'user',
        details: { draft_id: draftId, review_id: ctx.review_id, source: ctx.source },
      });
    }
  },

  async defer(draftId: string, userId?: string): Promise<void> {
    const { data: draftData } = await supabase
      .from('reply_drafts')
      .select('review_id, organization_id, source')
      .eq('id', draftId)
      .single();
    const ctx = draftData as { review_id: string; organization_id: string; source: string } | null;

    const { error } = await supabase
      .from('reply_drafts')
      .update({ status: 'deferred' } as Record<string, unknown>)
      .eq('id', draftId);

    if (error) throw error;

    if (ctx) {
      auditLog.track({
        event: 'draft_deferred',
        organization_id: ctx.organization_id,
        entity_id: draftId,
        entity_type: 'draft',
        user_id: userId,
        actor_type: 'user',
        details: { draft_id: draftId, review_id: ctx.review_id, source: ctx.source },
      });
    }
  },
};
