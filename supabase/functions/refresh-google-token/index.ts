// ============================================================================
// SENDA — Refresh Google OAuth Token
//
// Reads refresh_token from google_tokens table, calls Google OAuth endpoint
// to get a new access_token, and updates the DB.
//
// POST /refresh-google-token
// Body: { organizationId: string }
// Returns: { access_token: string, expires_at: string }
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { makeCorsHeaders, isOriginAllowed } from '../_shared/cors.ts';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

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
    const { organizationId } = body;

    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('[refresh-google-token] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
      return new Response(JSON.stringify({ error: 'Google OAuth not configured on server' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Read current tokens from DB using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceKey);

    const { data: tokenRow, error: readErr } = await db
      .from('google_tokens')
      .select('refresh_token, access_token, token_expiry')
      .eq('organization_id', organizationId)
      .single();

    if (readErr || !tokenRow) {
      console.error('[refresh-google-token] Token not found:', readErr?.message);
      return new Response(JSON.stringify({ error: 'No Google token found for this organization' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Check if current token is still valid (5 min buffer)
    if (tokenRow.token_expiry) {
      const expiresAt = new Date(tokenRow.token_expiry);
      const now = new Date();
      const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      if (expiresAt > fiveMinFromNow) {
        // Token still valid — return as-is
        return new Response(JSON.stringify({
          access_token: tokenRow.access_token,
          expires_at: tokenRow.token_expiry,
        }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!tokenRow.refresh_token) {
      console.error('[refresh-google-token] No refresh_token available');
      return new Response(JSON.stringify({
        error: 'No refresh token — user must reconnect Google Business',
      }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Call Google token endpoint to refresh
    console.log('[refresh-google-token] Refreshing token for org:', organizationId);

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenRow.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[refresh-google-token] Google refresh failed:', tokenData);
      return new Response(JSON.stringify({
        error: tokenData.error_description || 'Failed to refresh Google token',
        googleError: tokenData.error,
      }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Calculate expiry
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

    // Update DB
    const { error: updateErr } = await db
      .from('google_tokens')
      .update({
        access_token: tokenData.access_token,
        token_expiry: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);

    if (updateErr) {
      console.error('[refresh-google-token] DB update failed:', updateErr.message);
    }

    console.log('[refresh-google-token] Token refreshed successfully');

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      expires_at: expiresAt,
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[refresh-google-token] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
