import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendAbandonedCartEmail } from '@/lib/email'

// Plan prices in SAR
const planPrices: Record<string, number> = {
  monthly: 45,
  quarterly: 92,
  yearly: 187,
}

const DISCOUNT_CODE = 'VP20'
const DISCOUNT_PERCENT = 20
const DELAY_MINUTES = 15

export async function GET() {
  try {
    const supabase = createServerClient()

    // Find abandoned checkouts older than 15 minutes that haven't converted and haven't been emailed
    const cutoffTime = new Date(Date.now() - DELAY_MINUTES * 60 * 1000).toISOString()

    const { data: abandonedCheckouts, error: fetchError } = await supabase
      .from('abandoned_checkouts')
      .select('*')
      .eq('converted', false)
      .eq('recovery_email_sent', false)
      .lt('created_at', cutoffTime)
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Failed to fetch abandoned checkouts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch abandoned checkouts' }, { status: 500 })
    }

    if (!abandonedCheckouts || abandonedCheckouts.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No abandoned checkouts to process' })
    }

    console.log(`Processing ${abandonedCheckouts.length} abandoned checkouts`)

    // Double-check: filter out emails that have an active subscription (they converted through another path)
    const emails = [...new Set(abandonedCheckouts.map(c => c.email))]
    const { data: activeSubscriptions } = await supabase
      .from('app_subscriptions')
      .select('email')
      .in('email', emails)
      .eq('status', 'active')

    const convertedEmails = new Set((activeSubscriptions || []).map(s => s.email.toLowerCase()))

    let sent = 0
    let skipped = 0
    const processedEmails = new Set<string>() // Avoid sending multiple emails to the same person

    for (const checkout of abandonedCheckouts) {
      const emailLower = checkout.email.toLowerCase()

      // Skip if already converted or already processed in this batch
      if (convertedEmails.has(emailLower) || processedEmails.has(emailLower)) {
        // Mark as converted so we don't check again
        await supabase.from('abandoned_checkouts')
          .update({ converted: true, converted_at: new Date().toISOString() })
          .eq('id', checkout.id)
        skipped++
        continue
      }

      processedEmails.add(emailLower)

      const plan = checkout.plan || 'monthly'
      const originalPrice = planPrices[plan] || planPrices.monthly
      const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))

      const emailSent = await sendAbandonedCartEmail({
        to: checkout.email,
        plan,
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
          .eq('id', checkout.id)
        sent++
        console.log('Recovery email sent to:', checkout.email)
      } else {
        console.error('Failed to send recovery email to:', checkout.email)
      }
    }

    console.log(`Abandoned cart cron complete: ${sent} sent, ${skipped} skipped`)

    return NextResponse.json({
      processed: abandonedCheckouts.length,
      sent,
      skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Abandoned cart cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
