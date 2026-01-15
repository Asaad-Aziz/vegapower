import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const timestamp = new Date().toISOString()
    
    console.log(`[Client Log ${timestamp}] ==========`)
    console.log(`[Client Log ${timestamp}] Type:`, body.type)
    console.log(`[Client Log ${timestamp}] Message:`, body.message)
    if (body.data) {
      console.log(`[Client Log ${timestamp}] Data:`, JSON.stringify(body.data, null, 2))
    }
    console.log(`[Client Log ${timestamp}] User Agent:`, request.headers.get('user-agent'))
    console.log(`[Client Log ${timestamp}] ==========`)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Client Log] Error processing log:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

