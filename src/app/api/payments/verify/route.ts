import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyMoyasarPayment, halalasToSar } from '@/lib/moyasar'
import { sendPurchaseEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('paymentId')

  if (!paymentId) {
    return NextResponse.json(
      { success: false, error: 'Payment ID is required' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // Check if payment has already been processed
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('moyasar_payment_id', paymentId)
    .single()

  if (existingOrder) {
    // Payment already processed, fetch product details
    const { data: product } = await supabase
      .from('product')
      .select('title, delivery_url')
      .single()

    return NextResponse.json({
      success: true,
      productTitle: product?.title,
      deliveryUrl: product?.delivery_url,
      message: 'Order already processed',
    })
  }

  // Verify payment with Moyasar
  const payment = await verifyMoyasarPayment(paymentId)

  if (!payment) {
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment with Moyasar' },
      { status: 500 }
    )
  }

  // Check payment status
  if (payment.status !== 'paid') {
    return NextResponse.json(
      { success: false, error: `Payment status is ${payment.status}, not paid` },
      { status: 400 }
    )
  }

  // Get product to verify amount
  const { data: product, error: productError } = await supabase
    .from('product')
    .select('*')
    .single()

  if (productError || !product) {
    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 500 }
    )
  }

  // Verify amount matches (convert halalas to SAR)
  const paidAmount = halalasToSar(payment.amount)
  if (paidAmount !== product.price_sar) {
    console.error(`Amount mismatch: paid ${paidAmount}, expected ${product.price_sar}`)
    return NextResponse.json(
      { success: false, error: 'Payment amount does not match product price' },
      { status: 400 }
    )
  }

  // Extract buyer email from metadata
  const buyerEmail = (payment as unknown as { metadata?: { buyer_email?: string } }).metadata?.buyer_email || 'unknown@email.com'

  // Create order
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_email: buyerEmail,
      amount_sar: paidAmount,
      status: 'paid',
      moyasar_payment_id: paymentId,
    })

  if (orderError) {
    // Check if it's a duplicate (race condition)
    if (orderError.code === '23505') {
      return NextResponse.json({
        success: true,
        productTitle: product.title,
        deliveryUrl: product.delivery_url,
        message: 'Order already processed',
      })
    }

    console.error('Failed to create order:', orderError)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }

  // Send confirmation email (METHOD C - always on)
  if (buyerEmail !== 'unknown@email.com') {
    await sendPurchaseEmail({
      to: buyerEmail,
      productTitle: product.title,
      deliveryUrl: product.delivery_url,
      amount: paidAmount,
    })
  }

  return NextResponse.json({
    success: true,
    productTitle: product.title,
    deliveryUrl: product.delivery_url,
  })
}

