// Meta (Facebook) Pixel Tracking

declare global {
  interface Window {
    fbq: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
    _fbq: unknown
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

// Initialize pixel (called once on app load)
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView')
  }
}

// Standard Events for E-commerce

// When someone views a product
export const viewContent = (params: {
  content_name: string
  content_ids: string[]
  content_type: string
  value: number
  currency: string
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', params)
  }
}

// When someone starts checkout
export const initiateCheckout = (params: {
  content_ids: string[]
  content_type: string
  value: number
  currency: string
  num_items: number
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', params)
  }
}

// When someone adds payment info
export const addPaymentInfo = (params: {
  content_ids: string[]
  content_type: string
  value: number
  currency: string
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', params)
  }
}

// When someone completes a purchase - THIS IS THE CONVERSION EVENT
export const purchase = (params: {
  content_name: string
  content_ids: string[]
  content_type: string
  value: number
  currency: string
  num_items: number
}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', params)
  }
}

// Custom event for tracking specific actions
export const trackCustom = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params)
  }
}
