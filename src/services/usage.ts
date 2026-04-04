import { supabase } from '@/lib/supabase';
import type { DbSubscription } from '@/types/subscription';
import { TRIAL_LIMITS } from '@/types/subscription';

export const usageService = {
  /**
   * Check if AI reply can be generated. If yes, increments counter atomically.
   * Relies exclusively on the SECURITY DEFINER RPC which performs the read
   * and increment in a single transaction — no TOCTOU race possible.
   * The non-atomic client-side fallback has been removed: if the RPC is
   * unavailable the safe default is to deny the action rather than risk
   * a race condition that under-counts quota usage.
   */
  async checkAndIncrementAiReply(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc('increment_ai_reply', { org_id: organizationId });
    if (error) return { allowed: false, reason: 'Service temporarily unavailable' };
    if (data === true) return { allowed: true };
    return { allowed: false, reason: 'AI reply limit reached' };
  },

  /**
   * Check if template reply can be used. If yes, increments counter atomically.
   */
  async checkAndIncrementTemplateReply(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc('increment_template_reply', { org_id: organizationId });
    if (error) return { allowed: false, reason: 'Service temporarily unavailable' };
    if (data === true) return { allowed: true };
    return { allowed: false, reason: 'Template reply limit reached' };
  },

  /**
   * Get current trial status for display.
   */
  async getTrialStatus(organizationId: string): Promise<{
    isTrial: boolean;
    isExpired: boolean;
    hoursRemaining: number;
    aiUsed: number;
    aiMax: number;
    templateUsed: number;
    templateMax: number;
  }> {
    const { data, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subErr || !data) {
      if (subErr && subErr.code !== 'PGRST116') console.warn('[Sadeem] getTrialStatus failed:', subErr.message);
      return { isTrial: false, isExpired: false, hoursRemaining: 0, aiUsed: 0, aiMax: 0, templateUsed: 0, templateMax: 0 };
    }
    const sub = data as DbSubscription;

    const isTrial = sub.status === 'trial';
    const now = new Date();
    const endsAt = sub.ends_at ? new Date(sub.ends_at) : null;
    const isExpired = sub.status === 'expired' || sub.status === 'cancelled' || (isTrial && endsAt !== null && endsAt < now);
    const hoursRemaining = endsAt ? Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60))) : 0;

    return {
      isTrial,
      isExpired,
      hoursRemaining,
      aiUsed: sub.ai_replies_used,
      aiMax: isTrial ? TRIAL_LIMITS.maxAiReplies : 999999,
      templateUsed: sub.template_replies_used,
      templateMax: isTrial ? TRIAL_LIMITS.maxTemplateReplies : 999999,
    };
  },
};
