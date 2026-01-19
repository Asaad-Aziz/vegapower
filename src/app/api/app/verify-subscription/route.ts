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

    const metadata = payment.metadata

    // Check if already processed
    const supabase = createServerClient()
    const { data: existingSubscription } = await supabase
      .from('app_subscriptions')
      .select('id')
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
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1)
    }

    // Prepare Firebase user data
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
        productId: metadata.productId || 'vega_monthly_moyasar',
        expirationDate: expirationDate.toISOString(),
        paymentMethod: 'moyasar',
      },

      // Metadata
      onboardingCompleted: true,
      email: metadata.email,
      createdAt: now.toISOString(),
      lastUpdated: now.toISOString(),
    }

    // Create Firebase user via Firebase Admin REST API
    const firebaseApiKey = process.env.FIREBASE_API_KEY
    let firebaseUid = null

    if (firebaseApiKey) {
      try {
        // Create user in Firebase Auth
        const createUserResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: metadata.email,
              password: tempPassword,
              returnSecureToken: true,
            }),
          }
        )

        if (createUserResponse.ok) {
          const createUserData = await createUserResponse.json()
          firebaseUid = createUserData.localId

          // Store user data in Firestore via REST API
          const firestoreProjectId = process.env.FIREBASE_PROJECT_ID
          if (firestoreProjectId && firebaseUid) {
            // Convert data to Firestore format
            const firestoreData = {
              fields: {
                age: { integerValue: firebaseUserData.age },
                birthYear: { integerValue: firebaseUserData.birthYear },
                height: { integerValue: firebaseUserData.height },
                weight: { integerValue: firebaseUserData.weight },
                targetWeight: { integerValue: firebaseUserData.targetWeight },
                targetSpeed: { doubleValue: firebaseUserData.targetSpeed },
                gender: { stringValue: firebaseUserData.gender },
                activityLevel: { stringValue: firebaseUserData.activityLevel },
                fitnessGoal: { stringValue: firebaseUserData.fitnessGoal },
                fitnessLevel: { stringValue: firebaseUserData.fitnessLevel },
                workoutLocation: { stringValue: firebaseUserData.workoutLocation },
                challenges: { arrayValue: { values: firebaseUserData.challenges.map((c: string) => ({ stringValue: c })) } },
                accomplishments: { arrayValue: { values: firebaseUserData.accomplishments.map((a: string) => ({ stringValue: a })) } },
                calculatedCalories: { integerValue: firebaseUserData.calculatedCalories },
                proteinGrams: { integerValue: firebaseUserData.proteinGrams },
                carbsGrams: { integerValue: firebaseUserData.carbsGrams },
                fatGrams: { integerValue: firebaseUserData.fatGrams },
                proteinPercentage: { integerValue: firebaseUserData.proteinPercentage },
                carbsPercentage: { integerValue: firebaseUserData.carbsPercentage },
                fatPercentage: { integerValue: firebaseUserData.fatPercentage },
                programName: { stringValue: firebaseUserData.programName },
                subscription: {
                  mapValue: {
                    fields: {
                      isActive: { booleanValue: true },
                      productId: { stringValue: firebaseUserData.subscription.productId },
                      expirationDate: { timestampValue: firebaseUserData.subscription.expirationDate },
                      paymentMethod: { stringValue: 'moyasar' },
                    },
                  },
                },
                onboardingCompleted: { booleanValue: true },
                email: { stringValue: firebaseUserData.email },
                createdAt: { timestampValue: firebaseUserData.createdAt },
                lastUpdated: { timestampValue: firebaseUserData.lastUpdated },
              },
            }

            await fetch(
              `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/(default)/documents/users/${firebaseUid}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${createUserData.idToken}`,
                },
                body: JSON.stringify(firestoreData),
              }
            )
          }
        } else {
          const errorData = await createUserResponse.json()
          console.error('Firebase user creation failed:', errorData)
        }
      } catch (firebaseErr) {
        console.error('Firebase error:', firebaseErr)
      }
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
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #10b981; margin: 0;">Vega Power</h1>
                  <p style="color: #666;">${firebaseUserData.programName}</p>
                </div>
                
                <h2 style="color: #333;">مرحباً! 👋</h2>
                
                <p style="color: #666; line-height: 1.6;">
                  تم إنشاء حسابك بنجاح وخطتك جاهزة! يمكنك الآن تسجيل الدخول إلى التطبيق.
                </p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>البريد الإلكتروني:</strong></p>
                  <p style="margin: 0 0 20px 0; color: #10b981; font-size: 18px;" dir="ltr">${metadata.email}</p>
                  
                  <p style="margin: 0 0 10px 0;"><strong>كلمة المرور المؤقتة:</strong></p>
                  <p style="margin: 0; color: #10b981; font-size: 24px; font-family: monospace; background: #fff; padding: 10px; border-radius: 5px; text-align: center;" dir="ltr">${tempPassword}</p>
                </div>

                <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                  <h3 style="margin: 0 0 10px 0;">خطتك الشخصية</h3>
                  <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.calculatedCalories}</div>
                      <div style="font-size: 12px; opacity: 0.8;">سعرة/يوم</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.proteinGrams}g</div>
                      <div style="font-size: 12px; opacity: 0.8;">بروتين</div>
                    </div>
                    <div>
                      <div style="font-size: 24px; font-weight: bold;">${firebaseUserData.carbsGrams}g</div>
                      <div style="font-size: 12px; opacity: 0.8;">كارب</div>
                    </div>
                  </div>
                </div>
                
                <p style="color: #666; line-height: 1.6;">
                  ⚠️ ننصحك بتغيير كلمة المرور بعد تسجيل الدخول الأول من إعدادات التطبيق.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999; font-size: 14px;">
                    حمّل التطبيق من App Store أو Google Play وابدأ رحلتك! 💪
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

    return NextResponse.json({ success: true, email: metadata.email })
  } catch (error) {
    console.error('Subscription verification error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
