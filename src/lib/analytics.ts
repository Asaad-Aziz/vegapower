'use client'

import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'vp_session_id'

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = uuidv4()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

export async function trackEvent(type: 'page_view' | 'buy_click' | 'purchase'): Promise<void> {
  const sessionId = getSessionId()
  if (!sessionId) return

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, session_id: sessionId }),
    })
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

