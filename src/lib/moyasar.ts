// Moyasar API utilities

interface MoyasarPayment {
  id: string
  status: 'initiated' | 'paid' | 'failed' | 'authorized' | 'captured' | 'refunded' | 'voided'
  amount: number // Amount in halalas (SAR * 100)
  fee: number
  currency: string
  refunded: number
  description: string
  invoice_id: string | null
  ip: string | null
  callback_url: string
  created_at: string
  updated_at: string
  source: {
    type: string
    company: string
    name: string
    number: string
    message: string | null
    transaction_url: string | null
  }
}

export async function verifyMoyasarPayment(paymentId: string): Promise<MoyasarPayment | null> {
  const apiKey = process.env.MOYASAR_API_KEY
  
  if (!apiKey) {
    console.error('MOYASAR_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      },
    })

    if (!response.ok) {
      console.error('Moyasar API error:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to verify payment:', error)
    return null
  }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount)
}

export function halalasToSar(halalas: number): number {
  return halalas / 100
}

export function sarToHalalas(sar: number): number {
  return Math.round(sar * 100)
}

