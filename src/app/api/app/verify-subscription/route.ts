import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createFirebaseUser, saveUserDataToFirestore } from '@/lib/firebase-admin'

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

    const metadata = payment.metadata

    // Check if already processed
    const supabase = createServerClient()
    const { data: existingSubscription } = await supabase
      .from('app_subscriptions')
      .select('id, firebase_uid')
      .eq('payment_id', paymentId)
      .single()

    if (existingSubscription) {
      return NextResponse.json({ success: true, email: metadata.email, alreadyProcessed: true })
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Calculate subscription expiration
    const now = new Date()
    const expirationDate = new Date(now)
    if (metadata.plan === 'yearly') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    } else if (metadata.plan === 'quarterly') {
      expirationDate.setMonth(expirationDate.getMonth() + 3)
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1)
    }

    // Create Firebase user with Admin SDK
    const firebaseUid = await createFirebaseUser(metadata.email, tempPassword)

    if (!firebaseUid) {
      console.error('Failed to create Firebase user')
      // Continue anyway to save order, but note the failure
    }

    // Prepare Firebase user data (matching iOS app structure)
    const firebaseUserData = {
      // Personal Info
      age: Number(metadata.age) || 25,
      birthYear: Number(metadata.birthYear) || 2000,
      height: Number(metadata.height) || 170,
      weight: Number(metadata.weight) || 70,
      targetWeight: Number(metadata.targetWeight) || 65,
      targetSpeed: Number(metadata.targetSpeed) || 0.5,

      // Fitness Profile
      gender: metadata.gender || 'male',
      activityLevel: metadata.activityLevel || 'نشط إلى حد ما (تمرين معتدل 3-5 أيام في الأسبوع)',
      fitnessGoal: metadata.fitnessGoal || 'Lose Fat (Cut)',
      fitnessLevel: 'متوسط',
      workoutLocation: 'Gym',

      // User Selections
      challenges: metadata.challenges ? JSON.parse(metadata.challenges) : [],
      accomplishments: metadata.accomplishments ? JSON.parse(metadata.accomplishments) : [],

      // Calculated Metrics
      calculatedCalories: Number(metadata.calculatedCalories) || 1800,
      proteinGrams: Number(metadata.proteinGrams) || 180,
      carbsGrams: Number(metadata.carbsGrams) || 158,
      fatGrams: Number(metadata.fatGrams) || 50,

      // Macro Percentages
      proteinPercentage: Number(metadata.proteinPercentage) || 40,
      carbsPercentage: Number(metadata.carbsPercentage) || 35,
      fatPercentage: Number(metadata.fatPercentage) || 25,

      // Program Info
      programName: metadata.programName || 'Vega Shred 🔥',

      // Subscription
      subscription: {
        isActive: true,
        productId: metadata.productId || 'moyasar_monthly',
        expirationDate: expirationDate,
        startDate: now,
        planType: metadata.plan || 'monthly',
        amount: payment.amount / 100,
        currency: 'SAR',
        source: 'moyasar_web',
        paymentId: paymentId,
      },

      // Metadata
      onboardingCompleted: true,
      hasEverSubscribed: true,
      email: metadata.email,
      createdAt: now,
      lastUpdated: now,
    }

    // Save user data to Firestore
    if (firebaseUid) {
      await saveUserDataToFirestore(firebaseUid, firebaseUserData)
    }

    // Store subscription in Supabase
    const { error: insertError } = await supabase.from('app_subscriptions').insert({
      payment_id: paymentId,
      email: metadata.email,
      firebase_uid: firebaseUid,
      plan: metadata.plan,
      amount: payment.amount / 100,
      status: 'active',
      user_data: firebaseUserData,
      expires_at: expirationDate.toISOString(),
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
            to: metadata.email,
            subject: 'مرحباً بك في Vega Power - بيانات تسجيل الدخول 🎉',
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #0D1A33, #1A2640); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">مرحباً بك في Vega Power!</h1>
                  <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0 0;">تم تفعيل اشتراكك بنجاح</p>
                </div>
                
                <div style="background: #fff; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">بيانات تسجيل الدخول</h2>
                  
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">البريد الإلكتروني</p>
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;" dir="ltr">${metadata.email}</p>
                  </div>
                  
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">كلمة المرور المؤقتة</p>
                    <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;" dir="ltr">${tempPassword}</p>
                  </div>
                </div>

                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                  <h3 style="margin: 0 0 15px 0; font-size: 16px;">خطتك الشخصية: ${firebaseUserData.programName}</h3>
                  <div style="display: flex; justify-content: space-around;">
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.calculatedCalories}</div>
                      <div style="font-size: 11px; opacity: 0.8;">سعرة/يوم</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.proteinGrams}g</div>
                      <div style="font-size: 11px; opacity: 0.8;">بروتين</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.carbsGrams}g</div>
                      <div style="font-size: 11px; opacity: 0.8;">كارب</div>
                    </div>
                  </div>
                </div>

                <div style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">خطوات تسجيل الدخول:</h3>
                  <ol style="margin: 0; padding: 0 20px; color: #666; line-height: 2;">
                    <li>حمّل تطبيق Vega Power من App Store أو Google Play</li>
                    <li>افتح التطبيق واضغط "تسجيل الدخول"</li>
                    <li>أدخل البريد وكلمة المرور المؤقتة أعلاه</li>
                    <li>غيّر كلمة المرور من الإعدادات (اختياري)</li>
                  </ol>
                </div>

                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px;">
                    ⚠️ ننصحك بتغيير كلمة المرور بعد تسجيل الدخول الأول من إعدادات التطبيق للحفاظ على أمان حسابك.
                  </p>
                </div>
                
                <div style="text-align: center; padding: 20px 0;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    لم تستلم الإيميل؟ تحقق من مجلد السبام أو تواصل معنا<br>
                    © Vega Power - جميع الحقوق محفوظة
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

    return NextResponse.json({ 
      success: true, 
      email: metadata.email,
      firebaseUserCreated: !!firebaseUid,
    })
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
