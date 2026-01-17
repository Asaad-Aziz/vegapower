import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createTamaraCheckout } from '@/lib/tamara'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, productId } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('*')
      .single()

    if (productError || !product) {
      console.error('[Tamara Checkout] Product not found:', productError)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Generate unique order reference
    const orderReferenceId = `vp-${randomUUID()}`

    // Get the app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vegapowerfitness.com'
    const baseUrl = appUrl.replace(/\/$/, '')

    // Create Tamara checkout session
    const checkout = await createTamaraCheckout({
      orderReferenceId,
      amount: product.price_sar,
      currency: 'SAR',
      description: product.title,
      buyerEmail: email,
      productId: product.id,
      successUrl: `${baseUrl}/success?tamara=true&order_ref=${orderReferenceId}`,
      failureUrl: `${baseUrl}/cancel?reason=payment_failed`,
      cancelUrl: `${baseUrl}/cancel?reason=cancelled`,
      notificationUrl: `${baseUrl}/api/tamara/webhook`,
    })

    if (!checkout) {
      return NextResponse.json(
        { error: 'Failed to create Tamara checkout session' },
        { status: 500 }
      )
    }

    // Store pending order in database
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_email: email,
        amount_sar: product.price_sar,
        status: 'pending',
        moyasar_payment_id: `tamara_${checkout.order_id}`, // Prefix to identify Tamara orders
        tamara_order_id: checkout.order_id,
        tamara_checkout_id: checkout.checkout_id,
        order_reference_id: orderReferenceId,
      })

    if (orderError) {
      console.error('[Tamara Checkout] Failed to create pending order:', orderError)
      // Continue anyway - webhook will create order if this fails
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkout.checkout_url,
      orderId: checkout.order_id,
      orderReferenceId,
    })
  } catch (error) {
    console.error('[Tamara Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
