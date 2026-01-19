import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

async function isAuthenticated() {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin_session')?.value
}

// Get store settings
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) {
      console.error('Failed to fetch store settings:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch store settings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('Store settings fetch error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

// Update store settings
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Check if settings exist
    const { data: existing } = await supabase
      .from('store_settings')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('store_settings')
        .update({
          brand_name: body.brand_name,
          bio: body.bio,
          profile_image_url: body.profile_image_url,
          testimonials: body.testimonials,
          faqs: body.faqs,
          social_links: body.social_links,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Failed to update store settings:', error)
        return NextResponse.json({ success: false, error: 'Failed to update store settings' }, { status: 500 })
      }
    } else {
      // Insert new settings
      const { error } = await supabase
        .from('store_settings')
        .insert({
          brand_name: body.brand_name,
          bio: body.bio,
          profile_image_url: body.profile_image_url,
          testimonials: body.testimonials,
          faqs: body.faqs,
          social_links: body.social_links,
        })

      if (error) {
        console.error('Failed to create store settings:', error)
        return NextResponse.json({ success: false, error: 'Failed to create store settings' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Store settings update error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
