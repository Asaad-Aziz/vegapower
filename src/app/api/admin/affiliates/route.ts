import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import StreamSDK from '@streamsdk/typescript'

async function isAuthenticated() {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin_session')?.value
}

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()

    const [codesResult, payoutsResult, ordersResult] = await Promise.all([
      supabase.from('affiliate_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('affiliate_payouts').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('discount_code, amount_sar, status').eq('status', 'paid'),
    ])

    return NextResponse.json({
      success: true,
      codes: codesResult.data || [],
      payouts: payoutsResult.data || [],
      orders: ordersResult.data || [],
    })
  } catch (error) {
    console.error('Affiliates fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch affiliates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, affiliate_name, discount_percentage, commission_percentage } = body

    if (!code || !affiliate_name) {
      return NextResponse.json({ success: false, error: 'Code and affiliate name are required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const discountPct = discount_percentage || 10
    const codeUpper = code.toUpperCase().trim()

    // Create coupon in StreamPay so recurring product invoices get the discount
    let streampay_coupon_id: string | null = null
    const apiKey = process.env.STREAMPAY_API_KEY
    if (apiKey) {
      try {
        const client = StreamSDK.init(apiKey)
        const coupon = await client.createCoupon({
          name: codeUpper,
          discount_value: discountPct,
          is_percentage: true,
          is_active: true,
        })
        streampay_coupon_id = coupon.id
        console.log('StreamPay coupon created:', coupon.id, codeUpper)
      } catch (couponErr) {
        console.error('Failed to create StreamPay coupon (continuing without it):', couponErr)
      }
    }

    const { data, error } = await supabase
      .from('affiliate_codes')
      .insert({
        code: codeUpper,
        affiliate_name,
        discount_percentage: discountPct,
        commission_percentage: commission_percentage || 10,
        streampay_coupon_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'This code already exists' }, { status: 409 })
      }
      console.error('Failed to create affiliate code:', error)
      return NextResponse.json({ success: false, error: 'Failed to create affiliate code' }, { status: 500 })
    }

    return NextResponse.json({ success: true, affiliate: data })
  } catch (error) {
    console.error('Affiliate create error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Affiliate ID required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const updateData: Record<string, unknown> = {}
    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim()
    if (body.affiliate_name !== undefined) updateData.affiliate_name = body.affiliate_name
    if (body.discount_percentage !== undefined) updateData.discount_percentage = body.discount_percentage
    if (body.commission_percentage !== undefined) updateData.commission_percentage = body.commission_percentage
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { error } = await supabase
      .from('affiliate_codes')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Failed to update affiliate:', error)
      return NextResponse.json({ success: false, error: 'Failed to update affiliate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Affiliate update error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'Affiliate ID required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('affiliate_codes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete affiliate:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete affiliate' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Affiliate delete error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
