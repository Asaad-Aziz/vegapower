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

// Plan configurations
const plans: Record<string, { days: number; productId: string }> = {
  monthly: { days: 30, productId: 'streampay_monthly' },
  quarterly: { days: 90, productId: 'streampay_3months' },
  yearly: { days: 365, productId: 'streampay_yearly' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sessionId, 
      email, 
      plan, 
      amount, 
      userData, 
      discountCode,
      authMethod,             // 'apple' | 'email' - how user signed up
      appleFirebaseUid,       // Firebase UID from Apple Sign-In (if authMethod === 'apple')
      streampayConsumerId,    // StreamPay consumer ID for subscription management
      streampayProductId,     // StreamPay product ID from dashboard
      // Note: subscriptionId is created automatically by StreamPay when payment succeeds
      // and will be received via webhook (subscription_activated event)
    } = body

    console.log('StreamPay verify-payment called:', { 
      sessionId, 
      email, 
      plan, 
      amount,
      authMethod,
      appleFirebaseUid,
      streampayConsumerId,
      streampayProductId,
    })

    // Validate required fields
    if (!email || !plan) {
      return NextResponse.json(
        { success: false, error: 'Email and plan are required' },
        { status: 400 }
      )
    }

    // Check if already processed using session ID or email+plan combo
    const supabase = createServerClient()
    const { data: existingSubscription } = await supabase
      .from('app_subscriptions')
      .select('id, firebase_uid')
      .or(`payment_id.eq.${sessionId},and(email.eq.${email},payment_source.eq.streampay)`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingSubscription) {
      console.log('StreamPay: Payment already processed', sessionId || email)
      return NextResponse.json({ 
        success: true, 
        email, 
        alreadyProcessed: true,
        plan,
        amount,
      })
    }

    // For Apple Sign-In users, we don't need a temp password
    const isAppleSignIn = authMethod === 'apple' && appleFirebaseUid
    const tempPassword = isAppleSignIn ? '' : generatePassword()

    // Calculate subscription expiration
    const now = new Date()
    const expirationDate = new Date(now)
    const planConfig = plans[plan] || plans.monthly
    
    if (plan === 'yearly') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    } else if (plan === 'quarterly') {
      expirationDate.setMonth(expirationDate.getMonth() + 3)
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1)
    }

    // Parse user data if provided
    let userDataParsed = null
    if (userData) {
      try {
        userDataParsed = typeof userData === 'string' ? JSON.parse(userData) : userData
      } catch (e) {
        console.error('Failed to parse userData:', e)
      }
    }

    // Create Firebase user (or use existing Apple Sign-In user)
    let firebaseUid: string | null = null

    if (isAppleSignIn) {
      // Apple Sign-In: user already exists in Firebase Auth via Apple provider
      // Use the UID from the client-side Apple Sign-In
      firebaseUid = appleFirebaseUid
      console.log('Using existing Apple Sign-In Firebase user:', firebaseUid)
    } else {
      // Email sign-up: create email/password account
      console.log('Creating Firebase user for:', email)
      // Pass true to update password if user exists (since we're sending them the email with this password)
      firebaseUid = await createFirebaseUser(email, tempPassword, true)

      if (!firebaseUid) {
        console.error('Failed to create Firebase user')
      } else {
        console.log('Firebase user created:', firebaseUid)
      }
    }

    // Prepare Firebase user data
    const firebaseUserData = {
      // Personal Info from userData
      age: userDataParsed?.age || 25,
      birthYear: userDataParsed?.birthYear || 2000,
      height: userDataParsed?.height || 170,
      weight: userDataParsed?.weight || 70,
      targetWeight: userDataParsed?.targetWeight || 65,
      targetSpeed: userDataParsed?.targetSpeed || 0.5,

      // Fitness Profile
      gender: userDataParsed?.gender || 'male',
      activityLevel: userDataParsed?.activityLevel || 'نشط إلى حد ما (تمرين معتدل 3-5 أيام في الأسبوع)',
      fitnessGoal: userDataParsed?.fitnessGoal || 'Lose Fat (Cut)',
      fitnessLevel: userDataParsed?.fitnessLevel || 'Intermediate',
      workoutLocation: userDataParsed?.workoutLocation || 'Gym',

      // User Selections
      challenges: userDataParsed?.challenges || [],
      accomplishments: userDataParsed?.accomplishments || [],

      // Calculated Metrics
      calculatedCalories: userDataParsed?.calculatedCalories || 1800,
      proteinGrams: userDataParsed?.proteinGrams || 180,
      carbsGrams: userDataParsed?.carbsGrams || 158,
      fatGrams: userDataParsed?.fatGrams || 50,

      // Macro Percentages
      proteinPercentage: userDataParsed?.proteinPercentage || 40,
      carbsPercentage: userDataParsed?.carbsPercentage || 35,
      fatPercentage: userDataParsed?.fatPercentage || 25,

      // Program Info
      programName: userDataParsed?.programName || 'Vega Shred 🔥',

      // Subscription
      subscription: {
        isActive: true,
        productId: streampayProductId || planConfig.productId, // Use actual StreamPay product ID if available
        expirationDate: expirationDate,
        startDate: now,
        planType: plan,
        amount: parseFloat(amount) || 155,
        currency: 'SAR',
        source: 'streampay_web',
        paymentId: sessionId,
        // StreamPay specific IDs for subscription management/cancellation
        streampayConsumerId: streampayConsumerId || undefined,
        streampayProductId: streampayProductId || undefined,
        // Subscription ID is created automatically by StreamPay when payment succeeds
        // and will be updated via webhook (subscription_activated event)
        // Don't set it here - let the webhook set it when it has the actual value
        autoRenew: true,
      },

      // Metadata
      onboardingCompleted: true,
      hasEverSubscribed: true,
      email: email,
      authMethod: authMethod || 'email',
      createdAt: now,
      lastUpdated: now,
    }

    // Save user data to Firestore
    if (firebaseUid) {
      await saveUserDataToFirestore(firebaseUid, firebaseUserData)
    }

    // Store subscription in Supabase (including StreamPay IDs for cancellation)
    const { error: insertError } = await supabase.from('app_subscriptions').insert({
      payment_id: sessionId || `streampay_${Date.now()}`,
      email: email,
      firebase_uid: firebaseUid,
      plan: plan,
      amount: parseFloat(amount) || 155,
      status: 'active',
      user_data: {
        ...firebaseUserData,
        // Ensure StreamPay IDs are stored in user_data as well
        // Don't set null values - Firestore might convert them to "null" strings
        ...(streampayConsumerId ? { streampayConsumerId } : {}),
        ...(streampayProductId ? { streampayProductId } : {}),
        // subscriptionId will be set via webhook when available
      },
      expires_at: expirationDate.toISOString(),
      payment_source: 'streampay',
      discount_code: discountCode || null,
    })

    if (insertError) {
      console.error('Failed to store subscription:', insertError)
    }

    // Send email
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey && firebaseUid) {
      try {
        // Different email content based on auth method
        const emailSubject = isAppleSignIn
          ? 'مرحباً بك في Vega Power - تم تفعيل اشتراكك 🎉'
          : 'مرحباً بك في Vega Power - بيانات تسجيل الدخول 🎉'

        const loginInstructions = isAppleSignIn
          ? `
            <div style="background: #fff; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">طريقة تسجيل الدخول</h2>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: #000; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #fff; font-size: 20px;">🍎</span>
                </div>
                <div>
                  <p style="margin: 0; color: #333; font-weight: bold;">تسجيل الدخول عبر Apple</p>
                  <p style="margin: 4px 0 0 0; color: #666; font-size: 13px;">اضغط "متابعة مع Apple" في التطبيق</p>
                </div>
              </div>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">خطوات تسجيل الدخول:</h3>
              <ol style="margin: 0; padding: 0 20px; color: #666; line-height: 2;">
                <li>حمّل تطبيق Vega Power من App Store أو Google Play</li>
                <li>افتح التطبيق واضغط "تسجيل الدخول"</li>
                <li>اضغط "متابعة مع Apple"</li>
                <li>سجّل دخولك بنفس حساب Apple الذي استخدمته للدفع</li>
              </ol>
            </div>
          `
          : `
            <div style="background: #fff; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">بيانات تسجيل الدخول</h2>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">البريد الإلكتروني</p>
                <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;" dir="ltr">${email}</p>
              </div>
              
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">كلمة المرور المؤقتة</p>
                <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px;" dir="ltr">${tempPassword}</p>
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
          `

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Vega Power <noreply@vegapowerstore.com>',
            to: email,
            subject: emailSubject,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #0D1A33, #1A2640); padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">مرحباً بك في Vega Power!</h1>
                  <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0 0;">تم تفعيل اشتراكك بنجاح</p>
                </div>
                
                ${loginInstructions}

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
                
                <div style="text-align: center; padding: 20px 0;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    تحتاج مساعدة؟ تواصل معنا<br>
                    © Vega Power - جميع الحقوق محفوظة
                  </p>
                </div>
              </div>
            `,
          }),
        })

        if (!emailResponse.ok) {
          console.error('Failed to send email:', await emailResponse.text())
        } else {
          console.log('Email sent successfully to:', email)
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }

    console.log('StreamPay verify-payment completed:', {
      email,
      plan,
      firebaseUid,
      sessionId,
    })

    return NextResponse.json({
      success: true,
      email,
      plan,
      amount: parseFloat(amount) || 155,
      authMethod: authMethod || 'email',
      firebaseUserCreated: !!firebaseUid,
    })

  } catch (error) {
    console.error('StreamPay verify-payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
