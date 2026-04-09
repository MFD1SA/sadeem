// ============================================================================
// SENDA — Google Business Profile API Proxy
//
// Proxies Google Business Profile API calls server-side to avoid CORS issues.
// The Google OAuth access token is passed in the request body (googleToken field).
//
// POST /google-business-proxy
// Body: { googleToken: string, action: string, ...params }
// ============================================================================

import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';

const GBP_ACCOUNTS_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GBP_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
const GBP_REVIEWS_BASE = 'https://mybusiness.googleapis.com/v4';

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
    const { googleToken, action } = body;

    if (!googleToken) {
      console.warn('[google-business-proxy] Missing googleToken in body');
      return new Response(JSON.stringify({ error: 'Missing Google access token' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    console.log('[google-business-proxy] Action:', action);

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
