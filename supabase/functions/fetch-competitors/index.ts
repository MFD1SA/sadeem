// ============================================================================
// SENDA — Fetch Competitors Edge Function
//
// Proxies Google Places API (Nearby Search) to find competitor businesses.
// Keeps the GOOGLE_MAPS_API_KEY server-side (never exposed to frontend).
//
// POST /fetch-competitors
// Body: { industry: string, city: string, latitude?: number, longitude?: number }
// Returns: CompetitorData[]
// ============================================================================

import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

interface CompetitorData {
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  placeId: string;
}

// City → approximate coordinates (GCC region)
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
  'دبي': { lat: 25.2048, lng: 55.2708 },
  'أبوظبي': { lat: 24.4539, lng: 54.3773 },
  'الشارقة': { lat: 25.3463, lng: 55.4209 },
  'الكويت': { lat: 29.3759, lng: 47.9774 },
  'الدوحة': { lat: 25.2854, lng: 51.531 },
  'المنامة': { lat: 26.2285, lng: 50.586 },
  'مسقط': { lat: 23.588, lng: 58.3829 },
};

// Industry → Google Places type mapping
const INDUSTRY_TYPE: Record<string, string> = {
  'مطاعم وكافيهات': 'restaurant',
  'فنادق وشقق فندقية': 'lodging',
  'عيادات طبية': 'doctor',
  'صالونات ومراكز تجميل': 'beauty_salon',
  'محلات تجارية': 'store',
  'سوبرماركت وبقالة': 'supermarket',
  'خدمات سيارات': 'car_repair',
  'تعليم وتدريب': 'school',
  'عقارات': 'real_estate_agency',
  'خدمات قانونية': 'lawyer',
  'بنوك وخدمات مالية': 'bank',
};

Deno.serve(async (req: Request) => {
  const cors = makeCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  // Origin check
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { industry, city, latitude, longitude } = await req.json();

    if (!industry || !city) {
      return new Response(JSON.stringify({ error: 'industry and city are required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    // If no API key configured, return empty array gracefully
    if (!GOOGLE_MAPS_KEY) {
      return new Response(JSON.stringify([]), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Resolve coordinates
    const coords = (latitude && longitude)
      ? { lat: latitude, lng: longitude }
      : CITY_COORDS[city] || null;

    if (!coords) {
      // Unknown city — return empty
      return new Response(JSON.stringify([]), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const placeType = INDUSTRY_TYPE[industry] || 'establishment';

    // Call Google Places Nearby Search
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${coords.lat},${coords.lng}`);
    url.searchParams.set('radius', '5000');
    url.searchParams.set('type', placeType);
    url.searchParams.set('key', GOOGLE_MAPS_KEY);
    url.searchParams.set('language', 'ar');

    const placesRes = await fetch(url.toString());
    const placesData = await placesRes.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('[fetch-competitors] Places API error:', placesData.status, placesData.error_message);
      return new Response(JSON.stringify([]), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const results: CompetitorData[] = (placesData.results || [])
      .slice(0, 10)
      .map((place: Record<string, unknown>) => ({
        name: place.name as string || '',
        rating: (place.rating as number) || 0,
        reviewCount: (place.user_ratings_total as number) || 0,
        address: (place.vicinity as string) || '',
        placeId: (place.place_id as string) || '',
      }))
      .filter((c: CompetitorData) => c.rating > 0);

    return new Response(JSON.stringify(results), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[fetch-competitors] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
