import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { validation_url, domain_name } = await request.json()

    if (!validation_url) {
      return NextResponse.json(
        { error: 'validation_url is required' },
        { status: 400 }
      )
    }

    const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('MOYASAR_PUBLISHABLE_KEY not configured')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    // Call Moyasar's Apple Pay initiate endpoint
    const response = await fetch('https://api.moyasar.com/v1/applepay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validation_url: validation_url,
        display_name: 'Vega Power',
        domain_name: domain_name || 'vegapowerstore.com',
        publishable_api_key: publishableKey,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Moyasar Apple Pay initiate error:', response.status, errorText)
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

