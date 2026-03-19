import { supabase } from '@/lib/supabase';
import type { DbReview } from '@/types/database';
import { notificationService } from '@/services/notifications';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface AIReplyRequest {
  reviewText: string;
  reviewerName: string;
  rating: number;
  branchName: string;
  organizationName: string;
  language: 'ar' | 'en';
}

export interface AIReplyResponse {
  reply: string;
  sentiment: string;
  category: 'positive' | 'complaint' | 'suggestion' | 'sarcasm' | 'neutral';
  decision: 'auto' | 'ai' | 'manual';
  isAbusive: boolean;
  model: string;
  tokensUsed: number;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key not configured');
  return key;
}

function buildPrompt(req: AIReplyRequest): string {
  const lang = req.language === 'ar' ? 'Arabic' : 'English';

  // Star-based tone guidance
  let toneGuide = '';
  if (req.rating >= 4) toneGuide = 'Tone: grateful and warm.';
  else if (req.rating === 3) toneGuide = 'Tone: appreciative, acknowledge feedback, promise improvement.';
  else if (req.rating === 2) toneGuide = 'Tone: apologetic, empathetic, offer to resolve the issue.';
  else toneGuide = 'Tone: deeply apologetic, take responsibility, ask for a chance to make it right.';

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
5. Write a professional reply in ${lang}
${toneGuide}
Rules: Keep short (2-3 sentences), professional tone, NO emojis, NO @ symbols, NO hashtags.
Use customer first name only if it is a clear real name.
IMPORTANT: Text analysis OVERRIDES star rating. A 5-star review with complaint text should be "manual".
Respond ONLY with JSON: {"sentiment":"...","category":"...","decision":"...","isAbusive":false,"reply":"..."}`;
}

export const aiService = {
  isConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  },

  async generateReply(request: AIReplyRequest): Promise<AIReplyResponse> {
    const apiKey = getApiKey();
    const model = 'gemini-2.0-flash-lite';
    const prompt = buildPrompt(request);

    const response = await fetch(
      `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = (errBody as { error?: { message?: string } }).error?.message || `Gemini error: ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed: number = data.usageMetadata?.totalTokenCount || 0;

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
    };
  },

  async processNewReview(reviewId: string, organizationName: string, branchName: string, language: 'ar' | 'en' = 'ar'): Promise<void> {
    const { data: reviewData, error: revErr } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (revErr || !reviewData) throw revErr || new Error('Review not found');
    const rev = reviewData as DbReview;

    if (rev.is_followup || rev.status === 'manual_review_required') return;

    const aiResult = await this.generateReply({
      reviewText: rev.review_text || '',
      reviewerName: rev.reviewer_name,
      rating: rev.rating,
      branchName,
      organizationName,
      language,
    });

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
