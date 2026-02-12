// MyFatoorah API utilities
import { createDecipheriv } from 'crypto'

const getApiUrl = () => process.env.MYFATOORAH_API_URL || 'https://api-sa.myfatoorah.com'
const getApiKey = () => process.env.MYFATOORAH_API_KEY || ''

// ----- Types -----

export interface MyFatoorahSessionResponse {
  IsSuccess: boolean
  Message: string
  Data: {
    SessionId: string
    SessionExpiry: string
    EncryptionKey: string
    OperationType: string
    Order: {
      Amount: number
      Currency: string
      ExternalIdentifier: string | null
    }
  }
}

export interface MyFatoorahDecryptedPayment {
  Invoice: {
    Id: string
    Status: string // "PAID", "PENDING", etc.
    Reference: string
    CreationDate: string
    ExpirationDate: string
    ExternalIdentifier: string | null
    UserDefinedField: string
    MetaData: unknown
  }
  Transaction: {
    Id: string
    Status: string // "SUCCESS", "FAILED", etc.
    PaymentMethod: string
    PaymentId: string
    ReferenceId: string
    TrackId: string
    AuthorizationId: string
    TransactionDate: string
    Error: {
      Code: string
      Message: string
    }
    Card?: {
      Number: string
      Brand: string
    }
  }
  Customer: {
    Reference: string
    Name: string
    Mobile: string
    Email: string
  }
  Amount: {
    BaseCurrency: string
    ValueInBaseCurrency: string
    DisplayCurrency: string
    ValueInDisplayCurrency: string
    PayCurrency: string
    ValueInPayCurrency: string
  }
}

// ----- API Functions -----

/**
 * Create a new payment session with MyFatoorah
 */
export async function createPaymentSession(
  amount: number,
  customerEmail?: string,
  externalId?: string,
): Promise<MyFatoorahSessionResponse | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('MYFATOORAH_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(`${getApiUrl()}/v3/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        PaymentMode: 'COMPLETE_PAYMENT',
        Order: {
          Amount: amount,
          ...(externalId ? { ExternalIdentifier: externalId } : {}),
        },
        ...(customerEmail
          ? {
              Customer: {
                Email: customerEmail,
              },
            }
          : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MyFatoorah session creation failed:', response.status, errorText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to create MyFatoorah session:', error)
    return null
  }
}

/**
 * Decrypt the paymentData returned by MyFatoorah after a successful payment
 * Uses AES-128-CBC with the first 16 bytes of the encryption key as both key and IV
 */
export function decryptPaymentData(
  encryptedText: string,
  encryptionKey: string,
): MyFatoorahDecryptedPayment | null {
  try {
    const encryptedTextBytes = Buffer.from(encryptedText, 'base64')
    const passBytes = Buffer.from(encryptionKey, 'utf-8')

    // Prepare 16-byte key (128-bit)
    const encryptionKeyBytes = Buffer.alloc(16)
    passBytes.copy(encryptionKeyBytes, 0, 0, Math.min(passBytes.length, 16))

    // Initialize AES cipher in CBC mode (key = IV)
    const decipher = createDecipheriv('aes-128-cbc', encryptionKeyBytes, encryptionKeyBytes)

    let decrypted = decipher.update(encryptedTextBytes)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    const jsonString = decrypted.toString('utf-8')
    return JSON.parse(jsonString) as MyFatoorahDecryptedPayment
  } catch (error) {
    console.error('Failed to decrypt MyFatoorah payment data:', error)
    return null
  }
}

/**
 * Get payment status using MyFatoorah's GetPaymentStatus API (v2)
 * This is a fallback / webhook verification method
 */
export async function getPaymentStatus(paymentId: string): Promise<{
  IsSuccess: boolean
  Data?: {
    InvoiceId: number
    InvoiceStatus: string
    InvoiceValue: number
    CustomerEmail: string
    InvoiceReference: string
  }
} | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('MYFATOORAH_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(`${getApiUrl()}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        Key: paymentId,
        KeyType: 'PaymentId',
      }),
    })

    if (!response.ok) {
      console.error('MyFatoorah GetPaymentStatus failed:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get MyFatoorah payment status:', error)
    return null
  }
}
