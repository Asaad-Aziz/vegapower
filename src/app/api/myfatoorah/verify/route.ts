import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { decryptPaymentData } from '@/lib/myfatoorah'
import { sendPurchaseEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentData, encryptionKey, email, productId } = body

    if (!paymentData || !encryptionKey) {
      return NextResponse.json(
        { success: false, error: 'Missing payment data or encryption key' },
        { status: 400 },
      )
    }

    // Decrypt the payment data
    const decrypted = decryptPaymentData(paymentData, encryptionKey)

    if (!decrypted) {
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt payment data' },
        { status: 500 },
      )
    }

    console.log('MyFatoorah decrypted payment:', JSON.stringify(decrypted, null, 2))

    // Check if payment was successful
    if (decrypted.Invoice.Status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: `Payment status is ${decrypted.Invoice.Status}, not PAID` },
        { status: 400 },
      )
    }

    if (decrypted.Transaction.Status !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: `Transaction status is ${decrypted.Transaction.Status}` },
        { status: 400 },
      )
    }

    const supabase = createServerClient()
    const mfPaymentId = `mf_${decrypted.Invoice.Id}`
    const paidAmount = parseFloat(decrypted.Amount.ValueInBaseCurrency)
    const buyerEmail = email || decrypted.Customer.Email || 'unknown@email.com'

    // Check if payment already processed
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, status')
      .eq('moyasar_payment_id', mfPaymentId)
      .single()

    if (existingOrder) {
      // Already processed - try to find product by ID or fallback
      let product = null
      if (productId) {
        const { data } = await supabase
          .from('product')
          .select('id, title, delivery_url, price_sar')
          .eq('id', productId)
          .single()
        product = data
      }
      if (!product) {
        const { data } = await supabase
          .from('product')
          .select('id, title, delivery_url, price_sar')
          .limit(1)
          .single()
        product = data
      }

      return NextResponse.json({
        success: existingOrder.status === 'paid',
        paymentId: mfPaymentId,
        productTitle: product?.title,
        productId: product?.id,
        amount: product?.price_sar,
        deliveryUrl: existingOrder.status === 'paid' ? product?.delivery_url : undefined,
        message: 'Order already processed',
      })
    }

    // Get product details by ID or fallback
    let product = null
    if (productId) {
      const { data } = await supabase
        .from('product')
        .select('*')
        .eq('id', productId)
        .single()
      product = data
    }
    if (!product) {
      const { data } = await supabase
        .from('product')
        .select('*')
        .limit(1)
        .single()
      product = data
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 500 },
      )
    }

    // Create order
    const { error: orderError } = await supabase.from('orders').insert({
      buyer_email: buyerEmail,
      amount_sar: paidAmount,
      status: 'paid',
      moyasar_payment_id: mfPaymentId,
    })

    if (orderError) {
      if (orderError.code === '23505') {
        // Duplicate - already processed
        return NextResponse.json({
          success: true,
          paymentId: mfPaymentId,
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
        { status: 500 },
      )
    }

    // Increment times_bought on the product
    await supabase
      .from('product')
      .update({ times_bought: (product.times_bought || 0) + 1 })
      .eq('id', product.id)

    // Send confirmation email
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
      paymentId: mfPaymentId,
      productTitle: product.title,
      productId: product.id,
      amount: product.price_sar,
      deliveryUrl: product.delivery_url,
    })
  } catch (error) {
    console.error('MyFatoorah verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 },
    )
  }
}
