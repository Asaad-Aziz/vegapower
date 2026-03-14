import { NextRequest, NextResponse } from 'next/server'
import StreamSDK from '@streamsdk/typescript'
import { createServerClient } from '@/lib/supabase'
import { sendAbandonedCartEmail } from '@/lib/email'

const planPrices: Record<string, number> = {
  monthly: 45,
  quarterly: 92,
  yearly: 187,
}

const DISCOUNT_CODE = 'VP10'
const DISCOUNT_PERCENT = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminPassword, dryRun = true } = body

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.STREAMPAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'STREAMPAY_API_KEY not configured' }, { status: 500 })
    }

    const client = StreamSDK.init(apiKey)
    const supabase = createServerClient()

    // Step 1: Fetch all consumers from StreamPay (paginate)
    const allConsumers: { id: string; email?: string | null; name?: string; created_at: string }[] = []
    let page = 1
    const pageSize = 100

    while (true) {
      const consumersPage = await client.listConsumers({ page, size: pageSize })
      if (consumersPage.data && consumersPage.data.length > 0) {
        allConsumers.push(...consumersPage.data)
        if (consumersPage.data.length < pageSize) break
        page++
      } else {
        break
      }
    }

    // Step 2: Fetch all invoices from StreamPay (these are the ones who paid)
    const paidConsumerIds = new Set<string>()
    page = 1

    while (true) {
      const invoicesPage = await client.listInvoices({ page, size: pageSize })
      if (invoicesPage.data && invoicesPage.data.length > 0) {
        for (const invoice of invoicesPage.data) {
          if (invoice.organization_consumer_id) {
            paidConsumerIds.add(invoice.organization_consumer_id)
          }
        }
        if (invoicesPage.data.length < pageSize) break
        page++
      } else {
        break
      }
    }

    // Step 3: Filter consumers who have email but no invoice (didn't pay)
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const abandonedConsumers = allConsumers.filter(c => {
      if (!c.email) return false
      if (paidConsumerIds.has(c.id)) return false
      // Only from the past week
      const createdAt = new Date(c.created_at)
      if (createdAt < oneMonthAgo) return false
      return true
    })

    // Step 4: Exclude anyone who already has an active subscription in our DB
    const emails = abandonedConsumers.map(c => c.email!.toLowerCase())
    const { data: activeSubscriptions } = await supabase
      .from('app_subscriptions')
      .select('email')
      .eq('status', 'active')

    const convertedEmails = new Set(
      (activeSubscriptions || []).map(s => s.email?.toLowerCase()).filter(Boolean)
    )

    // Step 5: Exclude anyone already sent a recovery email
    const { data: existingAbandoned } = await supabase
      .from('abandoned_checkouts')
      .select('email')
      .eq('recovery_email_sent', true)

    const alreadyEmailed = new Set(
      (existingAbandoned || []).map(a => a.email?.toLowerCase()).filter(Boolean)
    )

    const toEmail = abandonedConsumers.filter(c => {
      const emailLower = c.email!.toLowerCase()
      return !convertedEmails.has(emailLower) && !alreadyEmailed.has(emailLower)
    })

    // Deduplicate by email
    const uniqueEmails = new Map<string, typeof toEmail[0]>()
    for (const c of toEmail) {
      uniqueEmails.set(c.email!.toLowerCase(), c)
    }
    const finalList = [...uniqueEmails.values()]

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalConsumers: allConsumers.length,
        totalWithInvoice: paidConsumerIds.size,
        totalAbandoned: abandonedConsumers.length,
        alreadyEmailed: alreadyEmailed.size,
        excludedConverted: convertedEmails.size,
        toEmail: finalList.length,
        emails: finalList.map(c => ({ email: c.email, created_at: c.created_at })),
        message: 'Set dryRun: false to actually send emails',
      })
    }

    // Send emails
    let sent = 0
    let failed = 0

    for (const consumer of finalList) {
      const plan = 'monthly' // Default plan for backfill
      const originalPrice = planPrices[plan]
      const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))

      // Track in abandoned_checkouts
      await supabase.from('abandoned_checkouts').insert({
        email: consumer.email,
        plan,
        amount: originalPrice,
        session_id: `backfill_${Date.now()}`,
        consumer_id: consumer.id,
        converted: false,
        recovery_email_sent: false,
      })

      const emailSent = await sendAbandonedCartEmail({
        to: consumer.email!,
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
          .eq('email', consumer.email)
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
      totalConsumers: allConsumers.length,
      totalAbandoned: abandonedConsumers.length,
      toEmail: finalList.length,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json({ error: 'Backfill failed', details: String(error) }, { status: 500 })
  }
}
