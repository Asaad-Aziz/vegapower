// Snapchat Pixel (Client-side Event Tracking)

declare global {
  interface Window {
    snaptr?: (
      action: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
  }
}

export const SNAP_PIXEL_ID = '7194561a-4b0b-4ac8-a5d3-b13f7ea452b5'

export const snapPageView = () => {
  if (typeof window !== 'undefined' && window.snaptr) {
    window.snaptr('track', 'PAGE_VIEW')
  }
}

export const snapPurchase = (params: {
  price: number
  currency: string
  item_ids?: string[]
  transaction_id?: string
}) => {
  if (typeof window !== 'undefined' && window.snaptr) {
    window.snaptr('track', 'PURCHASE', {
      price: params.price,
      currency: params.currency,
      ...(params.item_ids ? { item_ids: params.item_ids } : {}),
      ...(params.transaction_id ? { transaction_id: params.transaction_id } : {}),
    })
    console.log('Snapchat Pixel: PURCHASE event fired', params)
  } else {
    console.warn('Snapchat Pixel: snaptr not available')
  }
}
