import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getPaymentStatus } from '@/lib/myfatoorah'
import { sendPurchaseEmail } from '@/lib/email'

// MyFatoorah webhook - backup handler for payment notifications
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[MyFatoorah Webhook ${timestamp}] ========== NEW WEBHOOK ==========`)

  try {
    const body = await request.json()
    console.log(`[MyFatoorah Webhook ${timestamp}] Payload:`, JSON.stringify(body))

    // MyFatoorah webhook v2 sends payment status data
    const paymentId = body?.Data?.PaymentId || body?.PaymentId
    const invoiceId = body?.Data?.InvoiceId || body?.InvoiceId
    const invoiceStatus = body?.Data?.InvoiceStatus || body?.InvoiceStatus

    if (!invoiceId && !paymentId) {
      console.error(`[MyFatoorah Webhook ${timestamp}] Missing invoice/payment ID`)
      return NextResponse.json({ error: 'Missing invoice/payment ID' }, { status: 400 })
    }

    // Only process paid/successful payments
    if (invoiceStatus && invoiceStatus !== 'Paid') {
      console.log(`[MyFatoorah Webhook ${timestamp}] Invoice status: ${invoiceStatus}, skipping`)
      return NextResponse.json({ message: 'Payment not paid, skipping' })
    }

    const supabase = createServerClient()
    const mfPaymentId = `mf_${invoiceId}`

    // Check if already processed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('moyasar_payment_id', mfPaymentId)
      .single()

    if (existingOrder) {
      console.log(`[MyFatoorah Webhook ${timestamp}] Order already exists`)
      return NextResponse.json({ message: 'Order already exists' })
    }

    // Get full payment details from MyFatoorah API
    const paymentDetails = paymentId ? await getPaymentStatus(paymentId) : null

    // Get product details
    const { data: product } = await supabase.from('product').select('*').single()

    if (!product) {
      console.error(`[MyFatoorah Webhook ${timestamp}] Product not found`)
      return NextResponse.json({ error: 'Product not found' }, { status: 500 })
    }

    const buyerEmail =
      paymentDetails?.Data?.CustomerEmail ||
      body?.Data?.CustomerEmail ||
      'unknown@email.com'
    const paidAmount =
      paymentDetails?.Data?.InvoiceValue ||
      body?.Data?.InvoiceValue ||
      product.price_sar

    // Create order
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_email: buyerEmail,
      amount_sar: paidAmount,
      status: 'paid',
      moyasar_payment_id: mfPaymentId,
    })

    if (orderError && orderError.code !== '23505') {
      console.error(`[MyFatoorah Webhook ${timestamp}] Failed to create order:`, orderError)
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
    if (buyerEmail !== 'unknown@email.com' && !orderError) {
      await sendPurchaseEmail({
        to: buyerEmail,
        productTitle: product.title,
        deliveryUrl: product.delivery_url,
        amount: paidAmount,
      })
      console.log(`[MyFatoorah Webhook ${timestamp}] Email sent to ${buyerEmail}`)
    }

    console.log(`[MyFatoorah Webhook ${timestamp}] Order created successfully`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[MyFatoorah Webhook ${timestamp}] Error:`, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  )
}
