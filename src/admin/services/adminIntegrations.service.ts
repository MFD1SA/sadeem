import { adminSupabase } from './adminSupabase';

export interface AdminIntegration {
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

export const adminIntegrationsService = {
  async list(): Promise<AdminIntegration[]> {
    const { data, error } = await adminSupabase
      .from('integrations_config')
      .select('*')
      .order('category')
      .order('name_en');
    if (error) throw error;
    return data || [];
  },

  async toggle(id: string, enabled: boolean): Promise<void> {
    const { error } = await adminSupabase
      .from('integrations_config')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<AdminIntegration>): Promise<void> {
    const { error } = await adminSupabase
      .from('integrations_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async insert(record: Omit<AdminIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await adminSupabase
      .from('integrations_config')
      .insert(record);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await adminSupabase
      .from('integrations_config')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
