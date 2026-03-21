import { supabase } from '@/lib/supabase';
import type { DbQrConfig } from '@/types/qr';

function generateSlug(branchName: string): string {
  const base = branchName
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 30);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`;
}

export const qrService = {
  async listByOrganization(organizationId: string): Promise<DbQrConfig[]> {
    const { data, error } = await supabase
      .from('qr_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DbQrConfig[];
  },

  async getByBranchId(branchId: string): Promise<DbQrConfig | null> {
    const { data, error } = await supabase
      .from('qr_configs')
      .select('*')
      .eq('branch_id', branchId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as DbQrConfig) || null;
  },

  async getBySlug(slug: string): Promise<DbQrConfig | null> {
    const { data, error } = await supabase
      .from('qr_configs')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as DbQrConfig) || null;
  },

  async create(input: {
    branch_id: string;
    organization_id: string;
    mode: 'direct' | 'landing';
    google_review_url?: string;
    branchName: string;
    show_employee_field?: boolean;
    custom_message?: string;
  }): Promise<DbQrConfig> {
    const slug = generateSlug(input.branchName);
    const { data, error } = await supabase
      .from('qr_configs')
      .insert({
        branch_id: input.branch_id,
        organization_id: input.organization_id,
        mode: input.mode,
        google_review_url: input.google_review_url || null,
        slug,
        show_employee_field: input.show_employee_field ?? true,
        custom_message: input.custom_message || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbQrConfig;
  },

  async update(id: string, updates: Partial<Pick<DbQrConfig, 'mode' | 'google_review_url' | 'show_employee_field' | 'custom_message'>>): Promise<DbQrConfig> {
    const { data, error } = await supabase
      .from('qr_configs')
      .update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DbQrConfig;
  },

  async regenerateSlug(id: string, branchName: string): Promise<DbQrConfig> {
    const newSlug = generateSlug(branchName);
    const { data, error } = await supabase
      .from('qr_configs')
      .update({ slug: newSlug, updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as DbQrConfig;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('qr_configs').delete().eq('id', id);
    if (error) throw error;
  },

  // ─── Analytics ───

  async trackEvent(qrConfigId: string, eventType: 'scan' | 'click' | 'employee_submit', employeeName?: string): Promise<void> {
    await supabase.from('qr_scans').insert({
      qr_config_id: qrConfigId,
      event_type: eventType,
      employee_name: employeeName || null,
      user_agent: navigator.userAgent || null,
    });
    // Also increment counters on qr_configs
    if (eventType === 'scan') {
      const { error: rpcErr } = await supabase.rpc('increment_qr_scan_count', { config_id: qrConfigId });
      if (rpcErr) {
        // Fallback: manual increment if RPC doesn't exist
        const { data } = await supabase.from('qr_configs').select('scan_count').eq('id', qrConfigId).single();
        if (data) {
          await supabase.from('qr_configs').update({ scan_count: ((data as { scan_count: number }).scan_count || 0) + 1 } as Record<string, unknown>).eq('id', qrConfigId);
        }
      }
    } else if (eventType === 'click') {
      const { error: rpcErr } = await supabase.rpc('increment_qr_click_count', { config_id: qrConfigId });
      if (rpcErr) {
        const { data } = await supabase.from('qr_configs').select('click_count').eq('id', qrConfigId).single();
        if (data) {
          await supabase.from('qr_configs').update({ click_count: ((data as { click_count: number }).click_count || 0) + 1 } as Record<string, unknown>).eq('id', qrConfigId);
        }
      }
    }
  },

  // ─── URL Helpers ───

  getLandingUrl(slug: string): string {
    return `${window.location.origin}/r/${slug}`;
  },

  getQrUrl(config: DbQrConfig): string {
    if (config.mode === 'direct' && config.google_review_url) {
      return config.google_review_url;
    }
    return this.getLandingUrl(config.slug);
  },
};
