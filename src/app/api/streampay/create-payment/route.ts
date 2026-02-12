import { NextRequest, NextResponse } from 'next/server'
import StreamSDK from '@streamsdk/typescript'

// Plan configurations with optional pre-made product IDs from StreamPay dashboard
const plans = {
  monthly: { 
    price: 45, 
    period: 'شهر', 
    productName: 'اشتراك شهري - Vega Power', 
    days: 30,
    // Set via STREAMPAY_PRODUCT_MONTHLY env var
  },
  quarterly: { 
    price: 92, 
    period: '3 أشهر', 
    productName: 'اشتراك 3 أشهر - Vega Power', 
    days: 90,
    // Set via STREAMPAY_PRODUCT_QUARTERLY env var
  },
  yearly: { 
    price: 187, 
    period: 'سنة', 
    productName: 'اشتراك سنوي - Vega Power', 
    days: 365,
    // Set via STREAMPAY_PRODUCT_YEARLY env var
  },
}

// Get product ID from environment variables
function getProductId(plan: string): string | null {
  const productIds: Record<string, string | undefined> = {
    monthly: process.env.STREAMPAY_PRODUCT_MONTHLY,
    quarterly: process.env.STREAMPAY_PRODUCT_QUARTERLY,
    yearly: process.env.STREAMPAY_PRODUCT_YEARLY,
  }
  return productIds[plan] || null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      plan, 
      email, 
      authMethod,
      appleFirebaseUid,
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
    const existingProductId = getProductId(plan)

    if (!apiKey) {
      console.error('STREAMPAY_API_KEY not configured')
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Log API key format (only first/last few chars for security)
    console.log('StreamPay API Key format:', {
      length: apiKey.length,
      prefix: apiKey.substring(0, 8) + '...',
      suffix: '...' + apiKey.substring(apiKey.length - 4),
    })
    console.log('Using existing product ID:', existingProductId || 'No (creating new product)')

    // Initialize StreamPay SDK
    const client = StreamSDK.init(apiKey)

    // Calculate final price (use provided finalPrice or calculate)
    const price = finalPrice || (discountPercent 
      ? Math.round(selectedPlan.price * (1 - discountPercent / 100))
      : selectedPlan.price)

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vegapowerstore.com'

    // Create a session ID to track this payment
    const sessionId = `sp_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Build success URL with all necessary data for account creation
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
    // Pass auth method info for the success page
    if (authMethod) {
      successUrlWithParams.searchParams.set('authMethod', authMethod)
    }
    if (appleFirebaseUid) {
      successUrlWithParams.searchParams.set('appleFirebaseUid', appleFirebaseUid)
    }
    // Add existing product ID if using dashboard products
    if (existingProductId) {
      successUrlWithParams.searchParams.set('streampayProductId', existingProductId)
    }

    let result: { paymentUrl: string; consumerId?: string; productId?: string; subscriptionId?: string }

    // Check if we should use existing product from StreamPay dashboard
    if (existingProductId) {
      // Use existing recurring product - create consumer first, then payment link
      // NOTE: Do NOT create subscription manually - StreamPay creates it automatically
      // when payment succeeds with a recurring product. The subscription ID will be
      // received via webhook (subscription_activated event).
      console.log('Creating payment with existing product:', existingProductId)
      
      // Create or get consumer with EMAIL as contact type
      let consumer: { id: string }
      
      try {
        consumer = await client.createConsumer({
          name: email.split('@')[0],
          email: email,
          contact_information_type: 'EMAIL',
        } as Parameters<typeof client.createConsumer>[0])
        console.log('Consumer created:', consumer.id)
      } catch (consumerError: unknown) {
        // Check if consumer already exists
        const errorBody = (consumerError as { body?: { error?: { code?: string } } })?.body
        if (errorBody?.error?.code === 'DUPLICATE_CONSUMER') {
          console.log('Consumer already exists, fetching existing consumer...')
          // List consumers and find by email
          const consumers = await client.listConsumers({ page: 1, size: 100 })
          const existingConsumer = consumers.data?.find(
            (c: { email?: string | null }) => c.email?.toLowerCase() === email.toLowerCase()
          )
          if (!existingConsumer) {
            throw new Error('Consumer exists but could not be found')
          }
          consumer = existingConsumer
          console.log('Found existing consumer:', consumer.id)
        } else {
          throw consumerError
        }
      }

      // Add consumer ID to success URL for tracking/cancellation
      successUrlWithParams.searchParams.set('streampayConsumerId', consumer.id)

      // Create payment link with existing recurring product
      // StreamPay will automatically create the subscription when payment succeeds
      console.log('Creating payment link with redirect URLs:', {
        success_redirect_url: successUrlWithParams.toString(),
        failure_redirect_url: `${baseUrl}/app?payment=failed`,
      })
      
      const paymentLink = await client.createPaymentLink({
        name: `Vega Power App - ${selectedPlan.productName}`,
        organization_consumer_id: consumer.id,
        items: [{ product_id: existingProductId, quantity: 1 }],
        success_redirect_url: successUrlWithParams.toString(),
        failure_redirect_url: `${baseUrl}/app?payment=failed`,
        contact_information_type: 'EMAIL', // Required for proper redirect handling
      })
      
      console.log('Payment link response:', JSON.stringify(paymentLink, null, 2))

      const paymentUrl = client.getPaymentUrl(paymentLink)

      if (!paymentUrl) {
        throw new Error('Failed to get payment URL from StreamPay')
      }

      result = {
        paymentUrl,
        consumerId: consumer.id,
        productId: existingProductId || undefined,
        // subscriptionId will be received via webhook after payment succeeds
      }
    } else {
      // Create new product on-the-fly (one-time payment)
      const simpleResult = await client.createSimplePaymentLink({
        name: `Vega Power App - ${selectedPlan.productName}`,
        amount: price,
        consumer: {
          email: email,
          name: email.split('@')[0],
        },
        product: {
          name: selectedPlan.productName,
          price: price,
        },
        successRedirectUrl: successUrlWithParams.toString(),
        failureRedirectUrl: `${baseUrl}/app?payment=failed`,
      })

      // Note: For simple payment links, consumer/product are created automatically
      // We need to update the success URL with the consumer ID
      if (simpleResult.consumerId) {
        // Re-create payment link with consumer ID in URL (or handle via webhook)
        console.log('Simple payment created with consumerId:', simpleResult.consumerId)
      }

      result = simpleResult
    }

    console.log('StreamPay payment link created:', {
      paymentUrl: result.paymentUrl,
      consumerId: result.consumerId,
      productId: result.productId,
      subscriptionId: result.subscriptionId,
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
      subscriptionId: result.subscriptionId,
    })

  } catch (error: unknown) {
    console.error('StreamPay payment link creation error:', error)
    
    // Extract error details for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as { status?: number })?.status,
      body: (error as { body?: unknown })?.body,
    }
    console.error('Error details:', JSON.stringify(errorDetails, null, 2))
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create payment link',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}
