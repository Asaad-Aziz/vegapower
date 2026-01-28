import { NextRequest, NextResponse } from 'next/server'
import { 
  getFirebaseUidByEmail,
  getUserDataFromFirestore,
  updateSubscriptionInFirestore,
} from '@/lib/firebase-admin'
import { createServerClient } from '@/lib/supabase'

// POST - Update subscription ID for a user (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, subscriptionId, adminKey } = body

    // Simple admin key check (you should use a proper auth system)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!email || !subscriptionId) {
      return NextResponse.json(
        { error: 'Email and subscriptionId are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const firebaseUid = await getFirebaseUidByEmail(email)
    
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      )
    }

    // Get current subscription data
    const userData = await getUserDataFromFirestore(firebaseUid)
    const currentSubscription = userData?.subscription as Record<string, unknown> | undefined

    // Update subscription with the subscription ID
    const subscriptionUpdate = {
      ...(currentSubscription || {}),
      streampaySubscriptionId: subscriptionId,
      subscriptionIdUpdatedAt: new Date(),
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

    console.log('Subscription ID manually updated:', { email, firebaseUid, subscriptionId })

    return NextResponse.json({
      success: true,
      email,
      firebaseUid,
      subscriptionId,
    })

  } catch (error) {
    console.error('Error updating subscription ID:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription ID' },
      { status: 500 }
    )
  }
}
