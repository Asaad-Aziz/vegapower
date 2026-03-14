import { NextRequest, NextResponse } from 'next/server'
import StreamSDK from '@streamsdk/typescript'
import { createServerClient } from '@/lib/supabase'
import { sendAbandonedCartEmail } from '@/lib/email'

const planPrices: Record<string, number> = {
  monthly: 45,
  quarterly: 92,
  yearly: 187,
}

const DISCOUNT_CODE = 'VP20'
const DISCOUNT_PERCENT = 20
const MAX_PAGES = 10 // Safety limit — max 10 pages (1000 items)

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

    // Step 1: Fetch consumers from StreamPay (with safety limit)
    const allConsumers: { id: string; email?: string | null; name?: string; created_at: string }[] = []
    let consumerPages = 0

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await client.listConsumers({ page, size: 100 })
      const items = res.data || []
      consumerPages = page
      if (items.length === 0) break
      allConsumers.push(...items)
      // Check if we've reached the last page
      const pagination = (res as { pagination?: { total_pages?: number } }).pagination
      if (pagination?.total_pages && page >= pagination.total_pages) break
    }

    // Step 2: Fetch invoices from StreamPay (with safety limit)
    const paidConsumerIds = new Set<string>()
    let invoicePages = 0

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await client.listInvoices({ page, size: 100 })
      const items = res.data || []
      invoicePages = page
      if (items.length === 0) break
      for (const invoice of items) {
        if (invoice.organization_consumer_id) {
          paidConsumerIds.add(invoice.organization_consumer_id)
        }
      }
      const pagination = (res as { pagination?: { total_pages?: number } }).pagination
      if (pagination?.total_pages && page >= pagination.total_pages) break
    }

    // Step 3: Filter — has email, no invoice, within last month
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const abandonedConsumers = allConsumers.filter(c => {
      if (!c.email) return false
      if (paidConsumerIds.has(c.id)) return false
      const createdAt = new Date(c.created_at)
      if (createdAt < oneMonthAgo) return false
      return true
    })

    // Step 4: Exclude active subscribers
    const { data: activeSubscriptions } = await supabase
      .from('app_subscriptions')
      .select('email')
      .eq('status', 'active')

    const convertedEmails = new Set(
      (activeSubscriptions || []).map(s => s.email?.toLowerCase()).filter(Boolean)
    )

    // Step 5: Exclude already emailed
    const { data: existingAbandoned } = await supabase
      .from('abandoned_checkouts')
      .select('email')
      .eq('recovery_email_sent', true)

    const alreadyEmailed = new Set(
      (existingAbandoned || []).map(a => a.email?.toLowerCase()).filter(Boolean)
    )

    // Deduplicate by email
    const uniqueEmails = new Map<string, typeof abandonedConsumers[0]>()
    for (const c of abandonedConsumers) {
      const emailLower = c.email!.toLowerCase()
      if (!convertedEmails.has(emailLower) && !alreadyEmailed.has(emailLower)) {
        uniqueEmails.set(emailLower, c)
      }
    }
    const finalList = [...uniqueEmails.values()]

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalConsumers: allConsumers.length,
        consumerPages,
        totalWithInvoice: paidConsumerIds.size,
        invoicePages,
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
      const plan = 'monthly'
      const originalPrice = planPrices[plan]
      const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT_PERCENT / 100))

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
