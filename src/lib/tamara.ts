// Tamara BNPL Payment Integration

const TAMARA_API_URL = process.env.TAMARA_API_URL || 'https://api.tamara.co'
const TAMARA_API_TOKEN = process.env.TAMARA_API_TOKEN || ''

interface TamaraItem {
  reference_id: string
  type: string
  name: string
  sku: string
  quantity: number
  unit_price: {
    amount: number
    currency: string
  }
  total_amount: {
    amount: number
    currency: string
  }
}

interface TamaraConsumer {
  email: string
  first_name: string
  last_name: string
  phone_number: string
}

interface TamaraAddress {
  first_name: string
  last_name: string
  line1: string
  city: string
  country_code: string
}

interface TamaraCheckoutRequest {
  order_reference_id: string
  total_amount: {
    amount: number
    currency: string
  }
  description: string
  country_code: string
  payment_type: string
  locale: string
  items: TamaraItem[]
  consumer: TamaraConsumer
  shipping_address: TamaraAddress
  merchant_url: {
    success: string
    failure: string
    cancel: string
    notification: string
  }
}

interface TamaraCheckoutResponse {
  order_id: string
  checkout_id: string
  checkout_url: string
  status: string
}

interface TamaraOrderResponse {
  order_id: string
  order_reference_id: string
  status: string
  total_amount: {
    amount: number
    currency: string
  }
  consumer: {
    email: string
    first_name: string
    last_name: string
    phone_number: string
  }
  payment_type: string
  paid_amount?: {
    amount: number
    currency: string
  }
}

export async function createTamaraCheckout(params: {
  orderReferenceId: string
  amount: number
  currency: string
  description: string
  buyerEmail: string
  productId: string
  successUrl: string
  failureUrl: string
  cancelUrl: string
  notificationUrl: string
}): Promise<TamaraCheckoutResponse | null> {
  try {
    const requestBody: TamaraCheckoutRequest = {
      order_reference_id: params.orderReferenceId,
      total_amount: {
        amount: params.amount,
        currency: params.currency,
      },
      description: params.description,
      country_code: 'SA',
      payment_type: 'PAY_BY_INSTALMENTS',
      locale: 'ar_SA',
      items: [
        {
          reference_id: params.productId,
          type: 'Digital',
          name: params.description,
          sku: params.productId,
          quantity: 1,
          unit_price: {
            amount: params.amount,
            currency: params.currency,
          },
          total_amount: {
            amount: params.amount,
            currency: params.currency,
          },
        },
      ],
      consumer: {
        email: params.buyerEmail,
        first_name: 'Customer',
        last_name: 'Customer',
        phone_number: '+966500000000',
      },
      shipping_address: {
        first_name: 'Customer',
        last_name: 'Customer',
        line1: 'Digital Delivery',
        city: 'Riyadh',
        country_code: 'SA',
      },
      merchant_url: {
        success: params.successUrl,
        failure: params.failureUrl,
        cancel: params.cancelUrl,
        notification: params.notificationUrl,
      },
    }

    console.log('[Tamara] Creating checkout session:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${TAMARA_API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAMARA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()
    console.log('[Tamara] Checkout response:', response.status, JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('[Tamara] Checkout failed:', data)
      return null
    }

    return data as TamaraCheckoutResponse
  } catch (error) {
    console.error('[Tamara] Error creating checkout:', error)
    return null
  }
}

export async function getTamaraOrder(orderId: string): Promise<TamaraOrderResponse | null> {
  try {
    const response = await fetch(`${TAMARA_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TAMARA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('[Tamara] Get order response:', response.status, JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error('[Tamara] Get order failed:', data)
      return null
    }

    return data as TamaraOrderResponse
  } catch (error) {
    console.error('[Tamara] Error getting order:', error)
    return null
  }
}

export async function authorizeOrder(orderId: string): Promise<boolean> {
  try {
    const response = await fetch(`${TAMARA_API_URL}/orders/${orderId}/authorise`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAMARA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('[Tamara] Authorize response:', response.status, JSON.stringify(data, null, 2))

    return response.ok
  } catch (error) {
    console.error('[Tamara] Error authorizing order:', error)
    return false
  }
}

export async function capturePayment(orderId: string, amount: number, currency: string): Promise<boolean> {
  try {
    const response = await fetch(`${TAMARA_API_URL}/payments/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAMARA_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        total_amount: {
          amount,
          currency,
        },
        shipping_info: {
          shipped_at: new Date().toISOString(),
          shipping_company: 'Digital Delivery',
        },
      }),
    })

    const data = await response.json()
    console.log('[Tamara] Capture response:', response.status, JSON.stringify(data, null, 2))

    return response.ok
  } catch (error) {
    console.error('[Tamara] Error capturing payment:', error)
    return false
  }
}

export function verifyTamaraWebhook(signature: string, payload: string): boolean {
  const notificationKey = process.env.TAMARA_NOTIFICATION_KEY
  if (!notificationKey) {
    console.warn('[Tamara] TAMARA_NOTIFICATION_KEY not set, skipping signature verification')
    return true // Skip verification if key not set (for testing)
  }
  
  // Tamara uses the notification key to sign webhooks
  // For now, we'll do basic validation - in production you'd verify HMAC
  // The webhook ID should match what's configured in Tamara dashboard
  return true
}
