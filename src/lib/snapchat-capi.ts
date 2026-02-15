// Snapchat Conversions API (CAPI)
// Docs: https://marketingapi.snapchat.com/docs/conversion.html

import crypto from 'crypto'

const SNAP_PIXEL_ID = '7194561a-4b0b-4ac8-a5d3-b13f7ea452b5'
const SNAP_CAPI_URL = `https://tr.snapchat.com/v3/${SNAP_PIXEL_ID}/events`

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface SnapchatPurchaseEvent {
  email: string
  ipAddress?: string
  userAgent?: string
  eventSourceUrl?: string
  value: number
  currency: string
  plan: string
  paymentId?: string
}

/**
 * Send a PURCHASE conversion event to Snapchat CAPI.
 * Called server-side after a successful payment.
 */
export async function trackSnapchatPurchase(params: SnapchatPurchaseEvent): Promise<void> {
  const accessToken = process.env.SNAPCHAT_CAPI_ACCESS_TOKEN
  if (!accessToken) {
    console.log('Snapchat CAPI: SNAPCHAT_CAPI_ACCESS_TOKEN not configured, skipping')
    return
  }

  try {
    const hashedEmail = sha256(params.email)
    const eventId = params.paymentId || `purchase_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const payload = {
      data: [
        {
          event_name: 'PURCHASE',
          action_source: 'website',
          event_source_url: params.eventSourceUrl || 'https://vegapowerstore.com/app',
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            em: [hashedEmail],
            ...(params.userAgent ? { user_agent: params.userAgent } : {}),
            ...(params.ipAddress ? { client_ip_address: params.ipAddress } : {}),
          },
          custom_data: {
            event_id: eventId,
            value: String(params.value),
            currency: params.currency,
            content_ids: [`vegapower_${params.plan}`],
            content_category: ['subscription'],
            number_items: ['1'],
          },
        },
      ],
    }

    const response = await fetch(`${SNAP_CAPI_URL}?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log('Snapchat CAPI: PURCHASE event sent successfully', {
        email: params.email,
        value: params.value,
        plan: params.plan,
      })
    } else {
      const errorText = await response.text()
      console.error('Snapchat CAPI: Failed to send event', {
        status: response.status,
        error: errorText,
      })
    }
  } catch (error) {
    console.error('Snapchat CAPI: Error sending event', error)
  }
}
