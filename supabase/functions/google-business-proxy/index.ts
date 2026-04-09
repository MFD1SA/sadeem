// ============================================================================
// SENDA — Google Business Profile API Proxy (v2)
//
// Reads Google OAuth tokens from google_tokens table (no tokens in frontend).
// Auto-refreshes expired tokens using GOOGLE_CLIENT_ID/SECRET.
//
// POST /google-business-proxy
// Body: { organizationId: string, action: string, ...params }
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';

const GBP_ACCOUNTS_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_REVIEWS_BASE = 'https://mybusiness.googleapis.com/v4';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ── Get or refresh access token ─────────────────────────────────────────────
async function getValidToken(
  db: ReturnType<typeof createClient>,
  organizationId: string,
): Promise<string> {
  const { data: row, error } = await db
    .from('google_tokens')
    .select('access_token, refresh_token, token_expiry')
    .eq('organization_id', organizationId)
    .single();

  if (error || !row) {
    throw new Error('NO_TOKEN');
  }

  // Check if token is still valid (5 min buffer)
  if (row.token_expiry) {
    const expiresAt = new Date(row.token_expiry);
    if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return row.access_token;
    }
  }

  // Token expired — refresh it
  if (!row.refresh_token) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('OAUTH_NOT_CONFIGURED');
  }

  console.log('[google-business-proxy] Refreshing expired token for org:', organizationId);

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    console.error('[google-business-proxy] Refresh failed:', tokenData);
    throw new Error('REFRESH_FAILED');
  }

  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

  // Update DB
  await db
    .from('google_tokens')
    .update({
      access_token: tokenData.access_token,
      token_expiry: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  return tokenData.access_token;
}

// ── Main handler ────────────────────────────────────────────────────────────
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
    const body = await req.json();
    const { organizationId, action } = body;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[google-business-proxy] Action:', action, 'Org:', organizationId);

    // Get valid Google token from DB (auto-refreshes if expired)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceKey);

    let googleToken: string;
    try {
      googleToken = await getValidToken(db, organizationId);
    } catch (err) {
      const code = (err as Error).message;
      const messages: Record<string, string> = {
        NO_TOKEN: 'لم يتم ربط حساب Google Business بعد. اضغط "ربط Google Business" أولاً.',
        NO_REFRESH_TOKEN: 'انتهت صلاحية الربط. أعد ربط حساب Google Business.',
        OAUTH_NOT_CONFIGURED: 'Google OAuth غير مُعدّ على السيرفر.',
        REFRESH_FAILED: 'فشل تجديد رمز Google. أعد ربط حساب Google Business.',
      };
      return new Response(JSON.stringify({
        error: messages[code] || 'خطأ في الحصول على رمز Google',
        code,
      }), {
        status: code === 'NO_TOKEN' ? 404 : 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Build Google API request
    let url: string;
    let method = 'GET';
    let fetchBody: string | undefined;

    switch (action) {
      case 'listAccounts':
        url = `${GBP_ACCOUNTS_BASE}/accounts`;
        break;

      case 'listLocations': {
        const { accountName } = body;
        if (!accountName) {
          return new Response(JSON.stringify({ error: 'accountName is required' }), {
            status: 400,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
        url = `${GBP_API_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,metadata`;
        break;
      }

      case 'listReviews': {
        const { locationName, pageSize = 50, pageToken } = body;
        if (!locationName) {
          return new Response(JSON.stringify({ error: 'locationName is required' }), {
            status: 400,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
        url = `${GBP_REVIEWS_BASE}/${locationName}/reviews?pageSize=${pageSize}`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        break;
      }

      case 'postReply': {
        const { reviewName, comment } = body;
        if (!reviewName || !comment) {
          return new Response(JSON.stringify({ error: 'reviewName and comment are required' }), {
            status: 400,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
        url = `${GBP_REVIEWS_BASE}/${reviewName}/reply`;
        method = 'PUT';
        fetchBody = JSON.stringify({ comment });
        break;
      }

      case 'deleteReply': {
        const { reviewName: rn } = body;
        if (!rn) {
          return new Response(JSON.stringify({ error: 'reviewName is required' }), {
            status: 400,
            headers: { ...cors, 'Content-Type': 'application/json' },
          });
        }
        url = `${GBP_REVIEWS_BASE}/${rn}/reply`;
        method = 'DELETE';
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
    }

    console.log('[google-business-proxy] Calling:', method, url);

    const googleRes = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        ...(fetchBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(fetchBody ? { body: fetchBody } : {}),
    });

    const responseText = await googleRes.text();
    console.log('[google-business-proxy] Google status:', googleRes.status);

    if (!googleRes.ok) {
      console.error('[google-business-proxy] Google error:', responseText.slice(0, 500));

      let errorMessage = `Google API error: ${googleRes.status}`;
      try {
        const errJson = JSON.parse(responseText);
        errorMessage = errJson?.error?.message || errorMessage;
      } catch { /* use default */ }

      return new Response(JSON.stringify({
        error: errorMessage,
        status: googleRes.status,
      }), {
        status: googleRes.status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    return new Response(responseText, {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[google-business-proxy] Error:', err);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      detail: String(err),
    }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
