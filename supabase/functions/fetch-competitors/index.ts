// ============================================================================
// SENDA — Smart Competitor Engine (v2)
//
// Proxies Google Places API with intelligent filtering, scoring, and ranking.
// Ensures only RELEVANT competitors appear (no hotels for a falafel shop).
//
// POST /fetch-competitors
// Body: {
//   industry: string,        — Arabic industry from onboarding
//   city: string,            — Arabic city name
//   latitude?: number,       — branch actual location (preferred)
//   longitude?: number,
//   businessName?: string,   — used for keyword extraction fallback
// }
// Returns: SmartCompetitorData[]
// ============================================================================

import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';

interface PlaceResult {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  vicinity?: string;
  place_id?: string;
  types?: string[];
  geometry?: { location?: { lat: number; lng: number } };
  business_status?: string;
  price_level?: number;
}

interface SmartCompetitorData {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  placeId: string;
  distance: number;       // meters from search center
  score: number;           // internal relevance + quality score
  types: string[];         // Google place types (for transparency)
}

// ── City coordinates (GCC) ──────────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'الرياض': { lat: 24.7136, lng: 46.6753 },
  'جدة': { lat: 21.4858, lng: 39.1925 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
  'الدمام': { lat: 26.3927, lng: 49.9777 },
  'الخبر': { lat: 26.2172, lng: 50.1971 },
  'الأحساء': { lat: 25.3648, lng: 49.5888 },
  'الطائف': { lat: 21.2703, lng: 40.4158 },
  'تبوك': { lat: 28.3835, lng: 36.5662 },
  'أبها': { lat: 18.2164, lng: 42.5053 },
  'القصيم': { lat: 26.3292, lng: 43.7710 },
  'حائل': { lat: 27.5114, lng: 41.7208 },
  'الجوف': { lat: 29.7872, lng: 40.0003 },
  'نجران': { lat: 17.4933, lng: 44.1322 },
  'جازان': { lat: 16.8892, lng: 42.5511 },
  'الباحة': { lat: 20.0000, lng: 41.4678 },
  'ينبع': { lat: 24.0895, lng: 38.0618 },
  'الخرج': { lat: 24.1556, lng: 47.3346 },
  'دبي': { lat: 25.2048, lng: 55.2708 },
  'أبوظبي': { lat: 24.4539, lng: 54.3773 },
  'الشارقة': { lat: 25.3463, lng: 55.4209 },
  'عجمان': { lat: 25.4052, lng: 55.5136 },
  'رأس الخيمة': { lat: 25.7895, lng: 55.9432 },
  'الفجيرة': { lat: 25.1288, lng: 56.3265 },
  'العين': { lat: 24.1917, lng: 55.7606 },
  'الكويت': { lat: 29.3759, lng: 47.9774 },
  'الفروانية': { lat: 29.2783, lng: 47.9584 },
  'حولي': { lat: 29.3325, lng: 48.0289 },
  'الدوحة': { lat: 25.2854, lng: 51.5310 },
  'المنامة': { lat: 26.2285, lng: 50.5860 },
  'مسقط': { lat: 23.5880, lng: 58.3829 },
  'صلالة': { lat: 17.0151, lng: 54.0924 },
};

// ── Smart Industry Mapping ──────────────────────────────────────────────────
// Each industry maps to:
//   keyword:       what to search for (sent to Google as keyword param)
//   type:          Google Places type filter
//   allowedTypes:  types that are ACCEPTABLE in results
//   blockedTypes:  types that MUST NOT appear (hard filter)
//   radius:        search radius in meters (industry-appropriate)

interface IndustryConfig {
  keyword: string;
  type: string;
  allowedTypes: string[];
  blockedTypes: string[];
  radius: number;
}

const INDUSTRY_MAP: Record<string, IndustryConfig> = {
  'مطاعم وكافيهات': {
    keyword: 'restaurant OR cafe',
    type: 'restaurant',
    allowedTypes: ['restaurant', 'cafe', 'meal_delivery', 'meal_takeaway', 'bakery', 'food'],
    blockedTypes: ['lodging', 'hotel', 'motel', 'resort', 'hospital', 'gas_station', 'car_wash', 'gym', 'school'],
    radius: 3000,
  },
  'فنادق وشقق فندقية': {
    keyword: 'hotel OR furnished apartments',
    type: 'lodging',
    allowedTypes: ['lodging', 'hotel', 'resort'],
    blockedTypes: ['restaurant', 'cafe', 'hospital', 'school'],
    radius: 5000,
  },
  'عيادات طبية': {
    keyword: 'clinic OR medical center',
    type: 'doctor',
    allowedTypes: ['doctor', 'dentist', 'health', 'hospital', 'physiotherapist', 'pharmacy'],
    blockedTypes: ['lodging', 'restaurant', 'cafe', 'store', 'gym'],
    radius: 4000,
  },
  'صالونات ومراكز تجميل': {
    keyword: 'salon OR beauty center OR barbershop',
    type: 'beauty_salon',
    allowedTypes: ['beauty_salon', 'hair_care', 'spa'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'store', 'gym'],
    radius: 2500,
  },
  'محلات تجارية': {
    keyword: 'shop OR store',
    type: 'store',
    allowedTypes: ['store', 'clothing_store', 'shoe_store', 'electronics_store', 'furniture_store', 'home_goods_store', 'jewelry_store', 'shopping_mall'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'gas_station'],
    radius: 3000,
  },
  'سوبرماركت وبقالة': {
    keyword: 'supermarket OR grocery',
    type: 'supermarket',
    allowedTypes: ['supermarket', 'grocery_or_supermarket', 'convenience_store'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'gas_station', 'clothing_store'],
    radius: 2500,
  },
  'خدمات سيارات': {
    keyword: 'car service OR auto repair OR car wash',
    type: 'car_repair',
    allowedTypes: ['car_repair', 'car_wash', 'car_dealer', 'gas_station'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'school', 'store'],
    radius: 4000,
  },
  'تعليم وتدريب': {
    keyword: 'school OR training center OR academy',
    type: 'school',
    allowedTypes: ['school', 'university', 'library', 'book_store'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'gas_station', 'store'],
    radius: 5000,
  },
  'عقارات': {
    keyword: 'real estate OR property',
    type: 'real_estate_agency',
    allowedTypes: ['real_estate_agency'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'store'],
    radius: 5000,
  },
  'خدمات قانونية': {
    keyword: 'law firm OR lawyer OR legal',
    type: 'lawyer',
    allowedTypes: ['lawyer', 'accounting', 'insurance_agency'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'store'],
    radius: 5000,
  },
  'بنوك وخدمات مالية': {
    keyword: 'bank OR financial services',
    type: 'bank',
    allowedTypes: ['bank', 'atm', 'finance', 'accounting', 'insurance_agency'],
    blockedTypes: ['lodging', 'restaurant', 'hospital', 'store'],
    radius: 3000,
  },
};

// Default config for unknown industries
const DEFAULT_CONFIG: IndustryConfig = {
  keyword: '',
  type: 'establishment',
  allowedTypes: [],
  blockedTypes: ['lodging', 'hospital', 'cemetery', 'church', 'mosque', 'fire_station', 'police'],
  radius: 3000,
};

// ── Distance calculation (Haversine) ────────────────────────────────────────
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Competitor scoring ──────────────────────────────────────────────────────
// score = rating_weight * 0.45 + review_volume_weight * 0.35 + proximity_weight * 0.20
function computeScore(
  rating: number,
  reviewCount: number,
  distanceMeters: number,
  maxDistance: number,
): number {
  // Rating component (0–5 → 0–1)
  const ratingScore = rating / 5;

  // Review volume component (log scale, capped at ~1000 reviews)
  const logReviews = reviewCount > 0 ? Math.log10(reviewCount + 1) : 0;
  const reviewScore = Math.min(logReviews / 3, 1); // log10(1001) ≈ 3

  // Proximity component (closer = higher score)
  const proximityScore = 1 - Math.min(distanceMeters / maxDistance, 1);

  return ratingScore * 0.45 + reviewScore * 0.35 + proximityScore * 0.20;
}

// ── Type relevance check ────────────────────────────────────────────────────
function isRelevantPlace(
  placeTypes: string[],
  config: IndustryConfig,
): boolean {
  // Hard block: if any blocked type is present, reject
  if (placeTypes.some(t => config.blockedTypes.includes(t))) {
    return false;
  }

  // If we have allowed types, at least one must match
  if (config.allowedTypes.length > 0) {
    return placeTypes.some(t => config.allowedTypes.includes(t));
  }

  // No allowed types specified (default config) → accept anything not blocked
  return true;
}

// ── Extract smart keyword from business name ────────────────────────────────
function extractKeywordFromName(name: string): string {
  // Common Arabic business type words → English keywords
  const arToKeyword: Record<string, string> = {
    'فلافل': 'falafel',
    'شاورما': 'shawarma',
    'برجر': 'burger',
    'بيتزا': 'pizza',
    'سوشي': 'sushi',
    'مشويات': 'grill',
    'كافيه': 'coffee shop',
    'كوفي': 'coffee',
    'قهوة': 'coffee',
    'حلويات': 'sweets',
    'مخبز': 'bakery',
    'عصير': 'juice',
    'آيس كريم': 'ice cream',
    'مطعم': 'restaurant',
    'صيدلية': 'pharmacy',
    'عيادة': 'clinic',
    'صالون': 'salon',
    'حلاق': 'barbershop',
    'سوبرماركت': 'supermarket',
    'بقالة': 'grocery',
    'مغسلة': 'laundry',
    'ورشة': 'workshop',
  };

  const nameLower = name.toLowerCase();
  for (const [ar, en] of Object.entries(arToKeyword)) {
    if (nameLower.includes(ar)) return en;
  }
  return '';
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  const cors = makeCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { industry, city, latitude, longitude, businessName } = body;

    if (!industry || !city) {
      return new Response(JSON.stringify({ error: 'industry and city are required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_KEY) {
      return new Response(JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // ── Resolve coordinates (prefer branch location) ────────────
    const coords = (latitude && longitude)
      ? { lat: latitude, lng: longitude }
      : CITY_COORDS[city] || null;

    if (!coords) {
      return new Response(JSON.stringify([]), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // ── Get industry config ─────────────────────────────────────
    const config = INDUSTRY_MAP[industry] || DEFAULT_CONFIG;

    // Build smart keyword:
    // 1. Start with industry config keyword
    // 2. Enhance with business name if available
    let keyword = config.keyword;
    if (businessName) {
      const nameKeyword = extractKeywordFromName(businessName);
      if (nameKeyword) {
        // Use the specific keyword (e.g., "falafel") instead of generic "restaurant"
        keyword = nameKeyword;
      }
    }

    console.log('[fetch-competitors] Smart query:', {
      industry,
      keyword,
      type: config.type,
      radius: config.radius,
      coords,
    });

    // ── Call Google Places Nearby Search ─────────────────────────
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${coords.lat},${coords.lng}`);
    url.searchParams.set('radius', String(config.radius));
    url.searchParams.set('type', config.type);
    if (keyword) {
      url.searchParams.set('keyword', keyword);
    }
    url.searchParams.set('key', GOOGLE_MAPS_KEY);
    url.searchParams.set('language', 'ar');

    const placesRes = await fetch(url.toString());
    const placesData = await placesRes.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('[fetch-competitors] Google API error:', placesData.status, placesData.error_message);
      return new Response(JSON.stringify({
        error: 'Google Places API error',
        apiStatus: placesData.status,
        apiMessage: placesData.error_message || null,
      }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const rawResults: PlaceResult[] = placesData.results || [];
    console.log('[fetch-competitors] Raw results:', rawResults.length);

    // ── Phase 1: Filter by relevance ────────────────────────────
    const filtered = rawResults.filter((place) => {
      // Must have rating
      if (!place.rating || place.rating <= 0) return false;

      // Must be operational
      if (place.business_status && place.business_status !== 'OPERATIONAL') return false;

      // Type relevance check
      const types = place.types || [];
      if (!isRelevantPlace(types, config)) {
        console.log('[fetch-competitors] Excluded (type mismatch):', place.name, types);
        return false;
      }

      return true;
    });

    console.log('[fetch-competitors] After type filter:', filtered.length);

    // ── Phase 2: Compute distance + score ───────────────────────
    const scored: SmartCompetitorData[] = filtered.map((place) => {
      const placeLat = place.geometry?.location?.lat || coords.lat;
      const placeLng = place.geometry?.location?.lng || coords.lng;
      const distance = haversineDistance(coords.lat, coords.lng, placeLat, placeLng);
      const reviewCount = place.user_ratings_total || 0;
      const rating = place.rating || 0;

      return {
        name: place.name || '',
        rating,
        reviewCount,
        address: place.vicinity || '',
        placeId: place.place_id || '',
        distance: Math.round(distance),
        score: computeScore(rating, reviewCount, distance, config.radius),
        types: place.types || [],
      };
    });

    // ── Phase 3: Sort by score, take top 5 ──────────────────────
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    console.log('[fetch-competitors] Returning top', top5.length, 'of', scored.length, 'scored competitors');

    // Clean output: remove internal types array to keep response lean
    const output = top5.map(({ types: _t, ...rest }) => rest);

    return new Response(JSON.stringify(output), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[fetch-competitors] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', detail: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
