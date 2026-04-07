// ============================================================================
// SENDA — Payment Webhook Edge Function (Hardened)
// - HMAC verification + timestamp validation (5-min replay window)
// - Idempotency via UNIQUE event_id index
// - Structured JSON logging
// - Timeout protection (8s)
// - Rate-limited per IP (30 req / min — webhook bursts)
//
// Deploy: supabase functions deploy payment-webhook --no-verify-jwt
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts'
import { logEvent, withTimeout } from '../_shared/validate.ts'

const PROVIDER_STRIPE = 'stripe'
const PROVIDER_MOYASAR = 'moyasar'

const FN = 'payment-webhook'
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60 * 1000 // 1 min
const TIMEOUT_MS = 8000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const clientIP = getClientIP(req)

  // Rate limit webhooks per IP
  const rl = await checkRateLimit(`webhook:${clientIP}`, RATE_LIMIT, RATE_WINDOW_MS)
  if (!rl.allowed) {
    logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP })
    return rateLimitResponse(60, {})
  }

  try {
    const handler = async () => {
      const url = new URL(req.url)
      const provider = url.searchParams.get('provider') || 'stripe'

      if (provider !== PROVIDER_STRIPE && provider !== PROVIDER_MOYASAR) {
        return jsonResponse({ error: 'Unknown provider' }, 400)
      }

      const rawBody = await req.text()

      // Body size check (reject >1MB payloads)
      if (rawBody.length > 1_000_000) {
        logEvent(FN, 'warn', 'Payload too large', { size: rawBody.length, ip: clientIP })
        return jsonResponse({ error: 'Payload too large' }, 413)
      }

      // Signature verification (fail closed)
      const isValid = await verifySignature(req, rawBody, provider)
      if (!isValid) {
        logEvent(FN, 'error', 'Invalid webhook signature', { provider, ip: clientIP })
        return jsonResponse({ error: 'Invalid webhook signature' }, 401)
      }

      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(rawBody)
      } catch {
        logEvent(FN, 'error', 'Invalid JSON payload', { provider })
        return jsonResponse({ error: 'Invalid JSON' }, 400)
      }

      // Service client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const serviceClient = createClient(supabaseUrl, serviceKey)

      logEvent(FN, 'info', 'Processing webhook', { provider, ip: clientIP })

      if (provider === PROVIDER_STRIPE) {
        return await handleStripeEvent(serviceClient, payload)
      } else if (provider === PROVIDER_MOYASAR) {
        return await handleMoyasarEvent(serviceClient, payload)
      }

      return jsonResponse({ error: 'Unknown provider' }, 400)
    }

    return await withTimeout(handler(), TIMEOUT_MS, FN)

  } catch (err) {
    const msg = (err as Error).message || 'Unknown error'
    if (msg.includes('timed out')) {
      logEvent(FN, 'error', 'Request timeout', { ip: clientIP })
      return jsonResponse({ error: 'Request timeout' }, 504)
    }
    logEvent(FN, 'error', 'Webhook error', { error: msg })
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})


// ─── Idempotency check ───
async function isAlreadyProcessed(
  client: ReturnType<typeof createClient>,
  eventId: string
): Promise<boolean> {
  const { data } = await client
    .from('payment_events')
    .select('id')
    .eq('event_id', eventId)
    .limit(1)
    .maybeSingle()
  return !!data
}


// ─── Stripe Handler ───
async function handleStripeEvent(client: ReturnType<typeof createClient>, event: Record<string, unknown>) {
  const eventType = event.type as string
  const eventId = event.id as string
  const obj = (event.data as Record<string, unknown>)?.object as Record<string, unknown> | undefined

  if (!obj) return jsonResponse({ received: true })

  // Idempotency
  if (eventId && await isAlreadyProcessed(client, eventId)) {
    logEvent(FN, 'info', 'Duplicate event skipped', { eventId })
    return jsonResponse({ received: true, skipped: 'duplicate' })
  }

  const metadata = (obj.metadata || {}) as Record<string, string>
  const orgId = metadata.organization_id

  if (!orgId) {
    await client.from('payment_events').insert({
      gateway_provider: PROVIDER_STRIPE,
      event_type: eventType,
      event_id: eventId,
      payload: event,
      status: 'failed',
      error_message: 'Missing organization_id in metadata',
      processed_at: new Date().toISOString(),
    }).throwOnError().catch(() => {})
    logEvent(FN, 'warn', 'Event missing org_id', { eventId, eventType })
    return jsonResponse({ received: true, warning: 'no org_id' })
  }

  switch (eventType) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded': {
      const amount = ((obj.amount_total || obj.amount_paid || 0) as number) / 100
      await client.rpc('gateway_process_payment_success', {
        p_gateway_provider: PROVIDER_STRIPE,
        p_event_id: eventId,
        p_event_type: eventType,
        p_org_id: orgId,
        p_gateway_customer_id: (obj.customer as string) || null,
        p_gateway_subscription_id: (obj.subscription as string) || null,
        p_gateway_payment_id: (obj.payment_intent as string) || null,
        p_gateway_invoice_id: (obj.invoice as string) || null,
        p_amount: amount,
        p_currency: ((obj.currency as string) || 'sar').toUpperCase(),
        p_payment_method: metadata.payment_method || null,
        p_plan: metadata.plan || null,
        p_period_start: obj.current_period_start
          ? new Date((obj.current_period_start as number) * 1000).toISOString()
          : null,
        p_period_end: obj.current_period_end
          ? new Date((obj.current_period_end as number) * 1000).toISOString()
          : null,
        p_payload: event,
      })
      logEvent(FN, 'info', 'Payment success processed', { eventType, orgId, amount })
      break
    }

    case 'invoice.payment_failed': {
      await client.rpc('gateway_process_payment_failure', {
        p_gateway_provider: PROVIDER_STRIPE,
        p_event_id: eventId,
        p_event_type: eventType,
        p_org_id: orgId,
        p_failure_reason: (obj.last_payment_error as Record<string, string>)?.message || 'Payment failed',
        p_gateway_payment_id: (obj.payment_intent as string) || null,
        p_payload: event,
      })
      logEvent(FN, 'warn', 'Payment failure processed', { eventType, orgId })
      break
    }

    case 'customer.subscription.deleted': {
      await client.rpc('gateway_process_subscription_cancelled', {
        p_gateway_provider: PROVIDER_STRIPE,
        p_event_id: eventId,
        p_org_id: orgId,
        p_payload: event,
      })
      logEvent(FN, 'info', 'Subscription cancelled', { orgId })
      break
    }

    default: {
      await client.from('payment_events').insert({
        gateway_provider: PROVIDER_STRIPE,
        event_type: eventType,
        event_id: eventId,
        organization_id: orgId,
        payload: event,
        status: 'ignored',
        processed_at: new Date().toISOString(),
      }).throwOnError().catch(() => {})
      logEvent(FN, 'info', 'Event ignored', { eventType, orgId })
    }
  }

  return jsonResponse({ received: true })
}


// ─── Moyasar Handler ───
async function handleMoyasarEvent(client: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const eventType = (payload.type as string) || 'unknown'
  const eventId = (payload.id as string) || crypto.randomUUID()
  const data = (payload.data || payload) as Record<string, unknown>
  const metadata = (data.metadata || {}) as Record<string, string>
  const orgId = metadata.organization_id

  if (!orgId) {
    logEvent(FN, 'warn', 'Moyasar event missing org_id', { eventId })
    return jsonResponse({ received: true, warning: 'no org_id' })
  }

  if (await isAlreadyProcessed(client, eventId)) {
    logEvent(FN, 'info', 'Duplicate Moyasar event skipped', { eventId })
    return jsonResponse({ received: true, skipped: 'duplicate' })
  }

  const status = data.status as string

  if (status === 'paid') {
    const amount = ((data.amount as number) || 0) / 100
    await client.rpc('gateway_process_payment_success', {
      p_gateway_provider: PROVIDER_MOYASAR,
      p_event_id: eventId,
      p_event_type: eventType,
      p_org_id: orgId,
      p_gateway_payment_id: data.id as string || null,
      p_amount: amount,
      p_currency: ((data.currency as string) || 'SAR').toUpperCase(),
      p_payment_method: (data.source as Record<string, string>)?.type || null,
      p_plan: metadata.plan || null,
      p_payload: payload,
    })
    logEvent(FN, 'info', 'Moyasar payment success', { orgId, amount })
  } else if (status === 'failed') {
    await client.rpc('gateway_process_payment_failure', {
      p_gateway_provider: PROVIDER_MOYASAR,
      p_event_id: eventId,
      p_event_type: eventType,
      p_org_id: orgId,
      p_failure_reason: (data.message as string) || 'Payment failed',
      p_gateway_payment_id: data.id as string || null,
      p_payload: payload,
    })
    logEvent(FN, 'warn', 'Moyasar payment failed', { orgId })
  }

  return jsonResponse({ received: true })
}


// ─── Signature Verification (fail closed) ───
async function verifySignature(req: Request, body: string, provider: string): Promise<boolean> {
  if (provider === PROVIDER_STRIPE) {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      logEvent(FN, 'error', 'STRIPE_WEBHOOK_SECRET not configured')
      return false
    }

    const sigHeader = req.headers.get('stripe-signature')
    if (!sigHeader) return false

    try {
      const parts = Object.fromEntries(
        sigHeader.split(',').map(p => {
          const [k, v] = p.split('=')
          return [k.trim(), v]
        })
      )
      const timestamp = parts['t']
      const expectedSig = parts['v1']
      if (!timestamp || !expectedSig) return false

      // Reject signatures older than 5 minutes (replay protection)
      const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
      if (isNaN(ageSeconds) || ageSeconds > 300 || ageSeconds < -60) return false

      const signedPayload = `${timestamp}.${body}`
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
      const computedSig = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Constant-time comparison
      if (computedSig.length !== expectedSig.length) return false
      let mismatch = 0
      for (let i = 0; i < computedSig.length; i++) {
        mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i)
      }
      return mismatch === 0
    } catch {
      return false
    }
  }

  if (provider === PROVIDER_MOYASAR) {
    const secret = Deno.env.get('MOYASAR_WEBHOOK_SECRET')
    if (!secret) {
      logEvent(FN, 'error', 'MOYASAR_WEBHOOK_SECRET not configured')
      return false
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) return false

    const expected = `Basic ${btoa(secret + ':')}`
    if (authHeader.length !== expected.length) return false
    let mismatch = 0
    for (let i = 0; i < expected.length; i++) {
      mismatch |= authHeader.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return mismatch === 0
  }

  return false
}


function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
