import { supabase } from '@/lib/supabase';
import { googleBusinessService } from '@/integrations/google-business';
import { aiService } from '@/integrations/ai';
import { usageService } from '@/services/usage';
import { auditLog } from '@/services/audit';

interface DraftRow { id: string; review_id: string; ai_reply: string | null; edited_reply: string | null; final_reply: string | null; }
interface ReviewRow { id: string; branch_id: string; is_followup: boolean; status: string; google_review_id: string | null; }
interface BranchRow { id: string; internal_name: string; }
interface OrgRow { name: string; }

export const reviewSyncService = {
  async syncAndProcess(organizationId: string): Promise<{
    reviewsSynced: number;
    draftsGenerated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let reviewsSynced = 0;
    let draftsGenerated = 0;

    try {
      const syncResult = await googleBusinessService.syncAllReviews(organizationId);
      reviewsSynced = syncResult.synced;
      if (reviewsSynced > 0) {
        auditLog.track({ event: 'review_synced', organization_id: organizationId, details: `${reviewsSynced} reviews synced` });
      }
    } catch (err: unknown) {
      errors.push(`Sync error: ${(err as Error).message}`);
      auditLog.track({ event: 'ai_reply_failed', organization_id: organizationId, details: `Sync error: ${(err as Error).message}` });
      return { reviewsSynced, draftsGenerated, errors };
    }

    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, created_at')
      .eq('id', organizationId)
      .single();

    const org = orgData as OrgRow | null;
    if (!org) {
      errors.push('Organization not found');
      return { reviewsSynced, draftsGenerated, errors };
    }

    // Fetch org creation date to identify old reviews
    const orgCreatedAt = (orgData as { created_at?: string })?.created_at || new Date().toISOString();

    const { data: newReviewsData } = await supabase
      .from('reviews')
      .select('id, branch_id, is_followup, status, published_at')
      .eq('organization_id', organizationId)
      .eq('status', 'new')
      .eq('is_followup', false);

    const allNewReviews = (newReviewsData || []) as (ReviewRow & { published_at?: string })[];
    if (allNewReviews.length === 0) {
      return { reviewsSynced, draftsGenerated, errors };
    }

    // Separate: recent reviews get AI, old reviews get template-only status
    const orgDate = new Date(orgCreatedAt);
    const recentReviews: ReviewRow[] = [];
    for (const r of allNewReviews) {
      if (r.published_at && new Date(r.published_at) < orgDate) {
        // Old review — mark as template_only, no AI
        await supabase.from('reviews')
          .update({ status: 'pending_reply' } as Record<string, unknown>)
          .eq('id', r.id);
      } else {
        recentReviews.push(r);
      }
    }
    const newReviews = recentReviews;

    const branchIds = [...new Set(newReviews.map(r => r.branch_id))];
    const { data: branchesData } = await supabase
      .from('branches')
      .select('id, internal_name')
      .in('id', branchIds);

    const branchMap: Record<string, string> = {};
    ((branchesData || []) as BranchRow[]).forEach(b => { branchMap[b.id] = b.internal_name; });

    if (aiService.isConfigured()) {
      for (const review of newReviews) {
        // Check AI usage limit before calling Gemini
        const usageCheck = await usageService.checkAndIncrementAiReply(organizationId);
        if (!usageCheck.allowed) {
          errors.push(usageCheck.reason || 'AI reply limit reached — upgrade to continue');
          break;
        }

        try {
          await aiService.processNewReview(review.id, org.name, branchMap[review.branch_id] || '', 'ar');
          draftsGenerated++;
        } catch (err: unknown) {
          errors.push(`AI error for review ${review.id}: ${(err as Error).message}`);
        }

        // Rate limiting: 2 second delay between AI calls to avoid quota issues
        if (newReviews.indexOf(review) < newReviews.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } else {
      errors.push('Gemini API not configured — skipping AI reply generation');
    }

    return { reviewsSynced, draftsGenerated, errors };
  },

  async sendReplyToGoogle(draftId: string, userId: string): Promise<void> {
    const { data: draftData, error: dErr } = await supabase
      .from('reply_drafts')
      .select('id, review_id, ai_reply, edited_reply, final_reply')
      .eq('id', draftId)
      .single();

    if (dErr || !draftData) throw dErr || new Error('Draft not found');
    const draft = draftData as DraftRow;

    const finalReply = draft.final_reply || draft.edited_reply || draft.ai_reply;
    if (!finalReply) throw new Error('No reply text to send');

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('id, google_review_id')
      .eq('id', draft.review_id)
      .single();

    const review = reviewData as ReviewRow | null;

    if (review?.google_review_id) {
      try {
        await googleBusinessService.sendReplyToGoogle(review.id, finalReply);
      } catch (err: unknown) {
        console.error('Failed to send to Google:', err);
      }
    }

    await supabase
      .from('reply_drafts')
      .update({ status: 'sent', final_reply: finalReply, approved_by: userId, sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', draftId);

    await supabase
      .from('reviews')
      .update({ status: 'replied' } as Record<string, unknown>)
      .eq('id', draft.review_id);
  },

  async autoSendPendingDrafts(organizationId: string): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: oldDraftsData } = await supabase
      .from('reply_drafts')
      .select('id, review_id, ai_reply')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo);

    const oldDrafts = (oldDraftsData || []) as DraftRow[];
    if (oldDrafts.length === 0) return 0;

    let autoSent = 0;

    for (const draft of oldDrafts) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id, is_followup, status, google_review_id')
        .eq('id', draft.review_id)
        .single();

      const review = reviewData as ReviewRow | null;
      if (!review) continue;
      if (review.is_followup) continue;
      if (review.status === 'manual_review_required') continue;

      const finalReply = draft.ai_reply;
      if (!finalReply) continue;

      await supabase
        .from('reply_drafts')
        .update({ status: 'auto_sent', final_reply: finalReply, sent_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', draft.id);

      await supabase
        .from('reviews')
        .update({ status: 'auto_replied' } as Record<string, unknown>)
        .eq('id', review.id);

      if (review.google_review_id) {
        try {
          await googleBusinessService.sendReplyToGoogle(review.id, finalReply);
        } catch {
          // continue
        }
      }

      autoSent++;
    }

    return autoSent;
  },
};
