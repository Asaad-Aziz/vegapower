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
    const isTamara = searchParams.get('tamara') === 'true'
    const orderRef = searchParams.get('order_ref')
    
    // For Tamara payments
    if (isTamara && orderRef) {
      const verifyTamaraPayment = async () => {
        try {
          const response = await fetch(`/api/payments/verify?tamara=true&order_ref=${orderRef}`)
          const data = await response.json()

          if (data.success) {
            setStatus('success')
            setResult(data)
            trackEvent('purchase')
          } else if (data.status === 'processing') {
            // Payment still processing, retry after delay
            setStatus('loading')
            setTimeout(verifyTamaraPayment, 3000)
          } else {
            setStatus('error')
            setResult(data)
          }
        } catch {
          setStatus('error')
          setResult({ success: false, error: 'فشل في التحقق من الدفع' })
        }
      }

      verifyTamaraPayment()
      return
    }

    // For Moyasar payments
    if (!paymentId) {
      setStatus('error')
      setResult({ success: false, error: 'لم يتم توفير معرف الدفع' })
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
        setResult({ success: false, error: 'فشل في التحقق من الدفع' })
      }
    }

    verifyPayment()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
          <h1 className="text-xl font-semibold mb-2">جاري التحقق من الدفع...</h1>
          <p className="text-muted">يرجى الانتظار بينما نؤكد عملية الشراء.</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">فشل التحقق من الدفع</h1>
          <p className="text-muted mb-6">{result?.error || 'تعذر التحقق من الدفع. يرجى التواصل مع الدعم.'}</p>
          <Link href="/" className="btn-primary inline-block">
            العودة للمتجر
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-md w-full glass-card p-8 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">تمت عملية الدفع بنجاح! 🎉</h1>
        <p className="text-muted mb-6">
          شكراً لك على الشراء. منتجك جاهز للتحميل الآن.
        </p>

        {result?.productTitle && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted mb-1">المنتج الذي اشتريته</p>
            <p className="font-semibold text-lg">{result.productTitle}</p>
          </div>
        )}

        {result?.deliveryUrl && (
          <a
            href={result.deliveryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full mb-4 inline-flex items-center justify-center gap-2 text-lg py-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل المنتج
          </a>
        )}

        <p className="text-sm text-muted mb-6">
          تم إرسال رسالة تأكيد مع رابط التحميل إلى بريدك الإلكتروني.
        </p>

        <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1">
          العودة للمتجر ←
        </Link>
      </div>
    </main>
  )
}
