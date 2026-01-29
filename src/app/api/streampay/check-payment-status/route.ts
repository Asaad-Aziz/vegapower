import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, paymentLinkId } = body

    console.log('Checking payment status:', { paymentId, paymentLinkId })

    if (!paymentId && !paymentLinkId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID or Payment Link ID required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if we have a successful subscription for this payment
    // The webhook would have created this if the payment actually succeeded
    let query = supabase
      .from('app_subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('payment_source', 'streampay')

    // Try to find by payment_id (which might match paymentId or contain paymentLinkId)
    if (paymentId) {
      query = query.or(`payment_id.eq.${paymentId},payment_id.ilike.%${paymentId}%`)
    }

    const { data: subscription, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error)
    }

    if (subscription) {
      console.log('Found successful subscription:', subscription)
      return NextResponse.json({
        success: true,
        paymentSucceeded: true,
        email: subscription.email,
        plan: subscription.plan,
        amount: subscription.amount,
        sessionId: subscription.payment_id,
      })
    }

    // Also check webhook_logs for any successful payment events with this ID
    const { data: webhookLog } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('source', 'streampay')
      .eq('event_type', 'PAYMENT_SUCCEEDED')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check if any webhook log contains this payment ID
    const matchingLog = webhookLog?.find(log => {
      const payload = log.payload as Record<string, unknown>
      return (
        payload?.payment_id === paymentId ||
        payload?.id === paymentId ||
        payload?.payment_link_id === paymentLinkId ||
        JSON.stringify(payload).includes(paymentId || '') ||
        JSON.stringify(payload).includes(paymentLinkId || '')
      )
    })

    if (matchingLog) {
      const payload = matchingLog.payload as Record<string, unknown>
      const email = (payload?.customer as Record<string, unknown>)?.email || 
                    (payload?.metadata as Record<string, unknown>)?.email ||
                    payload?.email

      console.log('Found successful payment in webhook logs:', matchingLog)
      return NextResponse.json({
        success: true,
        paymentSucceeded: true,
        email: email as string || '',
        plan: (payload?.metadata as Record<string, unknown>)?.plan as string || 'yearly',
        amount: payload?.amount as string || '155',
        fromWebhookLog: true,
      })
    }

    // Payment not found in our records - might still be processing
    console.log('Payment not found in database, checking recent subscriptions...')

    // Check if there's a very recent subscription (last 10 minutes) that might be this payment
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: recentSubs } = await supabase
      .from('app_subscriptions')
      .select('*')
      .eq('status', 'active')
      .eq('payment_source', 'streampay')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentSubs && recentSubs.length > 0) {
      // There are recent successful payments - might be one of them
      console.log('Found recent subscriptions, might match:', recentSubs.length)
      
      // Return the most recent one as a potential match
      const mostRecent = recentSubs[0]
      return NextResponse.json({
        success: true,
        paymentSucceeded: true,
        email: mostRecent.email,
        plan: mostRecent.plan,
        amount: mostRecent.amount,
        sessionId: mostRecent.payment_id,
        note: 'Matched by recent timestamp',
      })
    }

    // No successful payment found
    return NextResponse.json({
      success: true,
      paymentSucceeded: false,
      message: 'No successful payment record found',
    })

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
