import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin credentials not configured')
    return null
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    return null
  }
}

export async function createFirebaseUser(email: string, password: string) {
  const app = getFirebaseAdmin()
  if (!app) return null

  try {
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email)
      console.log('User already exists:', existingUser.uid)
      // Update password for existing user
      await admin.auth().updateUser(existingUser.uid, { password })
      return existingUser.uid
    } catch {
      // User doesn't exist, create new one
    }

    // Create new user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true, // Mark as verified since they paid
    })

    console.log('Created Firebase user:', userRecord.uid)
    return userRecord.uid
  } catch (error) {
    console.error('Error creating Firebase user:', error)
    return null
  }
}

export async function saveUserDataToFirestore(uid: string, userData: Record<string, unknown>) {
  const app = getFirebaseAdmin()
  if (!app) return false

  try {
    const db = admin.firestore()
    await db.collection('users').doc(uid).set(userData, { merge: true })
    console.log('Saved user data to Firestore for:', uid)
    return true
  } catch (error) {
    console.error('Error saving to Firestore:', error)
    return false
  }
}
