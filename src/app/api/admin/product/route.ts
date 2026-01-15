import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

async function isAuthenticated() {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin_session')?.value
}

export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Get the single product row
    const { data: existingProduct } = await supabase
      .from('product')
      .select('id')
      .single()

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Update product
    const { error } = await supabase
      .from('product')
      .update({
        title: body.title,
        description: body.description,
        price_sar: body.price_sar,
        before_price_sar: body.before_price_sar,
        delivery_url: body.delivery_url,
        profile_image_url: body.profile_image_url,
        product_image_url: body.product_image_url,
        brand_name: body.brand_name,
        bio: body.bio,
        custom_blocks: body.custom_blocks,
        testimonials: body.testimonials,
        faqs: body.faqs,
        social_links: body.social_links,
      })
      .eq('id', existingProduct.id)

    if (error) {
      console.error('Failed to update product:', error)
      return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
