import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  console.log('[Apple Pay] OPTIONS request received')
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[Apple Pay ${timestamp}] ========== NEW VALIDATION REQUEST ==========`)
  
  try {
    // Log all request headers
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log(`[Apple Pay ${timestamp}] Request headers:`, JSON.stringify(headers, null, 2))
    
    // Parse request body
    const rawBody = await request.text()
    console.log(`[Apple Pay ${timestamp}] Raw request body:`, rawBody)
    
    let body
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error(`[Apple Pay ${timestamp}] Failed to parse request body:`, parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    console.log(`[Apple Pay ${timestamp}] Parsed body:`, JSON.stringify(body, null, 2))
    
    // Extract validation URL (try multiple possible field names)
    const validation_url = body.validation_url || body.validationURL || body.validationUrl
    console.log(`[Apple Pay ${timestamp}] Extracted validation_url:`, validation_url)

    if (!validation_url) {
      console.error(`[Apple Pay ${timestamp}] ERROR: Missing validation_url in request`)
      console.error(`[Apple Pay ${timestamp}] Available fields:`, Object.keys(body))
      return NextResponse.json(
        { error: 'validation_url is required', receivedFields: Object.keys(body) },
        { status: 400, headers: corsHeaders }
      )
    }

    const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY
    console.log(`[Apple Pay ${timestamp}] Publishable key exists:`, !!publishableKey)
    console.log(`[Apple Pay ${timestamp}] Publishable key prefix:`, publishableKey?.substring(0, 10) + '...')

    if (!publishableKey) {
      console.error(`[Apple Pay ${timestamp}] ERROR: MOYASAR_PUBLISHABLE_KEY not configured`)
      return NextResponse.json(
        { error: 'Payment configuration error - missing API key' },
        { status: 500, headers: corsHeaders }
      )
    }

    // Get domain from request
    const requestHost = request.headers.get('host') || 'vegapowerstore.com'
    const referer = request.headers.get('referer') || 'unknown'
    const origin = request.headers.get('origin') || 'unknown'
    console.log(`[Apple Pay ${timestamp}] Request host:`, requestHost)
    console.log(`[Apple Pay ${timestamp}] Referer:`, referer)
    console.log(`[Apple Pay ${timestamp}] Origin:`, origin)

    // Call Moyasar's Apple Pay initiate endpoint
    const moyasarBody = {
      validation_url: validation_url,
      display_name: 'Vega Power',
      domain_name: 'vegapowerstore.com',
      publishable_api_key: publishableKey,
    }
    
    console.log(`[Apple Pay ${timestamp}] Calling Moyasar API with:`, JSON.stringify({
      ...moyasarBody,
      publishable_api_key: moyasarBody.publishable_api_key.substring(0, 10) + '...'
    }, null, 2))

    const moyasarStartTime = Date.now()
    const response = await fetch('https://api.moyasar.com/v1/applepay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(moyasarBody),
    })
    const moyasarDuration = Date.now() - moyasarStartTime

    console.log(`[Apple Pay ${timestamp}] Moyasar response status:`, response.status)
    console.log(`[Apple Pay ${timestamp}] Moyasar response time:`, moyasarDuration, 'ms')
    
    const responseText = await response.text()
    console.log(`[Apple Pay ${timestamp}] Moyasar response body length:`, responseText.length)
    
    // Log first 500 chars of response for debugging
    console.log(`[Apple Pay ${timestamp}] Moyasar response preview:`, responseText.substring(0, 500))

    if (!response.ok) {
      console.error(`[Apple Pay ${timestamp}] ERROR: Moyasar returned error`)
      console.error(`[Apple Pay ${timestamp}] Full error response:`, responseText)
      return NextResponse.json(
        { error: 'Failed to validate Apple Pay session', moyasarError: responseText },
        { status: response.status, headers: corsHeaders }
      )
    }

    // Parse and validate response
    let sessionData
    try {
      sessionData = JSON.parse(responseText)
      console.log(`[Apple Pay ${timestamp}] Session data parsed successfully`)
      console.log(`[Apple Pay ${timestamp}] Session keys:`, Object.keys(sessionData))
      console.log(`[Apple Pay ${timestamp}] merchantIdentifier:`, sessionData.merchantIdentifier?.substring(0, 20) + '...')
      console.log(`[Apple Pay ${timestamp}] domainName:`, sessionData.domainName)
      console.log(`[Apple Pay ${timestamp}] displayName:`, sessionData.displayName)
    } catch (parseError) {
      console.error(`[Apple Pay ${timestamp}] ERROR: Failed to parse Moyasar response:`, parseError)
      return NextResponse.json(
        { error: 'Invalid response from payment provider' },
        { status: 500, headers: corsHeaders }
      )
    }

    console.log(`[Apple Pay ${timestamp}] ========== SUCCESS - Returning session ==========`)
    return NextResponse.json(sessionData, { headers: corsHeaders })

  } catch (error) {
    console.error(`[Apple Pay ${timestamp}] ========== UNHANDLED ERROR ==========`)
    console.error(`[Apple Pay ${timestamp}] Error type:`, typeof error)
    console.error(`[Apple Pay ${timestamp}] Error message:`, error instanceof Error ? error.message : String(error))
    console.error(`[Apple Pay ${timestamp}] Error stack:`, error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    )
  }
}

