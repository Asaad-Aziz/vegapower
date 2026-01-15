import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { validation_url } = await request.json()

    if (!validation_url) {
      return NextResponse.json(
        { error: 'validation_url is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.MOYASAR_API_KEY

    if (!apiKey) {
      console.error('MOYASAR_API_KEY not configured')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    // Call Moyasar's Apple Pay session endpoint
    const response = await fetch('https://api.moyasar.com/v1/applepay/session', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validation_url: validation_url,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Moyasar Apple Pay session error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to validate Apple Pay session' },
        { status: response.status }
      )
    }

    const sessionData = await response.json()
    return NextResponse.json(sessionData)

  } catch (error) {
    console.error('Apple Pay validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

