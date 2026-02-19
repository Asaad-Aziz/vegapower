import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: affiliate, error: affError } = await supabase
      .from('affiliate_codes')
      .select('*')
      .eq('access_token', token)
      .single()

    if (affError || !affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate link' }, { status: 404 })
    }

    const [ordersResult, payoutsResult] = await Promise.all([
      supabase
        .from('orders')
        .select('amount_sar, created_at')
        .eq('discount_code', affiliate.code)
        .eq('status', 'paid')
        .order('created_at', { ascending: false }),
      supabase
        .from('affiliate_payouts')
        .select('*')
        .eq('affiliate_code_id', affiliate.id)
        .order('created_at', { ascending: false }),
    ])

    const orders = ordersResult.data || []
    const payouts = payoutsResult.data || []

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount_sar), 0)
    const totalCommission = totalRevenue * (affiliate.commission_percentage / 100)
    const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.amount_sar), 0)
    const pendingBalance = totalCommission - totalPaidOut

    return NextResponse.json({
      affiliate_name: affiliate.affiliate_name,
      code: affiliate.code,
      discount_percentage: affiliate.discount_percentage,
      commission_percentage: affiliate.commission_percentage,
      total_sales: orders.length,
      total_revenue: totalRevenue,
      total_commission: totalCommission,
      total_paid_out: totalPaidOut,
      pending_balance: pendingBalance,
      recent_orders: orders.slice(0, 20).map((o) => ({
        amount_sar: o.amount_sar,
        created_at: o.created_at,
      })),
      payouts: payouts.map((p) => ({
        amount_sar: p.amount_sar,
        note: p.note,
        created_at: p.created_at,
      })),
    })
  } catch (error) {
    console.error('Affiliate stats error:', error)
    return NextResponse.json({ error: 'Failed to load affiliate data' }, { status: 500 })
  }
}
