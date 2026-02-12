import { NextRequest, NextResponse } from 'next/server'
import { createPaymentSession } from '@/lib/myfatoorah'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, email, productId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 },
      )
    }

    const session = await createPaymentSession(amount, email, productId)

    if (!session || !session.IsSuccess) {
      return NextResponse.json(
        { success: false, error: session?.Message || 'Failed to create payment session' },
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
      { success: false, error: 'Failed to create payment session' },
      { status: 500 },
    )
  }
}
