// Meta (Facebook) Pixel Tracking

declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
    _fbq?: unknown
  }
}

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

// Helper function to wait for fbq to be available
const waitForFbq = (maxAttempts = 50): Promise<boolean> => {
  return new Promise((resolve) => {
    let attempts = 0
    const checkFbq = () => {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        resolve(true)
        return
      }
      attempts++
      if (attempts >= maxAttempts) {
        console.warn('Meta Pixel (fbq) not loaded after waiting')
        resolve(false)
        return
      }
      setTimeout(checkFbq, 100) // Check every 100ms
    }
    checkFbq()
  })
}

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
export const initiateCheckout = async (params: {
  content_ids: string[]
  content_type: string
  value: number
  currency: string
  num_items: number
}) => {
  const fbqReady = await waitForFbq()
  if (fbqReady && window.fbq) {
    window.fbq('track', 'InitiateCheckout', params)
    console.log('Meta Pixel: InitiateCheckout event fired', params)
  }
}

// When someone adds payment info
export const addPaymentInfo = async (params: {
  content_ids: string[]
  content_type: string
  value: number
  currency: string
}) => {
  const fbqReady = await waitForFbq()
  if (fbqReady && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', params)
    console.log('Meta Pixel: AddPaymentInfo event fired', params)
  }
}

// When someone completes a purchase - THIS IS THE CONVERSION EVENT
export const purchase = async (params: {
  content_name: string
  content_ids: string[]
  content_type: string
  value: number
  currency: string
  num_items: number
}) => {
  const fbqReady = await waitForFbq()
  if (fbqReady && window.fbq) {
    window.fbq('track', 'Purchase', params)
    console.log('Meta Pixel: Purchase event fired', params)
  } else {
    console.error('Meta Pixel: Failed to fire Purchase event - fbq not available')
  }
}

// Custom event for tracking specific actions
export const trackCustom = async (eventName: string, params?: Record<string, unknown>) => {
  const fbqReady = await waitForFbq()
  if (fbqReady && window.fbq) {
    window.fbq('trackCustom', eventName, params)
  }
}
