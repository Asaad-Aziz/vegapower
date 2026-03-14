import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendAbandonedCartEmail } from '@/lib/email'

// Plan prices in SAR
const planPrices: Record<string, number> = {
  monthly: 45,
  quarterly: 92,
  yearly: 187,
}

const DISCOUNT_CODE = 'VP10'
const DISCOUNT_PERCENT = 10

export async function POST(request: NextRequest) {
  try {
    // Require admin password for one-time backfill
    const body = await request.json()
    const { adminPassword, dryRun = true } = body

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Step 1: Get all emails that had failed/canceled payments in the past week from webhook_logs
    const { data: failedWebhooks } = await supabase
      .from('webhook_logs')
      .select('payload')
      .eq('source', 'streampay')
      .in('event_type', ['PAYMENT_FAILED', 'PAYMENT_CANCELED'])
      .gte('processed_at', oneWeekAgo)

    // Step 2: Get all emails with failed status from app_subscriptions in the past week
    const { data: failedSubscriptions } = await supabase
      .from('app_subscriptions')
      .select('email, plan, amount, created_at')
      .eq('status', 'failed')
      .eq('payment_source', 'streampay_failed')
      .gte('created_at', oneWeekAgo)

    // Step 3: Get all emails that successfully converted (to exclude them)
    const { data: activeSubscriptions } = await supabase
      .from('app_subscriptions')
      .select('email')
      .eq('status', 'active')

    const convertedEmails = new Set(
      (activeSubscriptions || []).map(s => s.email?.toLowerCase()).filter(Boolean)
    )

    // Collect unique abandoned emails from webhook logs
    const abandonedMap = new Map<string, { email: string; plan: string }>()

    // From webhook logs
    for (const log of failedWebhooks || []) {
      const payload = log.payload
      const email = payload?.customer?.email || payload?.data?.organization_consumer?.email ||
                    payload?.metadata?.email || payload?.data?.customer?.email
      if (email && !convertedEmails.has(email.toLowerCase())) {
        const amount = payload?.amount || payload?.data?.amount
        let plan = 'monthly'
        if (amount) {
          const amountSAR = amount > 1000 ? amount / 100 : amount
          if (amountSAR >= 150) plan = 'yearly'
          else if (amountSAR >= 80) plan = 'quarterly'
        }
        abandonedMap.set(email.toLowerCase(), { email, plan })
      }
    }

    // From failed subscriptions
    for (const sub of failedSubscriptions || []) {
      if (sub.email && !convertedEmails.has(sub.email.toLowerCase())) {
        abandonedMap.set(sub.email.toLowerCase(), {
          email: sub.email,
          plan: sub.plan || 'monthly',
        })
      }
    }

    // Also check abandoned_checkouts table if it exists (for any already tracked)
    const { data: existingAbandoned } = await supabase
      .from('abandoned_checkouts')
      .select('email')
      .eq('recovery_email_sent', true)

    const alreadyEmailed = new Set(
      (existingAbandoned || []).map(a => a.email?.toLowerCase()).filter(Boolean)
    )

    // Filter out already emailed
    const toEmail = [...abandonedMap.values()].filter(
      a => !alreadyEmailed.has(a.email.toLowerCase())
    )

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalFound: abandonedMap.size,
        alreadyEmailed: alreadyEmailed.size,
        toEmail: toEmail.length,
        emails: toEmail.map(a => ({ email: a.email, plan: a.plan })),
        message: 'Set dryRun: false to actually send emails',
      })
    }

    // Send emails
    let sent = 0
    let failed = 0

    for (const abandoned of toEmail) {
      const originalPrice = planPrices[abandoned.plan] || planPrices.monthly
      const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))

      // Insert into abandoned_checkouts for tracking
      await supabase.from('abandoned_checkouts').insert({
        email: abandoned.email,
        plan: abandoned.plan,
        amount: originalPrice,
        session_id: `backfill_${Date.now()}`,
        converted: false,
        recovery_email_sent: false,
      })

      const emailSent = await sendAbandonedCartEmail({
        to: abandoned.email,
        plan: abandoned.plan,
        discountCode: DISCOUNT_CODE,
        discountPercent: DISCOUNT_PERCENT,
        originalPrice,
        discountedPrice,
      })

      if (emailSent) {
        await supabase.from('abandoned_checkouts')
          .update({
            recovery_email_sent: true,
            recovery_email_sent_at: new Date().toISOString(),
            discount_code: DISCOUNT_CODE,
          })
          .eq('email', abandoned.email)
          .eq('converted', false)
        sent++
      } else {
        failed++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return NextResponse.json({
      dryRun: false,
      totalFound: abandonedMap.size,
      toEmail: toEmail.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json({ error: 'Backfill failed' }, { status: 500 })
  }
}
