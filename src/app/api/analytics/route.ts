import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { type, session_id } = await request.json()

    if (!type || !session_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['page_view', 'buy_click', 'purchase']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const supabase = createServerClient()

    await supabase
      .from('analytics_events')
      .insert({
        type,
        session_id,
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

