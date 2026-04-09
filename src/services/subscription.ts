import { supabase } from '@/lib/supabase';
import type { DbSubscription } from '@/types/subscription';

export const subscriptionService = {
  async getByOrganization(organizationId: string): Promise<DbSubscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Real DB / network error — throw so callers can distinguish from "no subscription"
      throw new Error(`Subscription load failed: ${error.message}`);
    }
    return (data as DbSubscription) || null;
  },

  /**
   * Update the plan for a subscription.
   * Requires organizationId to verify caller ownership (RLS enforces org-owner).
   */
  async updatePlan(subscriptionId: string, plan: string, organizationId: string): Promise<DbSubscription> {
    const VALID_PLANS = ['trial', 'starter', 'growth', 'orbit'];
    if (!VALID_PLANS.includes(plan)) {
      throw new Error(`Invalid plan: ${plan}`);
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', subscriptionId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data as DbSubscription;
  },
};
