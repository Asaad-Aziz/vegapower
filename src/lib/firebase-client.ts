import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, signInWithPopup, OAuthProvider, type Auth, type User } from 'firebase/auth'

// Lazy initialization - only runs on client side when actually needed
let app: FirebaseApp | null = null
let auth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client can only be used in the browser')
  }

  if (!auth) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vegapower-app',
    }

    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
  }

  return auth
}

export interface AppleSignInResult {
  uid: string
  email: string | null
  displayName: string | null
}

/**
 * Sign in with Apple using Firebase Auth.
 * Opens a popup where the user authenticates with their Apple ID.
 * 
 * Prerequisites:
 * 1. Apple Sign-In provider must be enabled in Firebase Console > Authentication > Sign-in method
 * 2. Apple Services ID must be configured for your web domain
 * 3. NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN must be set in .env.local
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const firebaseAuth = getFirebaseAuth()

  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')

  // Use Arabic locale for Apple Sign-In page
  provider.setCustomParameters({
    locale: 'ar',
  })

  const result = await signInWithPopup(firebaseAuth, provider)
  const user: User = result.user

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}
