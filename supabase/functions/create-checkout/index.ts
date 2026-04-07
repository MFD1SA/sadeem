// ============================================================================
// SENDA — Create Checkout Session Edge Function
//
// Called by subscriber frontend with JWT.
// Creates a payment checkout session with the configured gateway.
// Returns checkout URL to redirect user.
//
// SECRETS: STRIPE_SECRET_KEY, MOYASAR_SECRET_KEY, GATEWAY_PROVIDER, APP_URL
//
// Deploy: supabase functions deploy create-checkout
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, makeCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: makeCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401, req)
    }

    const body = await req.json()
    const { organization_id, plan } = body

    if (!organization_id || !plan) {
      return jsonResponse({ error: 'organization_id and plan are required' }, 400, req)
    }

    // --- Authenticate caller and get user ID ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401, req)
    }

    // --- Verify caller owns the organization (explicit user_id binding) ---
    const { data: membership } = await callerClient
      .from('memberships')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || membership.role !== 'owner') {
      return jsonResponse({ error: 'Only organization owner can create checkout' }, 403, req)
    }

    // --- Get org details for metadata ---
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceKey)

    const { data: org } = await serviceClient
      .from('organizations')
      .select('name, slug')
      .eq('id', organization_id)
      .single()

    const provider = Deno.env.get('GATEWAY_PROVIDER') || 'stripe'

    // --- Resolve app origin for redirects (never use SUPABASE_URL) ---
    const appUrl = Deno.env.get('APP_URL')
      || Deno.env.get('PUBLIC_SITE_URL')
      || req.headers.get('origin')
    if (!appUrl) {
      return jsonResponse({ error: 'APP_URL not configured' }, 500, req)
    }
    const successUrl = `${appUrl}/dashboard?payment=success`
    const cancelUrl = `${appUrl}/dashboard?payment=cancelled`

    // --- Plan pricing (SAR) ---
    const PLAN_PRICES: Record<string, number> = {
      starter: 99,
      growth: 299,
      pro: 699,
      enterprise: 1499,
    }
    const price = PLAN_PRICES[plan]
    if (!price) {
      return jsonResponse({ error: 'Invalid plan' }, 400, req)
    }

    if (provider === 'stripe') {
      return await createStripeCheckout(req, {
        organizationId: organization_id,
        orgName: org?.name || 'Senda Customer',
        plan,
        priceAmount: price * 100, // SAR to halalas
        successUrl,
        cancelUrl,
      })
    }

    if (provider === 'moyasar') {
      return await createMoyasarCheckout(req, {
        organizationId: organization_id,
        orgName: org?.name || 'Senda Customer',
        plan,
        priceAmount: price * 100, // SAR to halalas for Moyasar
        successUrl,
      })
    }

    return jsonResponse({ error: 'No payment gateway configured' }, 500, req)

  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500, req)
  }
})


async function createStripeCheckout(req: Request, params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
  cancelUrl: string
}) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return jsonResponse({ error: 'Stripe not configured' }, 500, req)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
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
    return jsonResponse({ error: session.error?.message || 'Stripe error' }, 400, req)
  }

  return jsonResponse({
    checkout_url: session.url,
    session_id: session.id,
    provider: 'stripe',
  }, 200, req)
}


async function createMoyasarCheckout(req: Request, params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
}) {
  const moyasarKey = Deno.env.get('MOYASAR_SECRET_KEY')
  if (!moyasarKey) {
    return jsonResponse({ error: 'Moyasar not configured' }, 500, req)
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
    return jsonResponse({ error: invoice.message || 'Moyasar error' }, 400, req)
  }

  return jsonResponse({
    checkout_url: invoice.url,
    invoice_id: invoice.id,
    provider: 'moyasar',
  }, 200, req)
}


function jsonResponse(data: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...(req ? makeCorsHeaders(req) : corsHeaders), 'Content-Type': 'application/json' },
  })
}
