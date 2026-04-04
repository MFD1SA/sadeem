import { supabase } from '@/lib/supabase';
import type { DbReplyTemplate } from '@/types/database';
import { DEFAULT_TEMPLATES, type BuiltInTemplate } from '@/services/default-templates';

export interface SmartTemplateMatch {
  matched: boolean;
  template: { name: string; body: string; source: 'custom' | 'builtin' } | null;
  /** Why this template was selected or why no match was found */
  reason: string;
}

/**
 * Category mapping from rating to expected template category.
 * This is the "strong match" rule:
 *   - 4-5★ → only "positive" or "general" templates
 *   - 3★   → only "neutral" or "general" templates
 *   - 1-2★ → only "negative" or "general" templates
 *
 * This prevents a positive template from being used on a complaint.
 */
function getAllowedCategories(rating: number): string[] {
  if (rating >= 4) return ['positive', 'general'];
  if (rating === 3) return ['neutral', 'general'];
  return ['negative', 'general'];
}

/**
 * Attempt to find a strong template match for a review.
 *
 * Strong match criteria (ALL must be true):
 *   1. Rating falls within template's [rating_min, rating_max]
 *   2. Template category aligns with rating sentiment (see getAllowedCategories)
 *   3. Template is active (custom) or exists (builtin)
 *   4. Industry matches if template specifies one (builtin only)
 *
 * Selection priority:
 *   1. Custom org templates (most specific to the business)
 *   2. Built-in templates (generic fallback)
 *
 * Within each group, a random template is selected to provide variety.
 *
 * Reviews that MUST NOT use templates (returns matched: false):
 *   - 1★ reviews (always require manual/AI handling)
 *   - Reviews with no text (can't verify sentiment match)
 */
export async function findStrongTemplateMatch(
  organizationId: string,
  rating: number,
  reviewText: string | null | undefined,
  lang: 'ar' | 'en',
  industry?: string | null,
): Promise<SmartTemplateMatch> {
  // Rule: 1★ reviews are too sensitive for template replies
  if (rating <= 1) {
    return { matched: false, template: null, reason: '1-star reviews require AI or manual handling' };
  }

  // Rule: empty reviews can't be reliably matched
  if (!reviewText || reviewText.trim().length < 3) {
    return { matched: false, template: null, reason: 'Review text too short for template matching' };
  }

  const allowedCategories = getAllowedCategories(rating);

  // ── 1. Try custom org templates first ──
  try {
    const { data: customTemplates } = await supabase
      .from('reply_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('rating_min', rating)
      .gte('rating_max', rating)
      .in('language', [lang, 'any']); // Only templates matching review language or 'any'

    const customs = (customTemplates || []) as DbReplyTemplate[];
    // Filter by allowed category
    const validCustoms = customs.filter(t =>
      allowedCategories.includes(t.category.toLowerCase())
    );

    if (validCustoms.length > 0) {
      // Random selection for variety
      const picked = validCustoms[Math.floor(Math.random() * validCustoms.length)];
      return {
        matched: true,
        template: { name: picked.name, body: picked.body, source: 'custom' },
        reason: `Custom template "${picked.name}" matched (rating ${rating}, category ${picked.category})`,
      };
    }
  } catch (err) {
    // Log the error but fall through to builtins so review still gets a reply
    console.warn('[Senda] Custom template lookup failed:', err instanceof Error ? err.message : err);
  }

  // ── 2. Try built-in templates ──
  const builtinMatches = DEFAULT_TEMPLATES.filter(t => {
    // Rating range check
    if (rating < t.ratingMin || rating > t.ratingMax) return false;
    // Category alignment
    if (!allowedCategories.includes(t.category)) return false;
    // Industry filter: skip industry-specific templates if industry doesn't match
    if (t.industry && industry && t.industry !== industry) return false;
    // If template is industry-specific but org has no industry, skip it
    if (t.industry && !industry) return false;
    return true;
  });

  if (builtinMatches.length > 0) {
    const picked = builtinMatches[Math.floor(Math.random() * builtinMatches.length)];
    const body = lang === 'ar' ? picked.bodyAr : picked.bodyEn;
    const name = lang === 'ar' ? picked.nameAr : picked.nameEn;
    return {
      matched: true,
      template: { name, body, source: 'builtin' },
      reason: `Built-in template "${name}" matched (rating ${rating}, category ${picked.category})`,
    };
  }

  return { matched: false, template: null, reason: `No template matched for rating ${rating} with categories [${allowedCategories.join(', ')}]` };
}
