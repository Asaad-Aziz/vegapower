import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Generate a random password
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'Payment ID required' }, { status: 400 })
    }

    // Verify payment with Moyasar
    const moyasarSecretKey = process.env.MOYASAR_SECRET_KEY
    if (!moyasarSecretKey) {
      console.error('MOYASAR_SECRET_KEY not configured')
      return NextResponse.json({ success: false, error: 'Payment verification not configured' }, { status: 500 })
    }

    const paymentResponse = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(moyasarSecretKey + ':').toString('base64')}`,
      },
    })

    if (!paymentResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 400 })
    }

    const payment = await paymentResponse.json()

    // Check if payment is successful
    if (payment.status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Payment not completed' }, { status: 400 })
    }

    // Check if it's an app subscription
    if (payment.metadata?.type !== 'app_subscription') {
      return NextResponse.json({ success: false, error: 'Invalid payment type' }, { status: 400 })
    }

    const { user_email, user_name, user_phone, goal, experience, schedule, plan } = payment.metadata

    // Check if already processed
    const supabase = createServerClient()
    const { data: existingSubscription } = await supabase
      .from('app_subscriptions')
      .select('id')
      .eq('payment_id', paymentId)
      .single()

    if (existingSubscription) {
      return NextResponse.json({ success: true, email: user_email, alreadyProcessed: true })
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Create Firebase user via Firebase Admin REST API
    const firebaseApiKey = process.env.FIREBASE_API_KEY
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID

    if (firebaseApiKey && firebaseProjectId) {
      try {
        // Create user in Firebase Auth using Admin SDK REST API
        // Note: For production, you should use Firebase Admin SDK
        // This is a simplified version using the Identity Toolkit API
        const firebaseResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user_email,
              password: tempPassword,
              returnSecureToken: false,
            }),
          }
        )

        if (!firebaseResponse.ok) {
          const firebaseError = await firebaseResponse.json()
          console.error('Firebase user creation failed:', firebaseError)
          // Continue anyway - user might already exist
        }
      } catch (firebaseErr) {
        console.error('Firebase error:', firebaseErr)
        // Continue anyway
      }
    }

    // Store subscription in Supabase
    const { error: insertError } = await supabase.from('app_subscriptions').insert({
      payment_id: paymentId,
      email: user_email,
      name: user_name,
      phone: user_phone,
      goal,
      experience,
      schedule,
      plan,
      amount: payment.amount / 100,
      status: 'active',
    })

    if (insertError) {
      console.error('Failed to store subscription:', insertError)
    }

    // Send email with temporary password via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Vega Power <noreply@vegapowerstore.com>',
            to: user_email,
            subject: 'مرحباً بك في Vega Power - بيانات تسجيل الدخول 🎉',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #10b981; margin: 0;">Vega Power</h1>
                </div>
                
                <h2 style="color: #333;">مرحباً ${user_name}! 👋</h2>
                
                <p style="color: #666; line-height: 1.6;">
                  تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول إلى التطبيق باستخدام البيانات التالية:
                </p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>البريد الإلكتروني:</strong></p>
                  <p style="margin: 0 0 20px 0; color: #10b981; font-size: 18px;" dir="ltr">${user_email}</p>
                  
                  <p style="margin: 0 0 10px 0;"><strong>كلمة المرور المؤقتة:</strong></p>
                  <p style="margin: 0; color: #10b981; font-size: 24px; font-family: monospace;" dir="ltr">${tempPassword}</p>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                  ⚠️ ننصحك بتغيير كلمة المرور بعد تسجيل الدخول الأول من إعدادات التطبيق.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999; font-size: 14px;">
                    إذا واجهت أي مشكلة، تواصل معنا عبر الإنستقرام
                  </p>
                </div>
              </div>
            `,
          }),
        })

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text())
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }

    return NextResponse.json({ success: true, email: user_email })
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
