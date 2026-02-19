import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.toUpperCase().trim()

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: affiliate } = await supabase
      .from('affiliate_codes')
      .select('code, discount_percentage, streampay_coupon_id, is_active')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (!affiliate) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({
      valid: true,
      code: affiliate.code,
      discount_percentage: affiliate.discount_percentage,
      streampay_coupon_id: affiliate.streampay_coupon_id || null,
    })
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
