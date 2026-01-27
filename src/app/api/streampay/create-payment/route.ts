import { NextRequest, NextResponse } from 'next/server'
import StreamSDK from '@streamsdk/typescript'

const plans = {
  monthly: { price: 45, period: 'شهر', productName: 'اشتراك شهري - Vega Power', days: 30 },
  quarterly: { price: 112, period: '3 أشهر', productName: 'اشتراك 3 أشهر - Vega Power', days: 90 },
  yearly: { price: 155, period: 'سنة', productName: 'اشتراك سنوي - Vega Power', days: 365 },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      plan, 
      email, 
      discountCode,
      discountPercent,
      finalPrice,
      userData 
    } = body

    // Validate required fields
    if (!plan || !email) {
      return NextResponse.json(
        { success: false, error: 'Plan and email are required' },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!['monthly', 'quarterly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan type' },
        { status: 400 }
      )
    }

    const selectedPlan = plans[plan as keyof typeof plans]
    const apiKey = process.env.STREAMPAY_API_KEY

    if (!apiKey) {
      console.error('STREAMPAY_API_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Initialize StreamPay SDK
    const client = StreamSDK.init(apiKey)

    // Calculate final price (use provided finalPrice or calculate)
    const price = finalPrice || (discountPercent 
      ? Math.round(selectedPlan.price * (1 - discountPercent / 100))
      : selectedPlan.price)

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vegapowerstore.com'

    // Create payment link with StreamPay SDK
    const result = await client.createSimplePaymentLink({
      name: `Vega Power App - ${selectedPlan.productName}`,
      amount: price,
      consumer: {
        email: email,
        name: email.split('@')[0], // Use email prefix as name if not provided
      },
      product: {
        name: selectedPlan.productName,
        price: price,
      },
      successRedirectUrl: `${baseUrl}/app/success?source=streampay`,
      failureRedirectUrl: `${baseUrl}/app?payment=failed`,
      // Store metadata for webhook processing
      // Note: StreamPay may have a different way to pass metadata
      // We'll encode it in the success URL as backup
    })

    // Create a session ID to track this payment
    const sessionId = `sp_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Store payment session data in a way the webhook can access
    // For now, we'll encode essential data in the success URL
    const successUrlWithParams = new URL(`${baseUrl}/app/success`)
    successUrlWithParams.searchParams.set('source', 'streampay')
    successUrlWithParams.searchParams.set('session', sessionId)
    successUrlWithParams.searchParams.set('email', email)
    successUrlWithParams.searchParams.set('plan', plan)
    successUrlWithParams.searchParams.set('amount', String(price))
    
    // Encode user data for the success page
    if (userData) {
      successUrlWithParams.searchParams.set('userData', encodeURIComponent(JSON.stringify(userData)))
    }
    if (discountCode) {
      successUrlWithParams.searchParams.set('discountCode', discountCode)
    }

    console.log('StreamPay payment link created:', {
      paymentUrl: result.paymentUrl,
      consumerId: result.consumerId,
      productId: result.productId,
      amount: price,
      plan,
      email,
    })

    return NextResponse.json({
      success: true,
      paymentUrl: result.paymentUrl,
      sessionId,
      consumerId: result.consumerId,
      productId: result.productId,
    })

  } catch (error) {
    console.error('StreamPay payment link creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
