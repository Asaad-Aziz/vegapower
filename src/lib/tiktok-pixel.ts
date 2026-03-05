// TikTok Pixel (Client-side Event Tracking)

declare global {
  interface Window {
    ttq?: {
      track: (eventName: string, params?: Record<string, unknown>) => void
      page: () => void
      identify: (params: Record<string, unknown>) => void
    }
  }
}

export const TIKTOK_PIXEL_ID = 'D6KP463C77U9JTU036SG'

export const ttPageView = () => {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.page()
  }
}

export const ttInitiateCheckout = (params: {
  content_id: string
  content_type: string
  value: number
  currency: string
}) => {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track('InitiateCheckout', {
      content_id: params.content_id,
      content_type: params.content_type,
      value: params.value,
      currency: params.currency,
    })
    console.log('TikTok Pixel: InitiateCheckout event fired', params)
  }
}

export const ttCompletePayment = (params: {
  content_id: string
  content_type: string
  value: number
  currency: string
}) => {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track('CompletePayment', {
      content_id: params.content_id,
      content_type: params.content_type,
      value: params.value,
      currency: params.currency,
    })
    console.log('TikTok Pixel: CompletePayment event fired', params)
  }
}

export const ttIdentify = (email: string) => {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.identify({ email })
  }
}
