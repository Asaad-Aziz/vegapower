import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase'

async function isAuthenticated() {
  const cookieStore = await cookies()
  return !!cookieStore.get('admin_session')?.value
}

// Create new product
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const supabase = createServerClient()

    // Insert new product (only product-specific fields)
    const { data, error } = await supabase
      .from('product')
      .insert({
        title: body.title,
        description: body.description,
        price_sar: body.price_sar,
        before_price_sar: body.before_price_sar,
        delivery_url: body.delivery_url,
        product_image_url: body.product_image_url,
        goal: body.goal || 'all',
        times_bought: body.times_bought || 0,
        custom_blocks: body.custom_blocks,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create product:', error)
      return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

// Update existing product
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    const body = await request.json()
    const supabase = createServerClient()

    let targetId = productId

    // If no ID provided, get the first product (backward compatibility)
    if (!targetId) {
      const { data: existingProduct } = await supabase
        .from('product')
        .select('id')
        .limit(1)
        .single()

      if (!existingProduct) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
      targetId = existingProduct.id
    }

    // Update product (only product-specific fields)
    const { error } = await supabase
      .from('product')
      .update({
        title: body.title,
        description: body.description,
        price_sar: body.price_sar,
        before_price_sar: body.before_price_sar,
        delivery_url: body.delivery_url,
        product_image_url: body.product_image_url,
        goal: body.goal || 'all',
        times_bought: body.times_bought || 0,
        custom_blocks: body.custom_blocks,
      })
      .eq('id', targetId)

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

// Delete product
export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  
  if (!authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('product')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Failed to delete product:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
