// ============================================================================
// SENDA — Create Checkout Session Edge Function (Hardened)
// Rate-limited per user (3 req / 5 min), input validated, timeout 8s
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { makeCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimit, getClientIP, rateLimitResponse } from '../_shared/rate-limit.ts'
import { isValidUUID, isNonEmptyString, logEvent, withTimeout } from '../_shared/validate.ts'

const FN = 'create-checkout'
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 5 * 60 * 1000 // 5 min
const TIMEOUT_MS = 8000

const VALID_PLANS = ['starter', 'growth', 'pro', 'enterprise'] as const
const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  growth: 299,
  pro: 699,
  enterprise: 1499,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) })
  }

  const cors = makeCorsHeaders(req)
  const clientIP = getClientIP(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401, cors)
    }

    // Rate limit per token
    const tokenKey = authHeader.slice(-16)
    const rl = await checkRateLimit(`checkout:${tokenKey}:${clientIP}`, RATE_LIMIT, RATE_WINDOW_MS)
    if (!rl.allowed) {
      logEvent(FN, 'warn', 'Rate limit exceeded', { ip: clientIP })
      return rateLimitResponse(60, cors)
    }

    const handler = async () => {
      const body = await req.json()
      const { organization_id, plan } = body

      // Validate inputs strictly
      if (!isValidUUID(organization_id)) {
        return jsonResponse({ error: 'Invalid organization_id format' }, 400, cors)
      }
      if (!isNonEmptyString(plan) || !VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
        return jsonResponse({ error: 'Invalid plan. Must be one of: starter, growth, pro, enterprise' }, 400, cors)
      }

      // Authenticate caller
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const { data: { user }, error: userErr } = await callerClient.auth.getUser()
      if (userErr || !user) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401, cors)
      }

      // Verify caller owns the organization
      const { data: membership } = await callerClient
        .from('memberships')
        .select('role')
        .eq('organization_id', organization_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership || membership.role !== 'owner') {
        logEvent(FN, 'warn', 'Non-owner checkout attempt', { userId: user.id, orgId: organization_id })
        return jsonResponse({ error: 'Only organization owner can create checkout' }, 403, cors)
      }

      // Get org details
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const serviceClient = createClient(supabaseUrl, serviceKey)

      const { data: org } = await serviceClient
        .from('organizations')
        .select('name, slug')
        .eq('id', organization_id)
        .single()

      const provider = Deno.env.get('GATEWAY_PROVIDER') || 'stripe'

      // Resolve app origin
      const appUrl = Deno.env.get('APP_URL')
        || Deno.env.get('PUBLIC_SITE_URL')
        || req.headers.get('origin')
      if (!appUrl) {
        return jsonResponse({ error: 'APP_URL not configured' }, 500, cors)
      }
      const successUrl = `${appUrl}/dashboard?payment=success`
      const cancelUrl = `${appUrl}/dashboard?payment=cancelled`

      const price = PLAN_PRICES[plan]

      logEvent(FN, 'info', 'Creating checkout', { provider, plan, orgId: organization_id, userId: user.id })

      if (provider === 'stripe') {
        return await createStripeCheckout(cors, {
          organizationId: organization_id,
          orgName: org?.name || 'Senda Customer',
          plan,
          priceAmount: price * 100,
          successUrl,
          cancelUrl,
        })
      }

      if (provider === 'moyasar') {
        return await createMoyasarCheckout(cors, {
          organizationId: organization_id,
          orgName: org?.name || 'Senda Customer',
          plan,
          priceAmount: price * 100,
          successUrl,
        })
      }

      return jsonResponse({ error: 'No payment gateway configured' }, 500, cors)
    }

    return await withTimeout(handler(), TIMEOUT_MS, FN)

  } catch (err) {
    const msg = (err as Error).message || 'Internal error'
    if (msg.includes('timed out')) {
      logEvent(FN, 'error', 'Request timeout', { ip: clientIP })
      return jsonResponse({ error: 'Request timeout' }, 504, cors)
    }
    logEvent(FN, 'error', 'Unexpected error', { error: msg })
    return jsonResponse({ error: 'Internal error' }, 500, cors)
  }
})


async function createStripeCheckout(cors: Record<string, string>, params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
  cancelUrl: string
}) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return jsonResponse({ error: 'Stripe not configured' }, 500, cors)
  }

  // Idempotency key to prevent duplicate sessions
  const idempotencyKey = `checkout_${params.organizationId}_${params.plan}_${Math.floor(Date.now() / 60000)}`

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: new URLSearchParams({
      'mode': 'subscription',
      'currency': 'sar',
      'line_items[0][price_data][currency]': 'sar',
      'line_items[0][price_data][product_data][name]': `Senda ${params.plan} Plan`,
      'line_items[0][price_data][unit_amount]': String(params.priceAmount),
      'line_items[0][price_data][recurring][interval]': 'month',
      'line_items[0][quantity]': '1',
      'metadata[organization_id]': params.organizationId,
      'metadata[plan]': params.plan,
      'subscription_data[metadata][organization_id]': params.organizationId,
      'subscription_data[metadata][plan]': params.plan,
      'success_url': params.successUrl,
      'cancel_url': params.cancelUrl,
    }),
  })

  const session = await response.json()

  if (!response.ok) {
    logEvent(FN, 'error', 'Stripe checkout error', { error: session.error?.message, orgId: params.organizationId })
    return jsonResponse({ error: session.error?.message || 'Stripe error' }, 400, cors)
  }

  logEvent(FN, 'info', 'Stripe checkout created', { sessionId: session.id, orgId: params.organizationId })

  return jsonResponse({
    checkout_url: session.url,
    session_id: session.id,
    provider: 'stripe',
  }, 200, cors)
}


async function createMoyasarCheckout(cors: Record<string, string>, params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
}) {
  const moyasarKey = Deno.env.get('MOYASAR_SECRET_KEY')
  if (!moyasarKey) {
    return jsonResponse({ error: 'Moyasar not configured' }, 500, cors)
  }

  const response = await fetch('https://api.moyasar.com/v1/invoices', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(moyasarKey + ':')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.priceAmount,
      currency: 'SAR',
      description: `Senda ${params.plan} Plan - ${params.orgName}`,
      callback_url: params.successUrl,
      metadata: {
        organization_id: params.organizationId,
        plan: params.plan,
      },
    }),
  })

  const invoice = await response.json()

  if (!response.ok) {
    logEvent(FN, 'error', 'Moyasar checkout error', { error: invoice.message, orgId: params.organizationId })
    return jsonResponse({ error: invoice.message || 'Moyasar error' }, 400, cors)
  }

  logEvent(FN, 'info', 'Moyasar checkout created', { invoiceId: invoice.id, orgId: params.organizationId })

  return jsonResponse({
    checkout_url: invoice.url,
    invoice_id: invoice.id,
    provider: 'moyasar',
  }, 200, cors)
}


function jsonResponse(data: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
