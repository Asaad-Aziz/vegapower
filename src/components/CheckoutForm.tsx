'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import type { MoyasarConfig } from '@/types/moyasar.d'

interface CheckoutFormProps {
  product: {
    id: string
    title: string
    price_sar: number
  }
}

export default function CheckoutForm({ product }: CheckoutFormProps) {
  const [email, setEmail] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [moyasarLoaded, setMoyasarLoaded] = useState(false)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) {
      setIsEmailValid(true)
      setShowPayment(true)
    }
  }

  useEffect(() => {
    if (showPayment && moyasarLoaded && window.Moyasar) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      
      window.Moyasar.init({
        element: '.moyasar-form',
        amount: Math.round(product.price_sar * 100), // Convert to halalas
        currency: 'SAR',
        description: product.title,
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || '',
        callback_url: `${appUrl}/success`,
        methods: ['creditcard', 'applepay'],
        supported_networks: ['mada', 'visa', 'masterCard'],
        apple_pay: {
          label: 'Vega Power',
          validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
          country: 'SA',
        },
        metadata: {
          buyer_email: email,
          product_id: product.id,
        },
      })
    }
  }, [showPayment, moyasarLoaded, product, email])

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted text-sm mb-8 hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to store
        </Link>

        {/* Order Summary */}
        <div className="glass-card p-6 mb-6">
          <h1 className="text-xl font-semibold mb-4">Order Summary</h1>
          <div className="flex justify-between items-center py-3 border-b border-neutral-100">
            <span className="text-muted">{product.title}</span>
            <span className="font-medium">{product.price_sar.toFixed(2)} SAR</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold">{product.price_sar.toFixed(2)} SAR</span>
          </div>
        </div>

        {/* Email Form */}
        {!showPayment && (
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">الإيميل</h2>
            <p className="text-muted text-sm mb-4">
            سنرسل رابط تحميل الملف إلى هذا البريد الإلكتروني.
            </p>
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field mb-4"
                required
                autoFocus
              />
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!validateEmail(email)}
              >
                أكملي الطلب
              </button>
            </form>
          </div>
        )}

        {/* Payment Form */}
        {showPayment && (
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Payment</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Change email
              </button>
            </div>
            <p className="text-sm text-muted mb-4">
              Paying as <span className="font-medium text-foreground">{email}</span>
            </p>
            
            {/* Moyasar Payment Form */}
            <div className="moyasar-form"></div>
            
            {/* Moyasar Scripts */}
            <Script
              src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
              onLoad={() => setMoyasarLoaded(true)}
            />
            <link
              rel="stylesheet"
              href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
            />
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure payment powered by Moyasar
          </p>
        </div>
      </div>
    </main>
  )
}

