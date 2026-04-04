import { supabase } from '@/lib/supabase';
import { googleBusinessService } from '@/integrations/google-business';
import { aiService } from '@/integrations/ai';
import { usageService } from '@/services/usage';
import { auditLog } from '@/services/audit';
import { getPlanLimits } from '@/types/subscription';
import type { PlanId } from '@/types/subscription';
import { findStrongTemplateMatch } from '@/services/smart-template';

interface DraftRow { id: string; review_id: string; ai_reply: string | null; edited_reply: string | null; final_reply: string | null; }
interface ReviewRow { id: string; branch_id: string; is_followup: boolean; status: string; google_review_id: string | null; review_text?: string | null; rating?: number; }
interface BranchRow { id: string; internal_name: string; }
interface OrgRow { name: string; }

/**
 * Detect review language from text content.
 * Uses Arabic Unicode character ratio as a simple heuristic.
 */
function detectReviewLanguage(text: string | null | undefined): 'ar' | 'en' {
  if (!text || text.trim().length === 0) return 'ar'; // default to Arabic
  // Count Arabic script characters (U+0600–U+06FF, U+0750–U+077F, U+08A0–U+08FF, U+FB50–U+FDFF, U+FE70–U+FEFF)
  const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  // If more Arabic than Latin characters, treat as Arabic
  return arabicChars >= latinChars ? 'ar' : 'en';
}

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
        auditLog.track({
          event: 'sync_completed',
          organization_id: organizationId,
          actor_type: 'system',
          details: { reviews_count: reviewsSynced, message: `${reviewsSynced} reviews synced` },
        });
      }
    } catch (err: unknown) {
      errors.push(`Sync error: ${(err as Error).message}`);
      auditLog.track({
        event: 'sync_failed',
        organization_id: organizationId,
        actor_type: 'system',
        details: { error: (err as Error).message },
      });
      return { reviewsSynced, draftsGenerated, errors };
    }

    const { data: orgData, error: orgErr } = await supabase
      .from('organizations')
      .select('name, created_at, industry, smart_template_mode')
      .eq('id', organizationId)
      .single();

    if (orgErr || !orgData) {
      errors.push('Organization not found');
      return { reviewsSynced, draftsGenerated, errors };
    }

    const org = orgData as OrgRow & { created_at?: string; industry?: string | null; smart_template_mode?: boolean };

    // Fetch org plan for emoji support level
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();
    const orgPlan = (subData as { plan: string } | null)?.plan as PlanId | undefined;
    const planLimits = getPlanLimits(orgPlan || 'orbit');
    const emojiSupport = planLimits.emojiSupport;

    // Fetch org creation date to identify old reviews
    const orgCreatedAt = org.created_at || new Date().toISOString();

    const { data: newReviewsData } = await supabase
      .from('reviews')
      .select('id, branch_id, is_followup, status, published_at, review_text, rating')
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

    const smartMode = !!org.smart_template_mode;

    if (aiService.isConfigured()) {
      for (let ri = 0; ri < newReviews.length; ri++) {
        const review = newReviews[ri];
        const reviewLang = detectReviewLanguage(review.review_text);
        const reviewRating = review.rating || 0;

        // ── Smart Template Mode: try template-first if enabled ──
        if (smartMode && reviewRating >= 2) {
          try {
            const match = await findStrongTemplateMatch(
              organizationId, reviewRating, review.review_text, reviewLang, org.industry ?? null,
            );
            if (match.matched && match.template) {
              // Check template reply quota (NOT AI quota)
              const tplUsage = await usageService.checkAndIncrementTemplateReply(organizationId);
              if (!tplUsage.allowed) {
                // Template quota exhausted — fall through to AI path below
              } else {
                // Strong match found — create draft from template, skip AI
                await supabase.from('reply_drafts').insert({
                  review_id: review.id,
                  organization_id: organizationId,
                  ai_reply: match.template.body,
                  source: 'template',
                  status: 'pending',
                });
                await supabase.from('reviews').update({
                  status: 'pending_reply',
                } as Record<string, unknown>).eq('id', review.id);
                draftsGenerated++;
                auditLog.track({
                  event: 'template_matched',
                  organization_id: organizationId,
                  entity_id: review.id,
                  entity_type: 'review',
                  actor_type: 'system',
                  details: { message: match.reason, source: 'template', review_id: review.id },
                });
                continue; // Skip AI for this review
              }
            }
            // No match — fall through to AI
          } catch {
            // Template matching error — fall through to AI silently
          }
        }

        // ── AI path (default, or Smart Template Mode fallback) ──
        const usageCheck = await usageService.checkAndIncrementAiReply(organizationId);
        if (!usageCheck.allowed) {
          errors.push(usageCheck.reason || 'AI reply limit reached — upgrade to continue');
          break;
        }

        try {
          await aiService.processNewReview(review.id, org.name, branchMap[review.branch_id] || '', reviewLang, 'professional', emojiSupport);
          draftsGenerated++;
        } catch (err: unknown) {
          errors.push(`AI error for review ${review.id}: ${(err as Error).message}`);
        }

        // Rate limiting: 2 second delay between AI calls to avoid quota issues
        if (ri < newReviews.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } else {
      errors.push('Gemini API not configured — skipping AI reply generation');
    }

    // Auto-send drafts that have been pending for 24+ hours.
    // This runs here because autoSendPendingDrafts needs a Google access
    // token from the user's session — it cannot run in a server-side cron.
    try {
      const autoSent = await this.autoSendPendingDrafts(organizationId);
      if (autoSent > 0) {
        auditLog.track({
          event: 'reply_auto_sent',
          organization_id: organizationId,
          actor_type: 'auto',
          details: { reviews_count: autoSent, message: `${autoSent} drafts auto-sent after 24h` },
        });
      }
    } catch (err: unknown) {
      errors.push(`Auto-send error: ${(err as Error).message}`);
    }

    return { reviewsSynced, draftsGenerated, errors };
  },

  async sendReplyToGoogle(draftId: string, userId: string): Promise<void> {
    const { data: draftData, error: dErr } = await supabase
      .from('reply_drafts')
      .select('id, review_id, ai_reply, edited_reply, final_reply, source, organization_id')
      .eq('id', draftId)
      .single();

    if (dErr || !draftData) throw dErr || new Error('Draft not found');
    const draft = draftData as DraftRow & { source?: string; organization_id?: string };

    const finalReply = draft.final_reply || draft.edited_reply || draft.ai_reply;
    if (!finalReply) throw new Error('No reply text to send');

    const orgId = draft.organization_id || '';

    const { data: reviewData, error: revErr } = await supabase
      .from('reviews')
      .select('id, google_review_id')
      .eq('id', draft.review_id)
      .single();

    if (revErr && revErr.code !== 'PGRST116') console.warn('[Sadeem] sendReplyToGoogle review lookup failed:', revErr.message);
    const review = reviewData as ReviewRow | null;

    // Post to Google FIRST — if it fails, DB stays unchanged so user can retry
    if (review?.google_review_id) {
      try {
        await googleBusinessService.sendReplyToGoogle(review.id, finalReply);
      } catch (err) {
        // Audit the failure with full context
        auditLog.trackNow({
          event: 'reply_send_failed',
          organization_id: orgId,
          entity_id: draftId,
          entity_type: 'draft',
          user_id: userId,
          actor_type: 'user',
          details: {
            error: err instanceof Error ? err.message : 'Unknown error',
            draft_id: draftId,
            review_id: draft.review_id,
            source: draft.source,
          },
        });
        throw err; // re-throw so caller can handle
      }
    }

    // Google succeeded (or no google_review_id) — now commit to DB
    await supabase
      .from('reply_drafts')
      .update({ status: 'sent', final_reply: finalReply, approved_by: userId, sent_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', draftId);

    await supabase
      .from('reviews')
      .update({ status: 'replied' } as Record<string, unknown>)
      .eq('id', draft.review_id);

    // Audit the successful send
    auditLog.trackNow({
      event: 'reply_sent_google',
      organization_id: orgId,
      entity_id: draftId,
      entity_type: 'draft',
      user_id: userId,
      actor_type: 'user',
      details: {
        draft_id: draftId,
        review_id: draft.review_id,
        source: draft.source,
      },
    });
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
      const { data: reviewData, error: revErr } = await supabase
        .from('reviews')
        .select('id, is_followup, status, google_review_id')
        .eq('id', draft.review_id)
        .single();

      if (revErr && revErr.code !== 'PGRST116') console.warn('[Sadeem] autoSend review lookup failed:', revErr.message);
      const review = reviewData as ReviewRow | null;
      if (!review) continue;
      if (review.is_followup) continue;
      if (review.status === 'manual_review_required') continue;

      const finalReply = draft.ai_reply;
      if (!finalReply) continue;

      // Check template reply quota before auto-sending
      const usageCheck = await usageService.checkAndIncrementTemplateReply(organizationId);
      if (!usageCheck.allowed) {
        auditLog.track({
          event: 'template_quota_exhausted',
          organization_id: organizationId,
          entity_id: draft.id,
          entity_type: 'draft',
          actor_type: 'auto',
          details: { error: usageCheck.reason || 'Reply limit reached', draft_id: draft.id },
        });
        break; // Stop auto-sending — quota exhausted
      }

      // Post to Google first — only mark as sent if Google succeeds (or no google_review_id)
      if (review.google_review_id) {
        try {
          await googleBusinessService.sendReplyToGoogle(review.id, finalReply);
        } catch (err: unknown) {
          // Skip this draft — don't mark as sent if Google failed
          auditLog.track({
            event: 'reply_send_failed',
            organization_id: organizationId,
            entity_id: draft.id,
            entity_type: 'draft',
            actor_type: 'auto',
            details: { error: (err as Error).message, draft_id: draft.id, review_id: review.id },
          });
          continue;
        }
      }

      await supabase
        .from('reply_drafts')
        .update({ status: 'auto_sent', final_reply: finalReply, sent_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', draft.id);

      await supabase
        .from('reviews')
        .update({ status: 'auto_replied' } as Record<string, unknown>)
        .eq('id', review.id);

      auditLog.track({
        event: 'reply_auto_sent',
        organization_id: organizationId,
        entity_id: draft.id,
        entity_type: 'draft',
        actor_type: 'auto',
        details: { draft_id: draft.id, review_id: review.id },
      });

      autoSent++;
    }

    return autoSent;
  },
};
