import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/myfatoorah'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, email, productId } = body

    console.log('[MyFatoorah Session] Creating session:', { amount, email, productId })
    console.log('[MyFatoorah Session] API URL:', (process.env.MYFATOORAH_API_URL || 'https://api-sa.myfatoorah.com').replace(/\/+$/, ''))
    console.log('[MyFatoorah Session] API Key prefix:', (process.env.MYFATOORAH_API_KEY || '').substring(0, 15) + '...')

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 },
      )
    }

    const session = await createPaymentSession(amount, email, productId)

    console.log('[MyFatoorah Session] Response:', JSON.stringify(session))

    if (!session || !session.IsSuccess) {
      const errorMsg = session?.Message || 'Failed to create payment session (null response - check API key and URL match)'
      console.error('[MyFatoorah Session] Failed:', errorMsg)
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: session.Data.SessionId,
      encryptionKey: session.Data.EncryptionKey,
    })
  } catch (error) {
    console.error('MyFatoorah session error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}
