import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  type Auth,
  type User,
} from 'firebase/auth'

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

function getAppleProvider(): OAuthProvider {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email')
  provider.addScope('name')
  provider.setCustomParameters({ locale: 'ar' })
  return provider
}

export interface AppleSignInResult {
  uid: string
  email: string | null
  displayName: string | null
}

/**
 * Sign in with Apple using Firebase Auth.
 * Tries popup first, falls back to redirect if popup is blocked (common on mobile).
 */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const firebaseAuth = getFirebaseAuth()
  const provider = getAppleProvider()

  try {
    // Try popup first (works on desktop browsers)
    const result = await signInWithPopup(firebaseAuth, provider)
    const user: User = result.user
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }

    // If popup was blocked, fall back to redirect
    if (firebaseError.code === 'auth/popup-blocked' || firebaseError.code === 'auth/popup-closed-by-user') {
      console.log('Popup blocked/closed, falling back to redirect...')
      // Save current step so we can restore after redirect
      sessionStorage.setItem('apple_signin_pending', 'true')
      await signInWithRedirect(firebaseAuth, provider)
      // This won't return - page will redirect
      return { uid: '', email: null, displayName: null }
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Check if we're returning from an Apple Sign-In redirect.
 * Call this on page load to handle the redirect result.
 */
export async function checkAppleSignInRedirect(): Promise<AppleSignInResult | null> {
  // Only check if we have a pending sign-in
  const pending = sessionStorage.getItem('apple_signin_pending')
  if (!pending) return null

  try {
    const firebaseAuth = getFirebaseAuth()
    const result = await getRedirectResult(firebaseAuth)

    if (result) {
      sessionStorage.removeItem('apple_signin_pending')
      const user: User = result.user
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
    }
  } catch (error) {
    console.error('Apple Sign-In redirect result error:', error)
    sessionStorage.removeItem('apple_signin_pending')
  }

  return null
}
