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
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('[Sadeem] Subscription load error:', error.message);
      return null;
    }
    return (data as DbSubscription) || null;
  },

  async updatePlan(subscriptionId: string, plan: string): Promise<DbSubscription> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ plan, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data as DbSubscription;
  },
};
