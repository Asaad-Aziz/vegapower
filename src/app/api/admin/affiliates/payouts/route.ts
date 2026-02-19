import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

async function isAuthenticated() {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin_session')?.value
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { affiliate_code_id, amount_sar, note } = body

    if (!affiliate_code_id || !amount_sar || amount_sar <= 0) {
      return NextResponse.json(
        { success: false, error: 'Affiliate code ID and a positive amount are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_code_id,
        amount_sar,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create payout:', error)
      return NextResponse.json({ success: false, error: 'Failed to record payout' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payout: data })
  } catch (error) {
    console.error('Payout create error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
