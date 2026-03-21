import { supabase } from '@/lib/supabase';
import type { DbSubscription } from '@/types/subscription';
import { TRIAL_LIMITS } from '@/types/subscription';
import { trialEmailService } from '@/services/trial-email';

export const usageService = {
  /**
   * Check if AI reply can be generated. If yes, increments counter.
   * Returns { allowed: true } or { allowed: false, reason: string }.
   */
  async checkAndIncrementAiReply(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Try RPC first (atomic, race-safe)
      const { data, error } = await supabase.rpc('increment_ai_reply', { org_id: organizationId });
      if (!error && data === true) return { allowed: true };
      if (!error && data === false) {
        return { allowed: false, reason: 'AI reply limit reached' };
      }
      // Fallback: manual check
      return await this.manualCheckAi(organizationId);
    } catch {
      return await this.manualCheckAi(organizationId);
    }
  },

  /**
   * Fallback manual AI check when RPC is unavailable.
   */
  async manualCheckAi(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return { allowed: false, reason: 'No subscription found' };
    const sub = data as DbSubscription;

    // Check trial expiry
    if (sub.status === 'trial' && sub.ends_at && new Date(sub.ends_at) < new Date()) {
      await supabase.from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', sub.id);
      // Send trial expiration email
      trialEmailService.sendTrialExpirationEmail(sub.organization_id).catch(() => {});
      return { allowed: false, reason: 'Trial expired' };
    }

    if (sub.status === 'expired' || sub.status === 'cancelled') {
      return { allowed: false, reason: 'Subscription expired' };
    }

    if (sub.status === 'trial' && sub.ai_replies_used >= TRIAL_LIMITS.maxAiReplies) {
      return { allowed: false, reason: `AI reply limit reached (${TRIAL_LIMITS.maxAiReplies} max during trial)` };
    }

    // Increment
    await supabase.from('subscriptions')
      .update({ ai_replies_used: sub.ai_replies_used + 1, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', sub.id);

    return { allowed: true };
  },

  /**
   * Check if template reply can be used. If yes, increments counter.
   */
  async checkAndIncrementTemplateReply(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data, error } = await supabase.rpc('increment_template_reply', { org_id: organizationId });
      if (!error && data === true) return { allowed: true };
      if (!error && data === false) {
        return { allowed: false, reason: 'Template reply limit reached' };
      }
      return await this.manualCheckTemplate(organizationId);
    } catch {
      return await this.manualCheckTemplate(organizationId);
    }
  },

  async manualCheckTemplate(organizationId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return { allowed: false, reason: 'No subscription found' };
    const sub = data as DbSubscription;

    if (sub.status === 'trial' && sub.ends_at && new Date(sub.ends_at) < new Date()) {
      await supabase.from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq('id', sub.id);
      return { allowed: false, reason: 'Trial expired' };
    }

    if (sub.status === 'expired' || sub.status === 'cancelled') {
      return { allowed: false, reason: 'Subscription expired' };
    }

    if (sub.status === 'trial' && sub.template_replies_used >= TRIAL_LIMITS.maxTemplateReplies) {
      return { allowed: false, reason: `Template limit reached (${TRIAL_LIMITS.maxTemplateReplies} max during trial)` };
    }

    await supabase.from('subscriptions')
      .update({ template_replies_used: sub.template_replies_used + 1, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', sub.id);

    return { allowed: true };
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
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return { isTrial: false, isExpired: false, hoursRemaining: 0, aiUsed: 0, aiMax: 0, templateUsed: 0, templateMax: 0 };
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
