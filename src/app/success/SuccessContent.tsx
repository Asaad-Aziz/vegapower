'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

interface VerificationResult {
  success: boolean
  productTitle?: string
  deliveryUrl?: string
  error?: string
}

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<VerificationResult | null>(null)

  useEffect(() => {
    const paymentId = searchParams.get('id')
    
    if (!paymentId) {
      setStatus('error')
      setResult({ success: false, error: 'No payment ID provided' })
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/verify?paymentId=${paymentId}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setResult(data)
          trackEvent('purchase')
        } else {
          setStatus('error')
          setResult(data)
        }
      } catch {
        setStatus('error')
        setResult({ success: false, error: 'Failed to verify payment' })
      }
    }

    verifyPayment()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
          <h1 className="text-xl font-semibold mb-2">Verifying your payment...</h1>
          <p className="text-muted">Please wait while we confirm your purchase.</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Payment Verification Failed</h1>
          <p className="text-muted mb-6">{result?.error || 'Unable to verify your payment. Please contact support.'}</p>
          <Link href="/" className="btn-primary inline-block">
            Return to Store
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-semibold mb-2">Payment Successful!</h1>
        <p className="text-muted mb-6">
          Thank you for your purchase. Your product is ready to access.
        </p>

        {result?.productTitle && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted mb-1">You purchased</p>
            <p className="font-semibold">{result.productTitle}</p>
          </div>
        )}

        {result?.deliveryUrl && (
          <a
            href={result.deliveryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full mb-4 inline-block"
          >
            Access Your Product
          </a>
        )}

        <p className="text-sm text-muted mb-4">
          A confirmation email with your access link has been sent to your email address.
        </p>

        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Return to store
        </Link>
      </div>
    </main>
  )
}

