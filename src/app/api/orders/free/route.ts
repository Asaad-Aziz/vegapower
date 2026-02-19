import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendPurchaseEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, productId, discountCode } = body

    if (!email || !productId) {
      return NextResponse.json(
        { success: false, error: 'Missing email or product ID' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()

    // Get product and verify it's actually free
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 },
      )
    }

    if (product.price_sar > 0) {
      return NextResponse.json(
        { success: false, error: 'This product is not free' },
        { status: 400 },
      )
    }

    const freeOrderId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    // Check for duplicate (same email + product in last minute to prevent spam)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const { data: recentOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_email', email)
      .eq('amount_sar', 0)
      .gte('created_at', oneMinuteAgo)
      .limit(1)
      .maybeSingle()

    if (recentOrder) {
      // Already ordered recently, still return success with product info
      return NextResponse.json({
        success: true,
        paymentId: freeOrderId,
        productTitle: product.title,
        productId: product.id,
        amount: 0,
        deliveryUrl: product.delivery_url,
        message: 'Order already placed recently',
      })
    }

    // Create the free order
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_email: email,
      amount_sar: 0,
      status: 'paid',
      moyasar_payment_id: freeOrderId,
      discount_code: discountCode || null,
    })

    if (orderError) {
      console.error('Failed to create free order:', orderError)
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 },
      )
    }

    // Increment times_bought
    await supabase
      .from('product')
      .update({ times_bought: (product.times_bought || 0) + 1 })
      .eq('id', product.id)

    // Send confirmation email
    if (email !== 'unknown@email.com') {
      await sendPurchaseEmail({
        to: email,
        productTitle: product.title,
        deliveryUrl: product.delivery_url,
        amount: 0,
      })
    }

    return NextResponse.json({
      success: true,
      paymentId: freeOrderId,
      productTitle: product.title,
      productId: product.id,
      amount: 0,
      deliveryUrl: product.delivery_url,
    })
  } catch (error) {
    console.error('Free order error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process free order' },
      { status: 500 },
    )
  }
}
