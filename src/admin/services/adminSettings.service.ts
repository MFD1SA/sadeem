// ============================================================================
// SENDA Admin — Settings Service (DB Persistence)
// ============================================================================

import { adminSupabase } from './adminSupabase';

export interface BrandingSettings {
  platform_name_ar: string;
  platform_name_en: string;
  tagline: string;
  logo_icon_url: string;
  logo_full_url: string;
  favicon_url: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  platform_name_ar: 'سيندا',
  platform_name_en: 'SENDA',
  tagline: 'إدارة التقييمات بالذكاء الاصطناعي',
  logo_icon_url: '',
  logo_full_url: '',
  favicon_url: '',
};

class AdminSettingsService {
  private static instance: AdminSettingsService;
  private cache: Record<string, unknown> = {};

  static getInstance(): AdminSettingsService {
    if (!AdminSettingsService.instance) {
      AdminSettingsService.instance = new AdminSettingsService();
    }
    return AdminSettingsService.instance;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    if (this.cache[key] !== undefined) return this.cache[key] as T;
    try {
      const { data } = await adminSupabase.rpc('admin_get_setting', { p_key: key });
      if (data !== null && data !== undefined) {
        this.cache[key] = data;
        return data as T;
      }
    } catch { /* fallback */ }
    return fallback;
  }

  async set(key: string, value: unknown): Promise<void> {
    const { error } = await adminSupabase.rpc('admin_set_setting', {
      p_key: key,
      p_value: value as Record<string, unknown>,
    });
    if (error) throw new Error('فشل في حفظ الإعداد: ' + error.message);
    this.cache[key] = value;
  }

  async getBranding(): Promise<BrandingSettings> {
    return this.get<BrandingSettings>('branding', DEFAULT_BRANDING);
  }

  async saveBranding(branding: BrandingSettings): Promise<void> {
    await this.set('branding', branding);
  }

  async getAll(): Promise<Record<string, unknown>> {
    try {
      const { data } = await adminSupabase.rpc('admin_get_all_settings');
      return (data as Record<string, unknown>) ?? {};
    } catch { return {}; }
  }

  clearCache() { this.cache = {}; }
}

export const adminSettingsService = AdminSettingsService.getInstance();
