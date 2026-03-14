import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendAbandonedCartEmail } from '@/lib/email'

const planPrices: Record<string, number> = {
  monthly: 45,
  quarterly: 92,
  yearly: 187,
}

const DISCOUNT_CODE = 'VP20'
const DISCOUNT_PERCENT = 20

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminPassword, emails, plan = 'monthly' } = body

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Provide an emails array' }, { status: 400 })
    }

    const supabase = createServerClient()
    const originalPrice = planPrices[plan] || planPrices.monthly
    const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))

    let sent = 0
    let failed = 0
    const results: { email: string; success: boolean }[] = []

    for (const email of emails) {
      const emailSent = await sendAbandonedCartEmail({
        to: email,
        plan,
        discountCode: DISCOUNT_CODE,
        discountPercent: DISCOUNT_PERCENT,
        originalPrice,
        discountedPrice,
      })

      if (emailSent) {
        // Track in abandoned_checkouts
        await supabase.from('abandoned_checkouts').insert({
          email,
          plan,
          amount: originalPrice,
          session_id: `manual_${Date.now()}`,
          converted: false,
          recovery_email_sent: true,
          recovery_email_sent_at: new Date().toISOString(),
          discount_code: DISCOUNT_CODE,
        })
        sent++
        results.push({ email, success: true })
      } else {
        failed++
        results.push({ email, success: false })
      }

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return NextResponse.json({ sent, failed, total: emails.length, results })
  } catch (error) {
    console.error('Send discount error:', error)
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 })
  }
}
