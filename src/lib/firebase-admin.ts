import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  console.log('Firebase Admin init check:', {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length,
  })

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin credentials not configured:', {
      projectId: projectId ? 'SET' : 'MISSING',
      clientEmail: clientEmail ? 'SET' : 'MISSING',
      privateKey: privateKey ? 'SET' : 'MISSING',
    })
    return null
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
    console.log('Firebase Admin initialized successfully for project:', projectId)
    return app
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    return null
  }
}

export async function createFirebaseUser(email: string, password: string, updatePasswordIfExists = false): Promise<string | null> {
  console.log('Creating Firebase user for:', email)
  
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available')
    return null
  }

  try {
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email)
      console.log('User already exists:', existingUser.uid)
      
      // Only update password if explicitly requested (e.g., from verify-payment, not webhook)
      if (updatePasswordIfExists) {
        await admin.auth().updateUser(existingUser.uid, { password })
        console.log('Password updated for existing user:', existingUser.uid)
      } else {
        console.log('Skipping password update for existing user (preserving original password)')
      }
      
      return existingUser.uid
    } catch (lookupError: unknown) {
      // User doesn't exist, will create new one
      const errorCode = (lookupError as { code?: string })?.code
      if (errorCode !== 'auth/user-not-found') {
        console.error('Error looking up user:', lookupError)
      } else {
        console.log('User not found, creating new user...')
      }
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    })

    console.log('Created Firebase user successfully:', {
      uid: userRecord.uid,
      email: userRecord.email,
    })
    
    return userRecord.uid
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string }
    console.error('Error creating Firebase user:', {
      code: firebaseError.code,
      message: firebaseError.message,
      email,
    })
    return null
  }
}

export async function saveUserDataToFirestore(uid: string, userData: Record<string, unknown>): Promise<boolean> {
  console.log('Saving user data to Firestore for:', uid)
  
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available for Firestore')
    return false
  }

  try {
    const db = admin.firestore()
    await db.collection('users').doc(uid).set(userData, { merge: true })
    console.log('Saved user data to Firestore successfully for:', uid)
    return true
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string }
    console.error('Error saving to Firestore:', {
      code: firestoreError.code,
      message: firestoreError.message,
      uid,
    })
    return false
  }
}

// Get Firebase UID by email
export async function getFirebaseUidByEmail(email: string): Promise<string | null> {
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available')
    return null
  }

  try {
    const user = await admin.auth().getUserByEmail(email)
    return user.uid
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code
    if (errorCode === 'auth/user-not-found') {
      console.log('User not found for email:', email)
      return null
    }
    console.error('Error getting user by email:', error)
    return null
  }
}

// Get user data from Firestore by UID
export async function getUserDataFromFirestore(uid: string): Promise<Record<string, unknown> | null> {
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available for Firestore')
    return null
  }

  try {
    const db = admin.firestore()
    const doc = await db.collection('users').doc(uid).get()
    if (doc.exists) {
      return doc.data() as Record<string, unknown>
    }
    return null
  } catch (error: unknown) {
    console.error('Error getting user data from Firestore:', error)
    return null
  }
}

// Update subscription in Firestore (for renewals, cancellations, etc.)
export async function updateSubscriptionInFirestore(
  uid: string, 
  subscriptionUpdate: Record<string, unknown>
): Promise<boolean> {
  console.log('Updating subscription in Firestore for:', uid)
  
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available for Firestore')
    return false
  }

  try {
    const db = admin.firestore()
    await db.collection('users').doc(uid).update({
      'subscription': subscriptionUpdate,
      'lastUpdated': new Date(),
    })
    console.log('Updated subscription in Firestore successfully for:', uid)
    return true
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string }
    console.error('Error updating subscription in Firestore:', {
      code: firestoreError.code,
      message: firestoreError.message,
      uid,
    })
    return false
  }
}

// Find Firebase user by StreamPay consumer ID (searches Firestore)
export async function findUserByStreampayConsumerId(consumerId: string): Promise<{ uid: string; data: Record<string, unknown> } | null> {
  console.log('findUserByStreampayConsumerId called with:', consumerId)
  
  const app = getFirebaseAdmin()
  if (!app) {
    console.error('Firebase Admin app not available for Firestore')
    return null
  }

  try {
    const db = admin.firestore()
    console.log('Querying Firestore: users where subscription.streampayConsumerId ==', consumerId)
    
    const snapshot = await db.collection('users')
      .where('subscription.streampayConsumerId', '==', consumerId)
      .limit(1)
      .get()
    
    console.log('Firestore query result:', { 
      empty: snapshot.empty, 
      size: snapshot.size,
      consumerId 
    })
    
    if (snapshot.empty) {
      console.log('No user found with StreamPay consumer ID:', consumerId)
      return null
    }

    const doc = snapshot.docs[0]
    console.log('Found user document:', doc.id)
    return {
      uid: doc.id,
      data: doc.data() as Record<string, unknown>,
    }
  } catch (error: unknown) {
    // Check if it's an index error
    const errorMessage = (error as { message?: string })?.message || ''
    if (errorMessage.includes('index')) {
      console.error('FIRESTORE INDEX REQUIRED! Create index for subscription.streampayConsumerId')
      console.error('Full error:', error)
    } else {
      console.error('Error finding user by StreamPay consumer ID:', error)
    }
    return null
  }
}
