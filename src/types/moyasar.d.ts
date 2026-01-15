export interface MoyasarPayment {
  id: string
  status: string
  amount: number
  source?: {
    type: string
    message?: string
  }
}

export interface MoyasarConfig {
  element: string
  amount: number
  currency: string
  description: string
  publishable_api_key: string
  callback_url: string
  methods: string[]
  supported_networks?: string[]
  on_completed?: (payment: MoyasarPayment) => void
  on_initiating?: () => void
  on_failure?: (error: { message: string; code?: string }) => void
  on_cancelled?: () => void
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

