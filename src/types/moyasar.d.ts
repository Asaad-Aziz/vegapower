export interface MoyasarConfig {
  element: string
  amount: number
  currency: string
  description: string
  publishable_api_key: string
  callback_url: string
  methods: string[]
  on_completed?: (payment: { id: string }) => void
  metadata?: Record<string, string>
  apple_pay?: {
    label: string
    validate_merchant_url: string
    country: string
  }
}

declare global {
  interface Window {
    Moyasar: {
      init: (config: MoyasarConfig) => void
    }
  }
}

