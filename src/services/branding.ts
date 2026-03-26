// ============================================================================
// SADEEM — Public Branding Service
// Reads branding settings from system_settings (public read RLS on 'branding').
// Used by Login page and any public-facing surface.
// ============================================================================
import { supabase } from '@/lib/supabase';

export interface BrandingConfig {
  platform_name_ar: string;
  platform_name_en: string;
  tagline: string;
  logo_icon_url: string;
  logo_full_url: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  platform_name_ar: 'سديم',
  platform_name_en: 'SADEEM',
  tagline: 'إدارة تقييمات Google بالذكاء الاصطناعي',
  logo_icon_url: '',
  logo_full_url: '',
};

let _cache: BrandingConfig | null = null;

export async function getBranding(): Promise<BrandingConfig> {
  if (_cache) return _cache;
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'branding')
      .maybeSingle();
    if (data?.value) {
      _cache = { ...DEFAULT_BRANDING, ...(data.value as Partial<BrandingConfig>) };
      return _cache;
    }
  } catch { /* use defaults */ }
  return DEFAULT_BRANDING;
}
