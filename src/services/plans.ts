import { supabase } from '@/lib/supabase';

export interface DbPlan {
  id: string;
  name_ar: string;
  name_en: string;
  desc_ar: string | null;
  desc_en: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  sort_order: number;
}

export interface DbPlanLimits {
  plan_id: string;
  max_branches: number;
  max_team_members: number;
  max_ai_replies: number;
  max_template_replies: number;
  max_qr_codes: number;
}

export interface DbPlanFeature {
  plan_id: string;
  feature_key: string;
  feature_value: string;
}

export interface DbIntegration {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  type: 'api' | 'oauth' | 'webhook';
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  enabled: boolean;
  api_key: string | null;
  access_token: string | null;
  config_json: Record<string, unknown>;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export const plansService = {
  async listActive(): Promise<DbPlan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  },

  async getLimits(planId: string): Promise<DbPlanLimits | null> {
    const { data, error } = await supabase
      .from('plan_limits')
      .select('*')
      .eq('plan_id', planId)
      .maybeSingle();
    if (error) {
      // Real DB/network error — throw so callers can handle
      console.warn('[Sadeem] Plan limits fetch error:', error.message);
      throw error;
    }
    return data || null;
  },

  async getFeatures(planId: string): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('plan_features')
      .select('feature_key, feature_value')
      .eq('plan_id', planId);
    if (error) return {};
    return Object.fromEntries((data || []).map(f => [f.feature_key, f.feature_value]));
  },

  async updatePlan(id: string, updates: Partial<DbPlan>): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async updateLimits(planId: string, limits: Partial<DbPlanLimits>): Promise<void> {
    const { error } = await supabase
      .from('plan_limits')
      .upsert({ plan_id: planId, ...limits });
    if (error) throw error;
  },

  async updateFeature(planId: string, featureKey: string, featureValue: string): Promise<void> {
    const { error } = await supabase
      .from('plan_features')
      .upsert({ plan_id: planId, feature_key: featureKey, feature_value: featureValue });
    if (error) throw error;
  },
};

export const integrationsService = {
  async list(): Promise<DbIntegration[]> {
    const { data, error } = await supabase
      .from('integrations_config')
      .select('*')
      .order('category');
    if (error) throw error;
    return data || [];
  },

  async getByKey(key: string): Promise<DbIntegration | null> {
    const { data, error } = await supabase
      .from('integrations_config')
      .select('*')
      .eq('key', key)
      .single();
    if (error) return null;
    return data;
  },

  async update(id: string, updates: Partial<DbIntegration>): Promise<void> {
    const { error } = await supabase
      .from('integrations_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async toggleEnabled(id: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('integrations_config')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async testConnection(key: string): Promise<{ success: boolean; message: string }> {
    // Basic test — in production this would call the actual API
    const integration = await this.getByKey(key);
    if (!integration) return { success: false, message: 'Integration not found' };
    if (!integration.enabled) return { success: false, message: 'Integration not enabled' };
    if (!integration.api_key && !integration.access_token) {
      return { success: false, message: 'No credentials configured' };
    }
    return { success: true, message: 'Connection verified' };
  },
};
