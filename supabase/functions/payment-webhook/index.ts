// ============================================================================
// SENDA — Payment Webhook Edge Function
//
// Receives webhook events from Stripe or Moyasar.
// Validates signature server-side, then calls SECURITY DEFINER RPCs
// via service_role to update subscriptions/invoices/payments.
//
// SECRETS (set via `supabase secrets set`):
//   STRIPE_WEBHOOK_SECRET   — Stripe endpoint signing secret (whsec_...)
//   MOYASAR_WEBHOOK_SECRET  — Moyasar webhook secret
//
// Deploy: supabase functions deploy payment-webhook --no-verify-jwt
//   (--no-verify-jwt because webhooks don't carry user JWTs)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROVIDER_STRIPE = 'stripe'
const PROVIDER_MOYASAR = 'moyasar'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider') || 'stripe'

    // Reject unknown providers before reading body
    if (provider !== PROVIDER_STRIPE && provider !== PROVIDER_MOYASAR) {
      return jsonResponse({ error: 'Unknown provider' }, 400)
    }

    const rawBody = await req.text()

    // --- Signature verification (fail closed) ---
    const isValid = await verifySignature(req, rawBody, provider)
    if (!isValid) {
      return jsonResponse({ error: 'Invalid webhook signature' }, 401)
    }

    const payload = JSON.parse(rawBody)

    // --- Service client (server-side only) ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceKey)

    // --- Route by provider ---
    if (provider === PROVIDER_STRIPE) {
      return await handleStripeEvent(serviceClient, payload)
    } else if (provider === PROVIDER_MOYASAR) {
      return await handleMoyasarEvent(serviceClient, payload)
    }

    return jsonResponse({ error: 'Unknown provider' }, 400)

  } catch (err) {
    console.error('Webhook error:', err)
    return jsonResponse({ error: 'Internal error' }, 500)
  }
})


// ─── Idempotency check ───
// Returns true if this event_id was already processed (skip it).
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

  // Idempotency: skip if already processed
  if (eventId && await isAlreadyProcessed(client, eventId)) {
    return jsonResponse({ received: true, skipped: 'duplicate' })
  }

  // Extract org_id from metadata
  const metadata = (obj.metadata || {}) as Record<string, string>
  const orgId = metadata.organization_id

  if (!orgId) {
    // Log event without org linking
    await client.from('payment_events').insert({
      gateway_provider: PROVIDER_STRIPE,
      event_type: eventType,
      event_id: eventId,
      payload: event,
      status: 'failed',
      error_message: 'Missing organization_id in metadata',
      processed_at: new Date().toISOString(),
    }).throwOnError().catch(() => {}) // best-effort log, don't break response
    return jsonResponse({ received: true, warning: 'no org_id' })
  }

  switch (eventType) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded': {
      const amount = ((obj.amount_total || obj.amount_paid || 0) as number) / 100 // cents to units
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
      break
    }

    case 'customer.subscription.deleted': {
      await client.rpc('gateway_process_subscription_cancelled', {
        p_gateway_provider: PROVIDER_STRIPE,
        p_event_id: eventId,
        p_org_id: orgId,
        p_payload: event,
      })
      break
    }

    default: {
      // Log unknown events for monitoring — never process them
      await client.from('payment_events').insert({
        gateway_provider: PROVIDER_STRIPE,
        event_type: eventType,
        event_id: eventId,
        organization_id: orgId,
        payload: event,
        status: 'ignored',
        processed_at: new Date().toISOString(),
      }).throwOnError().catch(() => {})
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
    return jsonResponse({ received: true, warning: 'no org_id' })
  }

  // Idempotency: skip if already processed
  if (await isAlreadyProcessed(client, eventId)) {
    return jsonResponse({ received: true, skipped: 'duplicate' })
  }

  const status = data.status as string

  if (status === 'paid') {
    const amount = ((data.amount as number) || 0) / 100 // halalas to riyals
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
  }

  return jsonResponse({ received: true })
}


// ─── Signature Verification (fail closed) ───
async function verifySignature(req: Request, body: string, provider: string): Promise<boolean> {
  if (provider === PROVIDER_STRIPE) {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured — rejecting webhook')
      return false
    }

    const sigHeader = req.headers.get('stripe-signature')
    if (!sigHeader) return false

    try {
      // Parse Stripe signature: t=timestamp,v1=signature
      const parts = Object.fromEntries(
        sigHeader.split(',').map(p => {
          const [k, v] = p.split('=')
          return [k.trim(), v]
        })
      )
      const timestamp = parts['t']
      const expectedSig = parts['v1']
      if (!timestamp || !expectedSig) return false

      // Reject signatures older than 5 minutes (replay window)
      const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
      if (isNaN(ageSeconds) || ageSeconds > 300) return false

      // Compute HMAC SHA-256
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
      console.error('MOYASAR_WEBHOOK_SECRET not configured — rejecting webhook')
      return false
    }

    // Moyasar uses basic auth or HMAC depending on config
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return false

    // Constant-time comparison of the secret portion
    const expected = `Basic ${btoa(secret + ':')}`
    if (authHeader.length !== expected.length) return false
    let mismatch = 0
    for (let i = 0; i < expected.length; i++) {
      mismatch |= authHeader.charCodeAt(i) ^ expected.charCodeAt(i)
    }
    return mismatch === 0
  }

  // Unknown provider — fail closed
  return false
}


function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
