import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation_url = body.validation_url || body.validationURL
    
    console.log('Apple Pay validation request:', { validation_url, body })

    if (!validation_url) {
      console.error('Missing validation_url in request')
      return NextResponse.json(
        { error: 'validation_url is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('MOYASAR_PUBLISHABLE_KEY not configured')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Get domain from request or use default
    const requestHost = request.headers.get('host') || 'vegapowerstore.com'
    const domainName = requestHost.replace(/:\d+$/, '') // Remove port if present
    
    console.log('Calling Moyasar with domain:', domainName)

    // Call Moyasar's Apple Pay initiate endpoint
    const moyasarBody = {
      validation_url: validation_url,
      display_name: 'Vega Power',
      domain_name: 'vegapowerstore.com',
      publishable_api_key: publishableKey,
    }
    
    console.log('Moyasar request body:', moyasarBody)

    const response = await fetch('https://api.moyasar.com/v1/applepay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moyasarBody),
    })

    const responseText = await response.text()
    console.log('Moyasar response:', response.status, responseText)

    if (!response.ok) {
      console.error('Moyasar Apple Pay initiate error:', response.status, responseText)
      return NextResponse.json(
        { error: 'Failed to validate Apple Pay session', details: responseText },
        { status: response.status, headers: corsHeaders }
      )
    }

    // Parse and return the session data
    const sessionData = JSON.parse(responseText)
    return NextResponse.json(sessionData, { headers: corsHeaders })

  } catch (error) {
    console.error('Apple Pay validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500, headers: corsHeaders }
    )
  }
}

