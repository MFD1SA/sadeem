// ============================================================================
// SENDA Admin — Edge Function: admin-create-user
//
// This runs on Supabase Edge Functions (Deno runtime).
// It uses the SERVICE_ROLE key (server-side only, never exposed to client).
//
// Flow:
// 1. Verify caller JWT → extract auth.uid()
// 2. Call RPC admin_verify_create_permission() → DB checks permission
// 3. Create auth user via supabase.auth.admin.createUser()
// 4. Call RPC admin_insert_admin_user() → create admin_users row + audit
// 5. Return result
//
// Deploy: supabase functions deploy admin-create-user
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { makeCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) })
  }

  try {
    // --- Extract caller JWT ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // --- Parse request body ---
    const body = await req.json()
    const { email, password, full_name_ar, full_name_en, phone, role_id } = body

    if (!email || !password || !full_name_ar) {
      return new Response(
        JSON.stringify({ error: 'email, password, and full_name_ar are required' }),
        { status: 400, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // --- Create two clients ---
    // Client A: with caller's JWT (for permission verification via RLS/RPC)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Client B: with service_role (for auth.admin.createUser)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // --- Step 1: Verify caller has permission ---
    // This RPC uses auth.uid() from the caller's JWT
    const { data: permCheck, error: permErr } = await callerClient.rpc(
      'admin_verify_create_permission',
      { p_email: email.toLowerCase().trim(), p_role_id: role_id || null }
    )

    if (permErr) {
      const msg = permErr.message || ''
      const status = msg.includes('Permission denied') ? 403 : 400
      return new Response(
        JSON.stringify({ error: msg }),
        { status, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (!permCheck) {
      return new Response(
        JSON.stringify({ error: 'Permission verification failed' }),
        { status: 403, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // --- Step 2: Create auth user via service_role ---
    // This is the ONLY place where service_role is used.
    // It never reaches the client.
    const { data: authUser, error: authErr } = await serviceClient.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: { full_name: full_name_ar },
    })

    if (authErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to create auth user: ' + authErr.message }),
        { status: 400, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'Auth user creation returned null' }),
        { status: 500, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // --- Step 3: Create admin_users row via RPC (caller's JWT for audit) ---
    const { data: adminResult, error: insertErr } = await callerClient.rpc(
      'admin_insert_admin_user',
      {
        p_auth_uid: authUser.user.id,
        p_email: email.toLowerCase().trim(),
        p_full_name_ar: full_name_ar,
        p_full_name_en: full_name_en || null,
        p_phone: phone || null,
        p_role_id: role_id || null,
      }
    )

    if (insertErr) {
      // Rollback: delete the auth user we just created
      await serviceClient.auth.admin.deleteUser(authUser.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create admin record: ' + insertErr.message }),
        { status: 400, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: adminResult,
      }),
      { status: 200, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...makeCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})
