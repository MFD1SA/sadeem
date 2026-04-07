// Allowed origins for CORS — restrict to production + preview domains
const ALLOWED_ORIGINS = [
  'https://gandx.net',
  'https://www.gandx.net',
  'https://cidoma.com',
  'https://www.cidoma.com',
];

export function getCorsOrigin(req?: Request): string {
  if (!req) return ALLOWED_ORIGINS[0];
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  // Allow Vercel preview deployments
  if (origin.endsWith('.vercel.app')) return origin;
  // Allow localhost for development
  if (origin.startsWith('http://localhost:')) return origin;
  return ALLOWED_ORIGINS[0];
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function makeCorsHeaders(req?: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
