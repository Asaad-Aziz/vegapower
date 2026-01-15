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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile' or 'product'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 })
    }

    const supabase = createServerClient()

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${type}-${Date.now()}.${ext}`
    const path = `${type}/${filename}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to upload image' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(path)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Upload failed' 
    }, { status: 500 })
  }
}

