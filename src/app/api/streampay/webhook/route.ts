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
import { trackSnapchatPurchase } from '@/lib/snapchat-capi'

// GET endpoint - Health check and webhook status
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'StreamPay webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supportedEvents: [
      // StreamPay actual event names
      'PAYMENT_SUCCEEDED',
      'SUBSCRIPTION_ACTIVATED',
      'PAYMENT_FAILED',
      'PAYMENT_CANCELED',
      'SUBSCRIPTION_INACTIVATED',
      'SUBSCRIPTION_CANCELED',
      'INVOICE_ACCEPTED',
      'INVOICE_COMPLETE',
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
    try {
      const supabaseForLogging = createServerClient()
      const { error: logError } = await supabaseForLogging.from('webhook_logs').insert({
        source: 'streampay',
        event_type: body.event_type || 'unknown',
        payload: body,
        processed_at: new Date().toISOString(),
      })
      if (logError) {
        console.log('Webhook logging skipped (table may not exist):', logError.message)
      } else {
        console.log('Webhook logged to database')
      }
    } catch (logErr) {
      // Don't fail if logging table doesn't exist
      console.log('Webhook logging skipped:', logErr)
    }

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
      // StreamPay might send subscription data in different ways
      id,
      subscription,
      data,
      // Additional possible fields
      resource,
      object,
      payload,
      organization_consumer_id,
    } = body

    // Log the FULL webhook payload for SUBSCRIPTION events to debug structure
    if (event_type === 'SUBSCRIPTION_ACTIVATED' || event_type === 'PAYMENT_SUCCEEDED') {
      console.log('=== FULL WEBHOOK PAYLOAD ===')
      console.log(JSON.stringify(body, null, 2))
      console.log('=== END PAYLOAD ===')
    }

    // Extract email - StreamPay puts it in various places
    const email = customer?.email || metadata?.email || data?.customer?.email || 
                  resource?.customer?.email || object?.customer?.email || payload?.customer?.email ||
                  body?.organization_consumer?.email ||
                  data?.organization_consumer?.email  // StreamPay nested consumer email
    
    // Extract consumer ID - StreamPay uses data.customer_id.id structure
    // IMPORTANT: Check data.customer_id.id FIRST since that's what StreamPay actually sends
    const consumerId = data?.customer_id?.id ||       // StreamPay: data.customer_id.id (PRIORITY!)
                       body?.data?.customer_id?.id || // StreamPay nested
                       consumer_id || customer?.id || metadata?.consumerId || data?.consumer_id ||
                       organization_consumer_id || body?.organization_consumer_id ||
                       resource?.consumer_id || object?.consumer_id
    
    console.log('Consumer ID extraction:', {
      'data?.customer_id?.id': data?.customer_id?.id,
      'extracted_consumerId': consumerId,
    })
    
    const productId = product_id || metadata?.productId || data?.product_id ||
                      resource?.product_id || object?.product_id
    
    // Try to extract subscription_id from ALL possible locations
    // StreamPay uses: data.subscription.id and entity_id
    const subscriptionId = 
      subscription_id ||                          // Direct field
      body?.entity_id ||                          // StreamPay: entity_id (for SUBSCRIPTION events)
      data?.subscription?.id ||                   // StreamPay: data.subscription.id
      body?.data?.subscription?.id ||             // StreamPay nested: body.data.subscription.id
      id ||                                       // Root id
      subscription?.id ||                         // Nested subscription.id
      data?.subscription_id ||                    // data.subscription_id
      data?.id ||                                 // data.id
      resource?.id ||                             // resource.id (common webhook pattern)
      resource?.subscription_id ||                // resource.subscription_id
      object?.id ||                               // object.id
      object?.subscription_id ||                  // object.subscription_id
      payload?.id ||                              // payload.id
      payload?.subscription_id ||                 // payload.subscription_id
      body?.subscription?.id ||                   // body.subscription.id
      metadata?.subscription_id                   // metadata.subscription_id

    // =========================================
    // HANDLE SUBSCRIPTION ACTIVATED (Capture subscription ID)
    // =========================================
    if (event_type === 'SUBSCRIPTION_ACTIVATED') {
      console.log('=== SUBSCRIPTION_ACTIVATED EVENT ===')
      console.log('Extracted values:', { 
        event_type, 
        email, 
        consumerId, 
        subscriptionId,
        bodyKeys: Object.keys(body),
      })
      
      // If subscriptionId is null, log all possible ID fields for debugging
      if (!subscriptionId) {
        console.log('WARNING: subscriptionId is NULL! Checking all possible fields:')
        console.log({
          'body.entity_id': body.entity_id,
          'body.data?.subscription?.id': body.data?.subscription?.id,
          'body.subscription_id': body.subscription_id,
          'body.id': body.id,
          'body.subscription?.id': body.subscription?.id,
          'body.data?.subscription_id': body.data?.subscription_id,
          'body.data?.id': body.data?.id,
        })
      }
      
      // If consumerId is null, log for debugging
      if (!consumerId) {
        console.log('WARNING: consumerId is NULL! Checking all possible fields:')
        console.log({
          'body.data?.customer_id?.id': body.data?.customer_id?.id,
          'body.consumer_id': body.consumer_id,
          'body.customer?.id': body.customer?.id,
          'body.organization_consumer_id': body.organization_consumer_id,
        })
      }
      
      // Find user by email or consumer ID
      let firebaseUid: string | null = null
      let userEmail = email
      const supabase = createServerClient()
      
      // If no email but we have consumer ID, try to get email from StreamPay API
      if (!userEmail && consumerId) {
        try {
          const apiKey = process.env.STREAMPAY_API_KEY
          if (apiKey) {
            const StreamSDK = (await import('@streamsdk/typescript')).default
            const client = StreamSDK.init(apiKey)
            console.log('Fetching consumer from StreamPay:', consumerId)
            const consumer = await client.getConsumer(consumerId)
            console.log('StreamPay consumer response:', JSON.stringify(consumer, null, 2))
            // Email is directly on the consumer object
            userEmail = consumer?.email || undefined
            if (userEmail) {
              console.log('Got email from StreamPay consumer:', userEmail)
            } else {
              console.log('No email found in consumer response')
            }
          }
        } catch (err) {
          console.log('Could not fetch consumer from StreamPay:', err)
        }
      }
      
      console.log('User lookup - email:', userEmail, 'consumerId:', consumerId)
      
      if (userEmail) {
        firebaseUid = await getFirebaseUidByEmail(userEmail)
        console.log('Found user by email:', { userEmail, firebaseUid })
      }
      
      // Helper function to search for user with retries
      // (webhook often arrives BEFORE verify-payment creates the user)
      const findUserWithRetry = async (maxRetries = 3, delayMs = 2000): Promise<string | null> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`Attempt ${attempt}/${maxRetries} to find user...`)
          
          // Try by email first
          if (userEmail) {
            const uidByEmail = await getFirebaseUidByEmail(userEmail)
            if (uidByEmail) {
              console.log(`Found user by email on attempt ${attempt}:`, uidByEmail)
              return uidByEmail
            }
          }
          
          // Try by consumer ID
          if (consumerId) {
            const userByConsumer = await findUserByStreampayConsumerId(consumerId)
            if (userByConsumer) {
              console.log(`Found user by consumer ID on attempt ${attempt}:`, userByConsumer.uid)
              return userByConsumer.uid
            }
          }
          
          // If not found and not last attempt, wait and retry
          if (attempt < maxRetries) {
            console.log(`User not found, waiting ${delayMs}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }
        }
        return null
      }
      
      // Search with retries (gives verify-payment time to create the user)
      if (!firebaseUid) {
        firebaseUid = await findUserWithRetry(3, 2000) // 3 attempts, 2 seconds apart
      }

      if (firebaseUid && subscriptionId) {
        // Update user's subscription with the subscription ID
        const userData = await getUserDataFromFirestore(firebaseUid)
        const currentSubscription = userData?.subscription as Record<string, unknown> | undefined

        const subscriptionUpdate = {
          ...(currentSubscription || {}),
          streampaySubscriptionId: subscriptionId,
          subscriptionActivatedAt: new Date(),
        }

        await updateSubscriptionInFirestore(firebaseUid, subscriptionUpdate)
        
        // Also update Supabase
        const supabase = createServerClient()
        await supabase.from('app_subscriptions')
          .update({ 
            user_data: { 
              ...(userData || {}), 
              subscription: subscriptionUpdate 
            } 
          })
          .eq('firebase_uid', firebaseUid)
          .eq('status', 'active')

        console.log('Subscription ID saved:', { firebaseUid, subscriptionId })
      } else {
        console.log('WARNING: Could not save subscription ID:', { 
          reason: !firebaseUid ? 'User not found in Firebase' : 'No subscriptionId extracted',
          email, 
          consumerId, 
          subscriptionId,
          firebaseUid,
        })
      }

      return NextResponse.json({
        received: true,
        processed: !!subscriptionId && !!firebaseUid,
        event: 'subscription_activated',
        subscriptionId: subscriptionId || null,
        userFound: !!firebaseUid,
        debug: {
          emailFound: !!email,
          consumerIdFound: !!consumerId,
          subscriptionIdFound: !!subscriptionId,
        }
      })
    }

    // =========================================
    // HANDLE SUBSCRIPTION RENEWALS (Invoice complete = recurring payment)
    // =========================================
    const renewalEvents = [
      'INVOICE_COMPLETE',  // Recurring payment completed
      'INVOICE_ACCEPTED',  // Invoice accepted (might indicate renewal)
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
      'SUBSCRIPTION_CANCELED',
      'SUBSCRIPTION_INACTIVATED',
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
      'PAYMENT_FAILED',
      'PAYMENT_CANCELED',
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
      'PAYMENT_SUCCEEDED',
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

    // Also check by email if recently processed (within last 5 minutes)
    // This prevents double emails when both verify-payment and webhook fire
    const { data: recentByEmail } = await supabase
      .from('app_subscriptions')
      .select('id, firebase_uid, created_at')
      .eq('email', email)
      .eq('payment_source', 'streampay')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const wasRecentlyProcessed = recentByEmail && 
      new Date(recentByEmail.created_at) > fiveMinutesAgo

    if (wasRecentlyProcessed) {
      console.log('StreamPay webhook: User was recently processed by verify-payment, skipping', email)
      return NextResponse.json({ 
        received: true, 
        alreadyProcessed: true, 
        reason: 'recently_created_by_verify_payment' 
      })
    }

    // Check if user already exists in Firebase (created by verify-payment)
    const existingFirebaseUid = await getFirebaseUidByEmail(email)
    let userAlreadyExists = false
    
    if (existingFirebaseUid) {
      // Check if user has subscription data (means verify-payment already handled it)
      const existingUserData = await getUserDataFromFirestore(existingFirebaseUid)
      if (existingUserData?.subscription && existingUserData?.onboardingCompleted) {
        userAlreadyExists = true
        console.log('StreamPay webhook: User already exists with subscription, skipping email', email)
      }
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Calculate subscription expiration
    const now = new Date()
    const expirationDate = calculateExpirationDate(plan)
    const planConfig = plans[plan] || plans.monthly

    // Create Firebase user (or get existing)
    // Pass true to update password if user exists (since we're sending them the email with this password)
    console.log('Creating/getting Firebase user for:', email)
    const firebaseUid = await createFirebaseUser(email, tempPassword, true)

    if (!firebaseUid) {
      console.error('Failed to create Firebase user')
    } else {
      console.log('Firebase user ready:', firebaseUid)
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
        // Only set if we have actual values (avoid null -> "null" string conversion)
        ...(consumerId ? { streampayConsumerId: consumerId } : {}),
        ...(productId ? { streampayProductId: productId } : {}),
        ...(subscriptionId ? { streampaySubscriptionId: subscriptionId } : {}),
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

    // Send email as FALLBACK if user wasn't already processed by verify-payment
    // This ensures user gets their credentials even if the redirect fails
    if (!userAlreadyExists && firebaseUid) {
      const resendApiKey = process.env.RESEND_API_KEY
      if (resendApiKey) {
        try {
          console.log('Webhook: Sending welcome email as fallback to:', email)
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
            console.error('Webhook: Failed to send email:', await emailResponse.text())
          } else {
            console.log('Webhook: Email sent successfully to:', email)
          }
        } catch (emailErr) {
          console.error('Webhook: Email error:', emailErr)
        }
      } else {
        console.log('Webhook: RESEND_API_KEY not configured, cannot send email')
      }
    } else {
      console.log('Webhook: User already exists or no firebaseUid, skipping email:', { userAlreadyExists, hasFirebaseUid: !!firebaseUid })
    }

    // Track purchase with Snapchat CAPI (fire-and-forget)
    const finalAmount = typeof amount === 'number' ? (amount > 1000 ? amount / 100 : amount) : plans[plan]?.days || 155
    trackSnapchatPurchase({
      email,
      value: finalAmount,
      currency: currency || 'SAR',
      plan,
      paymentId: payment_id,
    }).catch(err => console.error('Snapchat CAPI tracking error (webhook):', err))

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
