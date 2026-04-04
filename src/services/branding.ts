// ============================================================================
// SENDA — Public Branding Service
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
  platform_name_ar: 'سيندا',
  platform_name_en: 'SENDA',
  tagline: 'إدارة تقييمات Google بالذكاء الاصطناعي',
  logo_icon_url: '',
  logo_full_url: '',
};

let _cache: BrandingConfig | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getBranding(): Promise<BrandingConfig> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return _cache;
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'branding')
      .maybeSingle();
    if (data?.value) {
      _cache = { ...DEFAULT_BRANDING, ...(data.value as Partial<BrandingConfig>) };
      _cacheTime = Date.now();
      return _cache;
    }
  } catch { /* use defaults */ }
  return DEFAULT_BRANDING;
}

/** Force cache invalidation (call after branding update) */
export function invalidateBrandingCache(): void {
  _cache = null;
  _cacheTime = 0;
}
