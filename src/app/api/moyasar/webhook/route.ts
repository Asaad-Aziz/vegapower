import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { halalasToSar } from '@/lib/moyasar'
import { sendPurchaseEmail } from '@/lib/email'

// Webhook backup - processes payment notifications from Moyasar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Moyasar webhook payload
    const { id: paymentId, status, amount, metadata } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
    }

    // Only process paid payments
    if (status !== 'paid') {
      return NextResponse.json({ message: 'Payment not paid, skipping' })
    }

    const supabase = createServerClient()

    // Check if already processed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('moyasar_payment_id', paymentId)
      .single()

    if (existingOrder) {
      return NextResponse.json({ message: 'Order already exists' })
    }

    // Get product details
    const { data: product } = await supabase
      .from('product')
      .select('*')
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 500 })
    }

    const paidAmount = halalasToSar(amount)
    const buyerEmail = metadata?.buyer_email || 'unknown@email.com'

    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_email: buyerEmail,
        amount_sar: paidAmount,
        status: 'paid',
        moyasar_payment_id: paymentId,
        discount_code: metadata?.discount_code || null,
      })

    if (orderError && orderError.code !== '23505') {
      console.error('Webhook order creation failed:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Increment times_bought on the product (only if order was newly created)
    if (!orderError) {
      await supabase
        .from('product')
        .update({ times_bought: (product.times_bought || 0) + 1 })
        .eq('id', product.id)
    }

    // Send email if we have a valid email
    if (buyerEmail !== 'unknown@email.com') {
      await sendPurchaseEmail({
        to: buyerEmail,
        productTitle: product.title,
        deliveryUrl: product.delivery_url,
        amount: paidAmount,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

