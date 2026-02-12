import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, signInWithPopup, OAuthProvider, type User } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vegapower-app',
}

// Initialize Firebase client (only once)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)

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
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')

  // Use Arabic locale for Apple Sign-In page
  provider.setCustomParameters({
    locale: 'ar',
  })

  const result = await signInWithPopup(auth, provider)
  const user: User = result.user

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  }
}

export { auth }
