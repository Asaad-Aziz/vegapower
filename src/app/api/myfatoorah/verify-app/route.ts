import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { decryptPaymentData } from '@/lib/myfatoorah'
import { createFirebaseUser, saveUserDataToFirestore, getFirebaseUidByEmail } from '@/lib/firebase-admin'
import { ttServerCompletePayment } from '@/lib/tiktok-events-api'

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
    const body = await request.json()
    const {
      paymentData,
      encryptionKey,
      email,
      plan,
      amount,
      userData,
      discountCode,
      authMethod,
      appleFirebaseUid,
    } = body

    console.log('MyFatoorah verify-app called:', { email, plan, amount, authMethod })

    if (!paymentData || !encryptionKey || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const decrypted = decryptPaymentData(paymentData, encryptionKey)
    if (!decrypted) {
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt payment data' },
        { status: 500 }
      )
    }

    console.log('MyFatoorah decrypted (app):', JSON.stringify(decrypted, null, 2))

    if (decrypted.Invoice.Status !== 'PAID' || decrypted.Transaction.Status !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: `Payment not successful: ${decrypted.Invoice.Status}/${decrypted.Transaction.Status}` },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const mfPaymentId = `mf_app_${decrypted.Invoice.Id}`
    const paidAmount = parseFloat(amount) || parseFloat(decrypted.Amount.ValueInBaseCurrency) || 187

    const { data: existing } = await supabase
      .from('app_subscriptions')
      .select('id')
      .eq('payment_id', mfPaymentId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, email, alreadyProcessed: true })
    }

    const isAppleSignIn = authMethod === 'apple' && appleFirebaseUid

    // Check if Firebase user already exists to avoid overwriting password and re-sending email on refresh
    const existingFirebaseUser = !isAppleSignIn ? !!(await getFirebaseUidByEmail(email)) : false

    const tempPassword = isAppleSignIn ? '' : generatePassword()

    const now = new Date()
    const expirationDate = new Date(now)
    if (plan === 'monthly') {
      expirationDate.setDate(expirationDate.getDate() + 30)
    } else {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    }

    let userDataParsed = null
    if (userData) {
      try {
        userDataParsed = typeof userData === 'string' ? JSON.parse(userData) : userData
      } catch (e) {
        console.error('Failed to parse userData:', e)
      }
    }

    let firebaseUid: string | null = null
    if (isAppleSignIn) {
      firebaseUid = appleFirebaseUid
    } else {
      firebaseUid = await createFirebaseUser(email, tempPassword, !existingFirebaseUser)
    }

    const firebaseUserData = {
      age: userDataParsed?.age || 25,
      birthYear: userDataParsed?.birthYear || 2000,
      height: userDataParsed?.height || 170,
      weight: userDataParsed?.weight || 70,
      targetWeight: userDataParsed?.targetWeight || 65,
      targetSpeed: userDataParsed?.targetSpeed || 0.5,
      gender: userDataParsed?.gender || 'male',
      activityLevel: userDataParsed?.activityLevel || '',
      fitnessGoal: userDataParsed?.fitnessGoal || '',
      fitnessLevel: userDataParsed?.fitnessLevel || 'Intermediate',
      workoutLocation: userDataParsed?.workoutLocation || 'Gym',
      challenges: userDataParsed?.challenges || [],
      accomplishments: userDataParsed?.accomplishments || [],
      daysPerWeek: userDataParsed?.daysPerWeek || '5',
      splitPreference: userDataParsed?.splitPreference || 'ai_decide',
      trainingStyle: userDataParsed?.trainingStyle || 'mixed',
      priorityMuscles: userDataParsed?.priorityMuscles || [],
      injuries: userDataParsed?.injuries || [],
      cardioPreference: userDataParsed?.cardioPreference || 'no_cardio',
      calculatedCalories: userDataParsed?.calculatedCalories || 1800,
      proteinGrams: userDataParsed?.proteinGrams || 180,
      carbsGrams: userDataParsed?.carbsGrams || 158,
      fatGrams: userDataParsed?.fatGrams || 50,
      proteinPercentage: userDataParsed?.proteinPercentage || 40,
      carbsPercentage: userDataParsed?.carbsPercentage || 35,
      fatPercentage: userDataParsed?.fatPercentage || 25,
      programName: userDataParsed?.programName || 'Vega Power',
      subscription: {
        isActive: true,
        productId: plan === 'monthly' ? 'myfatoorah_monthly' : 'myfatoorah_yearly',
        expirationDate,
        startDate: now,
        planType: plan || 'yearly',
        amount: paidAmount,
        currency: 'SAR',
        source: 'myfatoorah_web',
        paymentId: mfPaymentId,
        autoRenew: false,
      },
      onboardingCompleted: true,
      hasEverSubscribed: true,
      email,
      authMethod: authMethod || 'email',
      createdAt: now,
      lastUpdated: now,
    }

    if (firebaseUid) {
      await saveUserDataToFirestore(firebaseUid, firebaseUserData)
    }

    await supabase.from('app_subscriptions').insert({
      payment_id: mfPaymentId,
      email,
      firebase_uid: firebaseUid,
      plan: plan || 'yearly',
      amount: paidAmount,
      status: 'active',
      user_data: firebaseUserData,
      expires_at: expirationDate.toISOString(),
      payment_source: 'myfatoorah',
      discount_code: discountCode || null,
    })

    const { error: orderError } = await supabase.from('orders').insert({
      buyer_email: email,
      amount_sar: paidAmount,
      status: 'paid',
      moyasar_payment_id: mfPaymentId,
      discount_code: discountCode || null,
    })
    if (orderError && orderError.code !== '23505') {
      console.error('Failed to create order for affiliate tracking:', orderError)
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey && firebaseUid && !existingFirebaseUser) {
      try {
        const emailSubject = isAppleSignIn
          ? 'مرحباً بك في Vega Power - تم تفعيل اشتراكك 🎉'
          : 'مرحباً بك في Vega Power - بيانات تسجيل الدخول 🎉'

        const loginInstructions = isAppleSignIn
          ? `<div style="background:#fff;padding:25px;border-radius:12px;margin-bottom:20px">
              <h2 style="color:#333;margin:0 0 20px;font-size:18px">طريقة تسجيل الدخول</h2>
              <div style="background:#f3f4f6;padding:15px;border-radius:8px">
                <p style="margin:0;color:#333;font-weight:bold">تسجيل الدخول عبر Apple</p>
                <p style="margin:4px 0 0;color:#666;font-size:13px">اضغط "متابعة مع Apple" في التطبيق</p>
              </div>
            </div>`
          : `<div style="background:#fff;padding:25px;border-radius:12px;margin-bottom:20px">
              <h2 style="color:#333;margin:0 0 20px;font-size:18px">بيانات تسجيل الدخول</h2>
              <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:15px">
                <p style="margin:0 0 5px;color:#666;font-size:12px">البريد الإلكتروني</p>
                <p style="margin:0;color:#10b981;font-size:16px;font-weight:bold" dir="ltr">${email}</p>
              </div>
              <div style="background:#f3f4f6;padding:15px;border-radius:8px">
                <p style="margin:0 0 5px;color:#666;font-size:12px">كلمة المرور المؤقتة</p>
                <p style="margin:0;color:#10b981;font-size:24px;font-weight:bold;font-family:monospace;letter-spacing:2px" dir="ltr">${tempPassword}</p>
              </div>
            </div>`

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Vega Power <noreply@vegapowerstore.com>',
            to: email,
            subject: emailSubject,
            html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8f9fa">
              <div style="background:linear-gradient(135deg,#0D1A33,#1A2640);padding:30px;border-radius:16px;text-align:center;margin-bottom:20px">
                <div style="font-size:48px;margin-bottom:10px">👑</div>
                <h1 style="color:#fff;margin:0;font-size:24px">مرحباً بك في Vega Power!</h1>
                <p style="color:rgba(255,255,255,0.7);margin:10px 0 0">تم تفعيل اشتراكك بنجاح</p>
              </div>
              ${loginInstructions}
              <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;padding:20px;border-radius:12px;margin-bottom:20px;text-align:center">
                <h3 style="margin:0 0 15px;font-size:16px">خطتك الشخصية: ${firebaseUserData.programName}</h3>
                <div style="display:flex;justify-content:space-around">
                  <div><div style="font-size:24px;font-weight:bold">${firebaseUserData.calculatedCalories}</div><div style="font-size:11px;opacity:0.8">سعرة/يوم</div></div>
                  <div><div style="font-size:24px;font-weight:bold">${firebaseUserData.proteinGrams}g</div><div style="font-size:11px;opacity:0.8">بروتين</div></div>
                  <div><div style="font-size:24px;font-weight:bold">${firebaseUserData.carbsGrams}g</div><div style="font-size:11px;opacity:0.8">كارب</div></div>
                </div>
              </div>
              <div style="text-align:center;padding:20px 0">
                <p style="color:#999;font-size:12px;margin:0">تحتاج مساعدة؟ تواصل معنا<br>© Vega Power - جميع الحقوق محفوظة</p>
              </div>
            </div>`,
          }),
        })
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }

    // TikTok Events API (server-side, non-blocking)
    ttServerCompletePayment({
      email,
      value: paidAmount,
      contentId: plan === 'monthly' ? 'myfatoorah_monthly' : 'myfatoorah_yearly',
      contentName: `Vega Power App - ${plan === 'monthly' ? 'شهري' : 'سنوي'}`,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      email,
      plan: plan || 'yearly',
      amount: paidAmount,
      authMethod: authMethod || 'email',
      firebaseUserCreated: !!firebaseUid,
    })
  } catch (error) {
    console.error('MyFatoorah verify-app error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
