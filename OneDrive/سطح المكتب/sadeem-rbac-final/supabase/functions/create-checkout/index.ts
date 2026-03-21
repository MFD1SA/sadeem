// ============================================================================
// SADEEM — Create Checkout Session Edge Function
//
// Called by subscriber frontend with JWT.
// Creates a payment checkout session with the configured gateway.
// Returns checkout URL to redirect user.
//
// SECRETS: STRIPE_SECRET_KEY, MOYASAR_SECRET_KEY, GATEWAY_PROVIDER
//
// Deploy: supabase functions deploy create-checkout
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json()
    const { organization_id, plan, success_url, cancel_url } = body

    if (!organization_id || !plan) {
      return jsonResponse({ error: 'organization_id and plan are required' }, 400)
    }

    // --- Verify caller owns the organization ---
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: membership } = await callerClient
      .from('memberships')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('status', 'active')
      .single()

    if (!membership || membership.role !== 'owner') {
      return jsonResponse({ error: 'Only organization owner can create checkout' }, 403)
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

    // --- Plan pricing (SAR) ---
    const PLAN_PRICES: Record<string, number> = {
      starter: 99,
      growth: 299,
      pro: 699,
      enterprise: 1499,
    }
    const price = PLAN_PRICES[plan]
    if (!price) {
      return jsonResponse({ error: 'Invalid plan' }, 400)
    }

    if (provider === 'stripe') {
      return await createStripeCheckout({
        organizationId: organization_id,
        orgName: org?.name || 'Sadeem Customer',
        plan,
        priceAmount: price * 100, // SAR to halalas
        successUrl: success_url || `${supabaseUrl}/dashboard?payment=success`,
        cancelUrl: cancel_url || `${supabaseUrl}/dashboard?payment=cancelled`,
      })
    }

    if (provider === 'moyasar') {
      return await createMoyasarCheckout({
        organizationId: organization_id,
        orgName: org?.name || 'Sadeem Customer',
        plan,
        priceAmount: price * 100, // SAR to halalas for Moyasar
        successUrl: success_url || `${supabaseUrl}/dashboard?payment=success`,
      })
    }

    return jsonResponse({ error: 'No payment gateway configured' }, 500)

  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500)
  }
})


async function createStripeCheckout(params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
  cancelUrl: string
}) {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return jsonResponse({ error: 'Stripe not configured' }, 500)
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
      'line_items[0][price_data][product_data][name]': `Sadeem ${params.plan} Plan`,
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
    return jsonResponse({ error: session.error?.message || 'Stripe error' }, 400)
  }

  return jsonResponse({
    checkout_url: session.url,
    session_id: session.id,
    provider: 'stripe',
  })
}


async function createMoyasarCheckout(params: {
  organizationId: string
  orgName: string
  plan: string
  priceAmount: number
  successUrl: string
}) {
  const moyasarKey = Deno.env.get('MOYASAR_SECRET_KEY')
  if (!moyasarKey) {
    return jsonResponse({ error: 'Moyasar not configured' }, 500)
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
      description: `Sadeem ${params.plan} Plan - ${params.orgName}`,
      callback_url: params.successUrl,
      metadata: {
        organization_id: params.organizationId,
        plan: params.plan,
      },
    }),
  })

  const invoice = await response.json()

  if (!response.ok) {
    return jsonResponse({ error: invoice.message || 'Moyasar error' }, 400)
  }

  return jsonResponse({
    checkout_url: invoice.url,
    invoice_id: invoice.id,
    provider: 'moyasar',
  })
}


function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
