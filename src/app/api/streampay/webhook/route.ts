import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  createFirebaseUser, 
  saveUserDataToFirestore,
  getFirebaseUidByEmail,
  getUserDataFromFirestore,
  updateSubscriptionInFirestore,
  findUserByStreampayConsumerId,
} from '@/lib/firebase-admin'

// GET endpoint - Health check and webhook status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'StreamPay webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supportedEvents: [
      'payment.successful',
      'payment.completed',
      'payment_link.payment_successful',
      'subscription.renewed',
      'subscription.payment_successful',
      'recurring_payment.successful',
      'subscription.cancelled',
      'subscription.ended',
      'payment.failed',
      'subscription.payment_failed',
    ],
  })
}

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

// Calculate new expiration date based on plan
function calculateExpirationDate(plan: string, fromDate?: Date): Date {
  const date = fromDate ? new Date(fromDate) : new Date()
  
  if (plan === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  } else if (plan === 'quarterly') {
    date.setMonth(date.getMonth() + 3)
  } else {
    date.setMonth(date.getMonth() + 1)
  }
  
  return date
}

// Detect plan from product ID or amount
function detectPlanFromProduct(productId?: string, amount?: number): string {
  // Check product ID patterns
  if (productId) {
    const id = productId.toLowerCase()
    if (id.includes('year') || id.includes('annual')) return 'yearly'
    if (id.includes('quarter') || id.includes('3month')) return 'quarterly'
    if (id.includes('month')) return 'monthly'
  }
  
  // Fallback to amount detection (in SAR)
  if (amount) {
    const amountSAR = amount > 1000 ? amount / 100 : amount // Handle halalas
    if (amountSAR >= 150) return 'yearly'
    if (amountSAR >= 100) return 'quarterly'
  }
  
  return 'monthly'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('StreamPay webhook received:', JSON.stringify(body, null, 2))

    // Log webhook event for debugging (optional - can be removed later)
    const supabaseForLogging = createServerClient()
    await supabaseForLogging.from('webhook_logs').insert({
      source: 'streampay',
      event_type: body.event_type || 'unknown',
      payload: body,
      processed_at: new Date().toISOString(),
    }).then(() => {
      console.log('Webhook logged to database')
    }).catch((err) => {
      // Don't fail if logging table doesn't exist
      console.log('Webhook logging skipped (table may not exist):', err.message)
    })

    const {
      event_type,
      payment_id,
      subscription_id,
      consumer_id,
      product_id,
      status,
      customer,
      amount,
      currency,
      metadata,
    } = body

    const email = customer?.email || metadata?.email
    const consumerId = consumer_id || customer?.id || metadata?.consumerId
    const productId = product_id || metadata?.productId

    // =========================================
    // HANDLE SUBSCRIPTION RENEWALS
    // =========================================
    const renewalEvents = [
      'subscription.renewed',
      'subscription.payment_successful',
      'recurring_payment.successful',
    ]

    if (renewalEvents.includes(event_type)) {
      console.log('Processing subscription renewal:', { event_type, email, consumerId })
      
      // Find user by email or consumer ID
      let firebaseUid: string | null = null
      let userData: Record<string, unknown> | null = null
      
      if (email) {
        firebaseUid = await getFirebaseUidByEmail(email)
      }
      
      if (!firebaseUid && consumerId) {
        const userByConsumer = await findUserByStreampayConsumerId(consumerId)
        if (userByConsumer) {
          firebaseUid = userByConsumer.uid
          userData = userByConsumer.data
        }
      }

      if (!firebaseUid) {
        console.error('Renewal failed: User not found', { email, consumerId })
        return NextResponse.json({ received: true, error: 'User not found for renewal' }, { status: 404 })
      }

      // Get current user data if not already fetched
      if (!userData) {
        userData = await getUserDataFromFirestore(firebaseUid)
      }

      // Detect plan type
      const currentSubscription = userData?.subscription as Record<string, unknown> | undefined
      const plan = detectPlanFromProduct(productId, amount) || currentSubscription?.planType as string || 'monthly'
      const planConfig = plans[plan] || plans.monthly

      // Calculate new expiration (extend from current expiration if still active)
      const currentExpiration = currentSubscription?.expirationDate
      const baseDate = currentExpiration && new Date(currentExpiration as string) > new Date() 
        ? new Date(currentExpiration as string) 
        : new Date()
      const newExpirationDate = calculateExpirationDate(plan, baseDate)

      // Update subscription in Firebase
      const subscriptionUpdate = {
        ...(currentSubscription || {}),
        isActive: true,
        expirationDate: newExpirationDate,
        lastRenewalDate: new Date(),
        lastPaymentId: payment_id,
        renewalCount: ((currentSubscription?.renewalCount as number) || 0) + 1,
      }

      await updateSubscriptionInFirestore(firebaseUid, subscriptionUpdate)

      // Update Supabase
      const supabase = createServerClient()
      await supabase.from('app_subscriptions').insert({
        payment_id: payment_id || `renewal_${Date.now()}`,
        email: email || userData?.email as string,
        firebase_uid: firebaseUid,
        plan: plan,
        amount: typeof amount === 'number' ? (amount > 1000 ? amount / 100 : amount) : planConfig.days,
        status: 'active',
        expires_at: newExpirationDate.toISOString(),
        payment_source: 'streampay_renewal',
      })

      console.log('Subscription renewal processed:', {
        firebaseUid,
        plan,
        newExpiration: newExpirationDate,
      })

      return NextResponse.json({
        received: true,
        processed: true,
        event: 'renewal',
        newExpiration: newExpirationDate,
      })
    }

    // =========================================
    // HANDLE SUBSCRIPTION CANCELLATIONS
    // =========================================
    const cancellationEvents = [
      'subscription.cancelled',
      'subscription.canceled',
      'subscription.ended',
      'subscription.expired',
    ]

    if (cancellationEvents.includes(event_type)) {
      console.log('Processing subscription cancellation:', { event_type, email, consumerId })
      
      // Find user
      let firebaseUid: string | null = null
      
      if (email) {
        firebaseUid = await getFirebaseUidByEmail(email)
      }
      
      if (!firebaseUid && consumerId) {
        const userByConsumer = await findUserByStreampayConsumerId(consumerId)
        if (userByConsumer) {
          firebaseUid = userByConsumer.uid
        }
      }

      if (!firebaseUid) {
        console.error('Cancellation: User not found', { email, consumerId })
        return NextResponse.json({ received: true, error: 'User not found' }, { status: 404 })
      }

      // Get current subscription data
      const userData = await getUserDataFromFirestore(firebaseUid)
      const currentSubscription = userData?.subscription as Record<string, unknown> | undefined

      // Update subscription to cancelled (but keep expiration date for access until then)
      const subscriptionUpdate = {
        ...(currentSubscription || {}),
        isActive: false,
        cancelledAt: new Date(),
        autoRenew: false,
        status: 'cancelled',
      }

      await updateSubscriptionInFirestore(firebaseUid, subscriptionUpdate)

      // Update Supabase
      const supabase = createServerClient()
      await supabase.from('app_subscriptions')
        .update({ status: 'cancelled' })
        .eq('firebase_uid', firebaseUid)
        .eq('status', 'active')

      console.log('Subscription cancellation processed:', { firebaseUid })

      return NextResponse.json({
        received: true,
        processed: true,
        event: 'cancellation',
      })
    }

    // =========================================
    // HANDLE FAILED PAYMENTS
    // =========================================
    const failedEvents = [
      'payment.failed',
      'subscription.payment_failed',
      'recurring_payment.failed',
    ]

    if (failedEvents.includes(event_type)) {
      console.log('Processing failed payment:', { event_type, email, consumerId })
      
      // Find user
      let firebaseUid: string | null = null
      
      if (email) {
        firebaseUid = await getFirebaseUidByEmail(email)
      }
      
      if (!firebaseUid && consumerId) {
        const userByConsumer = await findUserByStreampayConsumerId(consumerId)
        if (userByConsumer) {
          firebaseUid = userByConsumer.uid
        }
      }

      if (firebaseUid) {
        // Get current subscription
        const userData = await getUserDataFromFirestore(firebaseUid)
        const currentSubscription = userData?.subscription as Record<string, unknown> | undefined

        // Mark payment failed (don't deactivate immediately - grace period)
        const subscriptionUpdate = {
          ...(currentSubscription || {}),
          lastPaymentFailed: true,
          lastPaymentFailedAt: new Date(),
          paymentFailCount: ((currentSubscription?.paymentFailCount as number) || 0) + 1,
        }

        await updateSubscriptionInFirestore(firebaseUid, subscriptionUpdate)
      }

      // Log to Supabase for tracking
      const supabase = createServerClient()
      await supabase.from('app_subscriptions').insert({
        payment_id: payment_id || `failed_${Date.now()}`,
        email: email || 'unknown',
        firebase_uid: firebaseUid,
        plan: detectPlanFromProduct(productId, amount),
        amount: typeof amount === 'number' ? (amount > 1000 ? amount / 100 : amount) : 0,
        status: 'failed',
        payment_source: 'streampay_failed',
      })

      console.log('Failed payment logged:', { firebaseUid, email })

      // TODO: Send email notification about failed payment

      return NextResponse.json({
        received: true,
        processed: true,
        event: 'payment_failed',
      })
    }

    // =========================================
    // HANDLE NEW PAYMENTS (Initial subscription)
    // =========================================
    const successEvents = [
      'payment.successful',
      'payment.completed',
      'payment_link.payment_successful',
    ]

    if (!successEvents.includes(event_type)) {
      console.log(`StreamPay webhook: Ignoring event type ${event_type}`)
      return NextResponse.json({ received: true, processed: false })
    }

    const plan = metadata?.plan || detectPlanFromProduct(productId, amount)
    const userDataFromMeta = metadata?.userData ? JSON.parse(metadata.userData) : null

    if (!email) {
      console.error('StreamPay webhook: No email found in payment')
      return NextResponse.json({ received: true, error: 'No email' }, { status: 400 })
    }

    // Check if already processed
    const supabase = createServerClient()
    const { data: existingSubscription } = await supabase
      .from('app_subscriptions')
      .select('id, firebase_uid')
      .eq('payment_id', payment_id)
      .single()

    if (existingSubscription) {
      console.log('StreamPay webhook: Payment already processed', payment_id)
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Calculate subscription expiration
    const now = new Date()
    const expirationDate = calculateExpirationDate(plan)
    const planConfig = plans[plan] || plans.monthly

    // Create Firebase user
    console.log('Creating Firebase user for:', email)
    const firebaseUid = await createFirebaseUser(email, tempPassword)

    if (!firebaseUid) {
      console.error('Failed to create Firebase user')
    } else {
      console.log('Firebase user created:', firebaseUid)
    }

    // Prepare Firebase user data
    const firebaseUserData = {
      // Personal Info from metadata
      age: userDataFromMeta?.age || 25,
      birthYear: userDataFromMeta?.birthYear || 2000,
      height: userDataFromMeta?.height || 170,
      weight: userDataFromMeta?.weight || 70,
      targetWeight: userDataFromMeta?.targetWeight || 65,
      targetSpeed: userDataFromMeta?.targetSpeed || 0.5,

      // Fitness Profile
      gender: userDataFromMeta?.gender || 'male',
      activityLevel: userDataFromMeta?.activityLevel || 'نشط إلى حد ما (تمرين معتدل 3-5 أيام في الأسبوع)',
      fitnessGoal: userDataFromMeta?.fitnessGoal || 'Lose Fat (Cut)',
      fitnessLevel: 'متوسط',
      workoutLocation: 'Gym',

      // User Selections
      challenges: userDataFromMeta?.challenges || [],
      accomplishments: userDataFromMeta?.accomplishments || [],

      // Calculated Metrics
      calculatedCalories: userDataFromMeta?.calculatedCalories || 1800,
      proteinGrams: userDataFromMeta?.proteinGrams || 180,
      carbsGrams: userDataFromMeta?.carbsGrams || 158,
      fatGrams: userDataFromMeta?.fatGrams || 50,

      // Macro Percentages
      proteinPercentage: userDataFromMeta?.proteinPercentage || 40,
      carbsPercentage: userDataFromMeta?.carbsPercentage || 35,
      fatPercentage: userDataFromMeta?.fatPercentage || 25,

      // Program Info
      programName: userDataFromMeta?.programName || 'Vega Shred 🔥',

      // Subscription with StreamPay IDs
      subscription: {
        isActive: true,
        productId: productId || planConfig.productId,
        expirationDate: expirationDate,
        startDate: now,
        planType: plan,
        amount: typeof amount === 'number' ? (amount > 1000 ? amount / 100 : amount) : planConfig.days,
        currency: currency || 'SAR',
        source: 'streampay_web',
        paymentId: payment_id,
        // StreamPay IDs for subscription management
        streampayConsumerId: consumerId || null,
        streampayProductId: productId || null,
        streampaySubscriptionId: subscription_id || null,
        autoRenew: true,
        renewalCount: 0,
      },

      // Metadata
      onboardingCompleted: true,
      hasEverSubscribed: true,
      email: email,
      createdAt: now,
      lastUpdated: now,
    }

    // Save user data to Firestore
    if (firebaseUid) {
      await saveUserDataToFirestore(firebaseUid, firebaseUserData)
    }

    // Store subscription in Supabase
    const { error: insertError } = await supabase.from('app_subscriptions').insert({
      payment_id: payment_id,
      email: email,
      firebase_uid: firebaseUid,
      plan: plan,
      amount: typeof amount === 'number' ? (amount > 1000 ? amount / 100 : amount) : planConfig.days,
      status: 'active',
      user_data: firebaseUserData,
      expires_at: expirationDate.toISOString(),
      payment_source: 'streampay',
    })

    if (insertError) {
      console.error('Failed to store subscription:', insertError)
    }

    // Send email with temporary password
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey && firebaseUid) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Vega Power <noreply@vegapowerstore.com>',
            to: email,
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
                    <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: bold;" dir="ltr">${email}</p>
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
        } else {
          console.log('Email sent successfully to:', email)
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr)
      }
    }

    console.log('StreamPay webhook processed successfully:', {
      payment_id,
      email,
      plan,
      firebaseUid,
    })

    return NextResponse.json({
      received: true,
      processed: true,
      email,
      plan,
    })

  } catch (error) {
    console.error('StreamPay webhook error:', error)
    return NextResponse.json(
      { received: true, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
