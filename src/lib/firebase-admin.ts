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

export async function createFirebaseUser(email: string, password: string): Promise<string | null> {
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
      console.log('User already exists, updating password for:', existingUser.uid)
      await admin.auth().updateUser(existingUser.uid, { password })
      console.log('Password updated successfully for:', existingUser.uid)
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
