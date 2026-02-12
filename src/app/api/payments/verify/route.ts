import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyMoyasarPayment, halalasToSar } from '@/lib/moyasar'
import { getTamaraOrder } from '@/lib/tamara'
import { sendPurchaseEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('paymentId')
  const isTamara = searchParams.get('tamara') === 'true'
  const orderRef = searchParams.get('order_ref')

  // Handle Tamara payments
  if (isTamara && orderRef) {
    return handleTamaraVerification(orderRef)
  }

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
    .select('id, status')
    .eq('moyasar_payment_id', paymentId)
    .single()

  if (existingOrder) {
    // Payment already processed, fetch product details
    const { data: product } = await supabase
      .from('product')
      .select('id, title, delivery_url, price_sar')
      .single()

    return NextResponse.json({
      success: existingOrder.status === 'paid',
      productTitle: product?.title,
      productId: product?.id,
      amount: product?.price_sar,
      deliveryUrl: existingOrder.status === 'paid' ? product?.delivery_url : undefined,
      message: existingOrder.status === 'paid' ? 'Order already processed' : 'Payment not completed',
      error: existingOrder.status !== 'paid' ? 'Payment was not completed' : undefined,
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
        productId: product.id,
        amount: product.price_sar,
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

  // Increment times_bought on the product
  await supabase
    .from('product')
    .update({ times_bought: (product.times_bought || 0) + 1 })
    .eq('id', product.id)

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
    productId: product.id,
    amount: product.price_sar,
    deliveryUrl: product.delivery_url,
  })
}

// Handle Tamara payment verification
async function handleTamaraVerification(orderRef: string) {
  const supabase = createServerClient()

  // Check if order exists
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, tamara_order_id, buyer_email')
    .eq('order_reference_id', orderRef)
    .single()

  // Get product details
  const { data: product } = await supabase
    .from('product')
    .select('id, title, delivery_url, price_sar')
    .single()

  if (!product) {
    return NextResponse.json(
      { success: false, error: 'Product not found' },
      { status: 500 }
    )
  }

  // If order is already paid, return success
  if (existingOrder?.status === 'paid') {
    return NextResponse.json({
      success: true,
      productTitle: product.title,
      productId: product.id,
      amount: product.price_sar,
      deliveryUrl: product.delivery_url,
      message: 'Order already processed',
    })
  }

  // If order exists but not paid, check with Tamara
  if (existingOrder?.tamara_order_id) {
    const tamaraOrder = await getTamaraOrder(existingOrder.tamara_order_id)
    
    if (tamaraOrder && tamaraOrder.status === 'fully_captured') {
      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('order_reference_id', orderRef)

      // Send email if not already sent
      if (existingOrder.buyer_email && existingOrder.buyer_email !== 'unknown@email.com') {
        await sendPurchaseEmail({
          to: existingOrder.buyer_email,
          productTitle: product.title,
          deliveryUrl: product.delivery_url,
          amount: product.price_sar,
        })
      }

      return NextResponse.json({
        success: true,
        productTitle: product.title,
        productId: product.id,
        amount: product.price_sar,
        deliveryUrl: product.delivery_url,
      })
    }

    // Payment not yet captured - may still be processing
    if (tamaraOrder && (tamaraOrder.status === 'approved' || tamaraOrder.status === 'authorised')) {
      return NextResponse.json({
        success: false,
        error: 'جاري معالجة الدفع. يرجى الانتظار قليلاً ثم تحديث الصفحة.',
        status: 'processing',
      })
    }
  }

  // Order not found or payment failed
  return NextResponse.json({
    success: false,
    error: 'لم يتم العثور على الطلب أو فشل الدفع',
  })
}
