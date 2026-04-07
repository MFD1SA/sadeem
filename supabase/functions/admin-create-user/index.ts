// ============================================================================
// SENDA Admin — Edge Function: admin-create-user (Hardened)
// Rate-limited (5 req / 10 min), input validated, timeout 8s
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { makeCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts'
import { isNonEmptyString, isValidEmail, isValidUUID, sanitizeString, logEvent, withTimeout } from '../_shared/validate.ts'

const FN = 'admin-create-user'
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000 // 10 min
const TIMEOUT_MS = 8000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) })
  }

  const cors = makeCorsHeaders(req)
  const clientIP = getClientIP(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return respond({ error: 'Missing Authorization header' }, 401, cors)
    }

    // Rate limit per caller
    const tokenKey = authHeader.slice(-16)
    const rl = checkRateLimit(`admin-create:${tokenKey}:${clientIP}`, RATE_LIMIT, RATE_WINDOW_MS)
    if (!rl.allowed) {
      logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP })
      return rateLimitResponse(rl.retryAfterMs, cors)
    }

    const handler = async () => {
      const body = await req.json()
      const { email, password, full_name_ar, full_name_en, phone, role_id } = body

      // Validate required fields
      if (!isValidEmail(email)) {
        return respond({ error: 'Valid email is required' }, 400, cors)
      }
      if (!isNonEmptyString(password) || password.length < 8) {
        return respond({ error: 'Password must be at least 8 characters' }, 400, cors)
      }
      if (!isNonEmptyString(full_name_ar) || full_name_ar.trim().length < 2) {
        return respond({ error: 'full_name_ar is required (min 2 chars)' }, 400, cors)
      }
      if (role_id && !isValidUUID(role_id)) {
        return respond({ error: 'Invalid role_id format' }, 400, cors)
      }

      // Sanitize
      const sEmail = sanitizeString(email, 320).toLowerCase()
      const sNameAr = sanitizeString(full_name_ar, 200)
      const sNameEn = full_name_en ? sanitizeString(full_name_en, 200) : null
      const sPhone = phone ? sanitizeString(phone, 20) : null

      // Create clients
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

      // Verify permission via RPC
      const { data: permCheck, error: permErr } = await callerClient.rpc(
        'admin_verify_create_permission',
        { p_email: sEmail, p_role_id: role_id || null }
      )

      if (permErr) {
        const msg = permErr.message || ''
        const status = msg.includes('Permission denied') ? 403 : 400
        logEvent(FN, 'warn', 'Permission denied', { error: msg })
        return respond({ error: msg }, status, cors)
      }

      if (!permCheck) {
        logEvent(FN, 'warn', 'Permission verification failed')
        return respond({ error: 'Permission verification failed' }, 403, cors)
      }

      // Create auth user
      const { data: authUser, error: authErr } = await serviceClient.auth.admin.createUser({
        email: sEmail,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: sNameAr },
      })

      if (authErr) {
        logEvent(FN, 'error', 'Auth user creation failed', { error: authErr.message })
        return respond({ error: 'Failed to create auth user: ' + authErr.message }, 400, cors)
      }

      if (!authUser.user) {
        return respond({ error: 'Auth user creation returned null' }, 500, cors)
      }

      // Create admin_users row via RPC
      const { data: adminResult, error: insertErr } = await callerClient.rpc(
        'admin_insert_admin_user',
        {
          p_auth_uid: authUser.user.id,
          p_email: sEmail,
          p_full_name_ar: sNameAr,
          p_full_name_en: sNameEn,
          p_phone: sPhone,
          p_role_id: role_id || null,
        }
      )

      if (insertErr) {
        // Rollback: delete the auth user
        await serviceClient.auth.admin.deleteUser(authUser.user.id)
        logEvent(FN, 'error', 'Admin record insert failed, rolled back auth user', { error: insertErr.message })
        return respond({ error: 'Failed to create admin record: ' + insertErr.message }, 400, cors)
      }

      logEvent(FN, 'info', 'Admin user created', { email: sEmail, authUid: authUser.user.id })

      return respond({ success: true, data: adminResult }, 200, cors)
    }

    return await withTimeout(handler(), TIMEOUT_MS, FN)

  } catch (err) {
    const msg = (err as Error).message || 'Internal server error'
    if (msg.includes('timed out')) {
      logEvent(FN, 'error', 'Request timeout', { ip: clientIP })
      return respond({ error: 'Request timeout' }, 504, cors)
    }
    logEvent(FN, 'error', 'Unexpected error', { error: msg })
    return respond({ error: 'Internal server error' }, 500, cors)
  }
})

function respond(data: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
