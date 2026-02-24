import { NextRequest, NextResponse } from 'next/server'
import { createTamaraCheckout } from '@/lib/tamara'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, amount, plan, discountCode, authMethod, appleFirebaseUid } = body

    if (!email || !amount) {
      return NextResponse.json({ error: 'Email and amount are required' }, { status: 400 })
    }

    const orderReferenceId = `vp-app-${randomUUID()}`
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vegapowerstore.com').replace(/\/+$/, '')

    const successUrl = `${baseUrl}/app/success?source=tamara&order_ref=${orderReferenceId}&email=${encodeURIComponent(email)}&plan=${plan || 'yearly'}&amount=${amount}&authMethod=${authMethod || 'email'}${discountCode ? `&discountCode=${discountCode}` : ''}${appleFirebaseUid ? `&appleFirebaseUid=${appleFirebaseUid}` : ''}`

    const checkout = await createTamaraCheckout({
      orderReferenceId,
      amount,
      currency: 'SAR',
      description: 'Vega Power App - اشتراك سنوي',
      buyerEmail: email,
      productId: 'app_yearly',
      successUrl,
      failureUrl: `${baseUrl}/app?payment=failed`,
      cancelUrl: `${baseUrl}/app?payment=cancelled`,
      notificationUrl: `${baseUrl}/api/tamara/webhook`,
    })

    if (!checkout) {
      return NextResponse.json({ error: 'Failed to create Tamara checkout' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
      orderId: checkout.order_id,
      orderReferenceId,
    })
  } catch (error) {
    console.error('[Tamara App Checkout] Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
