// TikTok Events API (Server-side tracking)
// Docs: https://business-api.tiktok.com/portal/docs?id=1741601162187777

const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN
const TIKTOK_PIXEL_ID = 'D6KP463C77U9JTU036SG'
const TIKTOK_EVENTS_API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

interface TikTokEventParams {
  email: string
  value: number
  currency?: string
  contentId: string
  contentName?: string
}

async function sendEvent(eventName: string, params: TikTokEventParams) {
  if (!TIKTOK_ACCESS_TOKEN) {
    console.warn('TikTok Events API: TIKTOK_ACCESS_TOKEN not set, skipping')
    return
  }

  // Hash email with SHA256 for privacy
  const crypto = await import('crypto')
  const hashedEmail = crypto.createHash('sha256').update(params.email.toLowerCase().trim()).digest('hex')

  const payload = {
    pixel_code: TIKTOK_PIXEL_ID,
    event: eventName,
    event_id: `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    context: {
      user: {
        email: hashedEmail,
      },
    },
    properties: {
      contents: [
        {
          content_id: params.contentId,
          content_name: params.contentName || params.contentId,
          content_type: 'product',
          quantity: 1,
          price: params.value,
        },
      ],
      value: params.value,
      currency: params.currency || 'SAR',
    },
  }

  try {
    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        data: [payload],
      }),
    })

    const result = await response.json()
    if (result.code === 0) {
      console.log(`TikTok Events API: ${eventName} sent successfully`, { email: params.email, value: params.value })
    } else {
      console.error(`TikTok Events API: ${eventName} failed`, result)
    }
  } catch (error) {
    console.error(`TikTok Events API: ${eventName} error`, error)
  }
}

export async function ttServerCompletePayment(params: TikTokEventParams) {
  return sendEvent('CompletePayment', params)
}

export async function ttServerSubscribe(params: TikTokEventParams) {
  return sendEvent('Subscribe', params)
}
