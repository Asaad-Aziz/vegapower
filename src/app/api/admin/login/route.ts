import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json(
      { success: false, error: 'Admin password not configured' },
      { status: 500 }
    )
  }

  if (password !== adminPassword) {
    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    )
  }

  // Set a simple session cookie
  const cookieStore = await cookies()
  const sessionToken = Buffer.from(`admin:${Date.now()}`).toString('base64')
  
  cookieStore.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return NextResponse.json({ success: true })
}

