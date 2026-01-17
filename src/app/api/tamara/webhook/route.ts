import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getTamaraOrder, capturePayment } from '@/lib/tamara'
import { sendPurchaseEmail } from '@/lib/email'

// Tamara webhook events
type TamaraEventType = 
  | 'order_approved'
  | 'order_declined'
  | 'order_authorised'
  | 'order_captured'
  | 'order_canceled'
  | 'order_expired'

interface TamaraWebhookPayload {
  order_id: string
  order_reference_id: string
  event_type: TamaraEventType
  data?: {
    order_id?: string
    status?: string
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[Tamara Webhook ${timestamp}] ========== NEW WEBHOOK ==========`)

  try {
    // Log headers for debugging
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log(`[Tamara Webhook ${timestamp}] Headers:`, JSON.stringify(headers, null, 2))

    // Parse body
    const rawBody = await request.text()
    console.log(`[Tamara Webhook ${timestamp}] Raw body:`, rawBody)

    let payload: TamaraWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error(`[Tamara Webhook ${timestamp}] Invalid JSON`)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log(`[Tamara Webhook ${timestamp}] Event type:`, payload.event_type)
    console.log(`[Tamara Webhook ${timestamp}] Order ID:`, payload.order_id)
    console.log(`[Tamara Webhook ${timestamp}] Order Reference:`, payload.order_reference_id)

    const supabase = createServerClient()

    // Handle different event types
    switch (payload.event_type) {
      case 'order_approved': {
        // Customer approved the payment, now we need to authorize it
        console.log(`[Tamara Webhook ${timestamp}] Order approved, processing...`)
        
        // Get order details from Tamara
        const tamaraOrder = await getTamaraOrder(payload.order_id)
        if (!tamaraOrder) {
          console.error(`[Tamara Webhook ${timestamp}] Failed to get Tamara order`)
          return NextResponse.json({ error: 'Failed to get order' }, { status: 500 })
        }

        // Capture the payment (for digital goods, we capture immediately)
        const captured = await capturePayment(
          payload.order_id,
          tamaraOrder.total_amount.amount,
          tamaraOrder.total_amount.currency
        )

        if (!captured) {
          console.error(`[Tamara Webhook ${timestamp}] Failed to capture payment`)
          return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 })
        }

        console.log(`[Tamara Webhook ${timestamp}] Payment captured successfully`)
        break
      }

      case 'order_captured': {
        // Payment has been captured, fulfill the order
        console.log(`[Tamara Webhook ${timestamp}] Order captured, fulfilling...`)

        // Get order details from Tamara
        const tamaraOrder = await getTamaraOrder(payload.order_id)
        if (!tamaraOrder) {
          console.error(`[Tamara Webhook ${timestamp}] Failed to get Tamara order`)
          return NextResponse.json({ error: 'Failed to get order' }, { status: 500 })
        }

        // Check if order already exists and is paid
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, status')
          .eq('tamara_order_id', payload.order_id)
          .single()

        if (existingOrder?.status === 'paid') {
          console.log(`[Tamara Webhook ${timestamp}] Order already fulfilled`)
          return NextResponse.json({ message: 'Order already fulfilled' })
        }

        // Get product details
        const { data: product } = await supabase
          .from('product')
          .select('*')
          .single()

        if (!product) {
          console.error(`[Tamara Webhook ${timestamp}] Product not found`)
          return NextResponse.json({ error: 'Product not found' }, { status: 500 })
        }

        const buyerEmail = tamaraOrder.consumer?.email || 'unknown@email.com'

        // Update or create order
        if (existingOrder) {
          // Update existing order
          const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('tamara_order_id', payload.order_id)

          if (updateError) {
            console.error(`[Tamara Webhook ${timestamp}] Failed to update order:`, updateError)
          }
        } else {
          // Create new order
          const { error: insertError } = await supabase
            .from('orders')
            .insert({
              buyer_email: buyerEmail,
              amount_sar: tamaraOrder.total_amount.amount,
              status: 'paid',
              moyasar_payment_id: `tamara_${payload.order_id}`,
              tamara_order_id: payload.order_id,
              order_reference_id: payload.order_reference_id,
            })

          if (insertError && insertError.code !== '23505') {
            console.error(`[Tamara Webhook ${timestamp}] Failed to create order:`, insertError)
          }
        }

        // Send confirmation email
        if (buyerEmail !== 'unknown@email.com') {
          await sendPurchaseEmail({
            to: buyerEmail,
            productTitle: product.title,
            deliveryUrl: product.delivery_url,
            amount: tamaraOrder.total_amount.amount,
          })
          console.log(`[Tamara Webhook ${timestamp}] Confirmation email sent to ${buyerEmail}`)
        }

        console.log(`[Tamara Webhook ${timestamp}] Order fulfilled successfully`)
        break
      }

      case 'order_declined':
      case 'order_canceled':
      case 'order_expired': {
        // Update order status to failed
        console.log(`[Tamara Webhook ${timestamp}] Order ${payload.event_type}`)

        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('tamara_order_id', payload.order_id)

        if (updateError) {
          console.error(`[Tamara Webhook ${timestamp}] Failed to update order status:`, updateError)
        }
        break
      }

      default:
        console.log(`[Tamara Webhook ${timestamp}] Unhandled event type: ${payload.event_type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[Tamara Webhook ${timestamp}] Error:`, error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
