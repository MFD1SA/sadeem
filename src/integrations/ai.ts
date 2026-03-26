import { supabase } from '@/lib/supabase';
import type { DbReview } from '@/types/database';
import { notificationService } from '@/services/notifications';

export interface AIReplyRequest {
  reviewText: string;
  reviewerName: string;
  rating: number;
  branchName: string;
  organizationName: string;
  language: 'ar' | 'en';
  tone?: 'professional' | 'friendly' | 'luxury';
}

export interface AIReplyResponse {
  reply: string;
  sentiment: string;
  category: 'positive' | 'complaint' | 'suggestion' | 'sarcasm' | 'neutral';
  decision: 'auto' | 'ai' | 'manual';
  isAbusive: boolean;
  model: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

function buildPrompt(req: AIReplyRequest): string {
  // Language + dialect
  let langInstruction = '';
  if (req.language === 'ar') {
    langInstruction = 'Arabic (Saudi Arabian dialect — اللهجة السعودية الفصيحة، مع مراعاة الثقافة السعودية)';
  } else {
    langInstruction = 'English';
  }

  // Star-based tone guidance
  let toneGuide = '';
  if (req.rating >= 4) toneGuide = 'Tone: grateful and warm.';
  else if (req.rating === 3) toneGuide = 'Tone: appreciative, acknowledge feedback, promise improvement.';
  else if (req.rating === 2) toneGuide = 'Tone: apologetic, empathetic, offer to resolve the issue.';
  else toneGuide = 'Tone: deeply apologetic, take responsibility, ask for a chance to make it right.';

  // Brand tone override
  if (req.tone === 'luxury') toneGuide += ' Brand style: premium, elegant, refined language.';
  else if (req.tone === 'friendly') toneGuide += ' Brand style: warm, casual, personable.';
  else toneGuide += ' Brand style: professional and respectful.';

  return `You are a professional review response assistant for "${req.organizationName}" (branch: "${req.branchName}").
A customer named "${req.reviewerName}" left a ${req.rating}-star review:
"""
${req.reviewText || '(no text)'}
"""
Tasks:
1. Classify sentiment: "positive", "neutral", or "negative"
2. Classify category: "positive" | "complaint" | "suggestion" | "sarcasm" | "neutral"
3. Decide action:
   - If 5★/4★ AND positive text → "auto" (template reply)
   - If 5★/4★ BUT complaint/sarcasm in text → "manual" (text overrides rating)
   - If 3★ → "ai" (AI-generated reply)
   - If 2★ → "ai" (apology tone)
   - If 1★ → "manual" (never auto-reply)
4. Detect if abusive/spam: true/false
5. Write a professional reply in ${langInstruction}
${toneGuide}
Rules: Keep short (2-3 sentences), NO emojis, NO @ symbols, NO hashtags.
Use customer first name only if it is a clear real name.
IMPORTANT: Text analysis OVERRIDES star rating. A 5-star review with complaint text should be "manual".
Respond ONLY with JSON: {"sentiment":"...","category":"...","decision":"...","isAbusive":false,"reply":"..."}`;
}

export const aiService = {
  // Always true — key lives server-side in the edge function
  isConfigured(): boolean {
    return true;
  },

  async generateReply(request: AIReplyRequest): Promise<AIReplyResponse> {
    const model = 'gemini-2.0-flash-lite';
    const prompt = buildPrompt(request);

    // Call via Edge Function (GEMINI_API_KEY is a server-side secret)
    const { data, error } = await supabase.functions.invoke('generate-reply', {
      body: { prompt, temperature: 0.6, maxOutputTokens: 400 },
    });

    if (error) throw new Error(error.message || 'AI service error');
    if (data?.error) throw new Error(data.error);
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const inputTokens: number = data?.usageMetadata?.promptTokenCount || 0;
    const outputTokens: number = data?.usageMetadata?.candidatesTokenCount || 0;
    const tokensUsed: number = data?.usageMetadata?.totalTokenCount || 0;
    const durationMs: number = data?.durationMs || 0;

    let parsed: { sentiment?: string; category?: string; decision?: string; isAbusive?: boolean; reply?: string };
    try {
      parsed = JSON.parse(rawText.replace(/```json\n?|```\n?/g, '').trim());
    } catch {
      parsed = { sentiment: 'neutral', category: 'neutral', decision: 'ai', isAbusive: false, reply: rawText };
    }

    let reply = (parsed.reply || '').trim();
    reply = reply.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    reply = reply.replace(/@/g, '');

    // Validate category and decision
    const validCategories = ['positive', 'complaint', 'suggestion', 'sarcasm', 'neutral'];
    const validDecisions = ['auto', 'ai', 'manual'];
    const category = validCategories.includes(parsed.category || '') ? parsed.category as AIReplyResponse['category'] : 'neutral';
    const decision = validDecisions.includes(parsed.decision || '') ? parsed.decision as AIReplyResponse['decision'] : 'ai';

    return {
      reply,
      sentiment: parsed.sentiment || 'neutral',
      category,
      decision,
      isAbusive: !!parsed.isAbusive,
      model,
      tokensUsed,
      inputTokens,
      outputTokens,
      durationMs,
    };
  },

  async processNewReview(reviewId: string, organizationName: string, branchName: string, language: 'ar' | 'en' = 'ar', tone: 'professional' | 'friendly' | 'luxury' = 'professional'): Promise<void> {
    const { data: reviewData, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (revErr || !reviewData) throw revErr || new Error('Review not found');
    const rev = reviewData as DbReview;

    if (rev.is_followup || rev.status === 'manual_review_required') return;

    // ── Check monthly AI limit before calling API ──
    try {
      const { data: limitCheck } = await supabase.rpc('check_ai_monthly_limit', {
        p_org_id: rev.organization_id,
      });
      const check = limitCheck as { allowed: boolean; reason?: string } | null;
      if (check && !check.allowed) {
        // Log as limit_exceeded
        try {
          await supabase.rpc('log_ai_usage', {
            p_org_id: rev.organization_id,
            p_branch_id: rev.branch_id,
            p_review_id: reviewId,
            p_status: 'limit_exceeded',
            p_error_message: check.reason || 'Monthly limit reached',
          });
        } catch { /* best-effort logging */ }
        // Mark review for manual handling
        await supabase.from('reviews').update({
          status: 'manual_review_required',
        } as Record<string, unknown>).eq('id', reviewId);
        return;
      }
    } catch {
      // If limit check fails, proceed anyway (fail-open for AI, fail-closed in billing)
    }

    // ── Call AI ──
    let aiResult: AIReplyResponse;
    try {
      aiResult = await this.generateReply({
        reviewText: rev.review_text || '',
        reviewerName: rev.reviewer_name,
        rating: rev.rating,
        branchName,
        organizationName,
        language,
        tone,
      });
    } catch (aiErr) {
      // Log error
      try {
        await supabase.rpc('log_ai_usage', {
          p_org_id: rev.organization_id,
          p_branch_id: rev.branch_id,
          p_review_id: reviewId,
          p_status: 'error',
          p_error_message: aiErr instanceof Error ? aiErr.message : 'Unknown AI error',
        });
      } catch { /* best-effort logging */ }
      throw aiErr;
    }

    // ── Log successful usage ──
    try {
      await supabase.rpc('log_ai_usage', {
        p_org_id: rev.organization_id,
        p_branch_id: rev.branch_id,
        p_review_id: reviewId,
        p_model: aiResult.model,
        p_input_tokens: aiResult.inputTokens,
        p_output_tokens: aiResult.outputTokens,
        p_total_tokens: aiResult.tokensUsed,
        p_status: 'success',
        p_duration_ms: aiResult.durationMs,
      });
    } catch { /* best-effort logging */ }

    // Store sentiment and category
    await supabase.from('reviews').update({
      sentiment: aiResult.sentiment,
    } as Record<string, unknown>).eq('id', reviewId);

    // Abusive → manual review, draft rejected
    if (aiResult.isAbusive) {
      await supabase.from('reviews').update({ status: 'manual_review_required' } as Record<string, unknown>).eq('id', reviewId);
      await supabase.from('reply_drafts').insert({
        review_id: reviewId, organization_id: rev.organization_id,
        ai_reply: aiResult.reply, source: 'ai', status: 'rejected',
      });
      return;
    }

    // Decision-based routing (text overrides stars)
    if (aiResult.decision === 'manual' || rev.rating === 1) {
      // 1★ or complaint/sarcasm in high-star → manual review required
      await supabase.from('reviews').update({ status: 'manual_review_required' } as Record<string, unknown>).eq('id', reviewId);
      await supabase.from('reply_drafts').insert({
        review_id: reviewId, organization_id: rev.organization_id,
        ai_reply: aiResult.reply, source: 'ai', status: 'pending',
      });
      // Trigger notification for critical reviews
      if (rev.rating <= 2) {
        notificationService.notifyCriticalReview(rev.organization_id, rev.reviewer_name, rev.rating, reviewId).catch(() => {});
      }
      if (aiResult.category === 'complaint' || aiResult.category === 'sarcasm') {
        notificationService.notifyComplaint(rev.organization_id, rev.reviewer_name, reviewId).catch(() => {});
      }
      return;
    }

    if (aiResult.decision === 'auto') {
      // 4-5★ positive → template auto-reply (pending approval)
      await supabase.from('reply_drafts').insert({
        review_id: reviewId, organization_id: rev.organization_id,
        ai_reply: aiResult.reply, source: 'template', status: 'pending',
      });
      await supabase.from('reviews').update({ status: 'pending_reply' } as Record<string, unknown>).eq('id', reviewId);
      return;
    }

    // Default: AI reply (3★, 2★ or unclassified)
    await supabase.from('reply_drafts').insert({
      review_id: reviewId, organization_id: rev.organization_id,
      ai_reply: aiResult.reply, source: 'ai', status: 'pending',
    });
    await supabase.from('reviews').update({ status: 'pending_reply' } as Record<string, unknown>).eq('id', reviewId);
  },
};
