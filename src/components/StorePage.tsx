'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import ReactMarkdown from 'react-markdown'
import { trackEvent } from '@/lib/analytics'
import * as fbq from '@/lib/meta-pixel'
import type { Product, StoreSettings } from '@/types/database'

interface StorePageProps {
  product: Product
  storeSettings?: StoreSettings | null
}

const socialIcons: Record<string, string> = {
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  snapchat: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.217-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.669.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.03-.655 2.569-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

type PaymentMethod = 'card' | 'tamara' | null

export default function StorePage({ product, storeSettings }: StorePageProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [email, setEmail] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [mfScriptLoaded, setMfScriptLoaded] = useState(false)
  const [mfInitialized, setMfInitialized] = useState(false)
  const [mfEncryptionKey, setMfEncryptionKey] = useState('')
  const [mfSessionLoading, setMfSessionLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [tamaraLoading, setTamaraLoading] = useState(false)
  const [freeOrderLoading, setFreeOrderLoading] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [viewersCount] = useState(() => Math.floor(Math.random() * 15) + 8) // 8-22 viewers
  const [recentBuyers] = useState(() => Math.floor(Math.random() * 20) + 12) // 12-31 recent buyers
  const [discountCode, setDiscountCode] = useState('2026')
  const [discountApplied, setDiscountApplied] = useState(false)
  const mfContainerRef = useRef<HTMLDivElement>(null)

  // Calculate prices with discount
  const discountCodes: Record<string, number> = {
    '2026': 10,
    'VPTEST90': 90,
  }
  const discountPercent = discountCodes[discountCode] || 0
  const finalPrice = discountApplied 
    ? product.price_sar * (1 - discountPercent / 100) 
    : product.price_sar
  const discountAmount = discountApplied 
    ? product.price_sar * (discountPercent / 100) 
    : 0

  const handleApplyDiscount = () => {
    if (discountCodes[discountCode]) {
      setDiscountApplied(true)
    }
  }

  // Use store settings if available, otherwise fall back to product legacy fields
  const brandName = storeSettings?.brand_name || product.brand_name || 'Vega Power'
  const bio = storeSettings?.bio || product.bio || ''
  const profileImageUrl = storeSettings?.profile_image_url || product.profile_image_url || null
  const testimonials = storeSettings?.testimonials || product.testimonials || []
  const faqs = storeSettings?.faqs || product.faqs || []
  const socialLinks = storeSettings?.social_links || product.social_links || []

  useEffect(() => {
    trackEvent('page_view')
    // Meta Pixel: ViewContent
    fbq.viewContent({
      content_name: product.title,
      content_ids: [product.id],
      content_type: 'product',
      value: product.price_sar,
      currency: 'SAR',
    })
  }, [product])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleBuyClick = () => {
    trackEvent('buy_click')
    // Meta Pixel: InitiateCheckout
    fbq.initiateCheckout({
      content_ids: [product.id],
      content_type: 'product',
      value: product.price_sar,
      currency: 'SAR',
      num_items: 1,
    })
    setShowCheckout(true)
    document.body.style.overflow = 'hidden'
  }

  const handleCloseCheckout = () => {
    setShowCheckout(false)
    setShowPayment(false)
    setEmail('')
    setMfInitialized(false)
    setMfEncryptionKey('')
    setMfSessionLoading(false)
    setPaymentMethod(null)
    setTamaraLoading(false)
    document.body.style.overflow = ''
  }

  const handleTamaraCheckout = async () => {
    setTamaraLoading(true)
    try {
      const response = await fetch('/api/tamara/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productId: product.id,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.checkoutUrl) {
        // Redirect to Tamara checkout
        window.location.href = data.checkoutUrl
      } else {
        console.error('Tamara checkout failed:', data.error)
        alert('فشل في إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.')
        setTamaraLoading(false)
      }
    } catch (error) {
      console.error('Tamara checkout error:', error)
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.')
      setTamaraLoading(false)
    }
  }

  const handleFreeOrder = async () => {
    setFreeOrderLoading(true)
    try {
      const response = await fetch('/api/orders/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productId: product.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Track purchase conversion
        fbq.purchase({
          content_name: data.productTitle || product.title,
          content_ids: [product.id],
          content_type: 'product',
          value: 0,
          currency: 'SAR',
          num_items: 1,
        })

        // Store result for success page (same flow as MyFatoorah)
        sessionStorage.setItem(
          'mf_payment_result',
          JSON.stringify({
            success: true,
            productTitle: data.productTitle,
            deliveryUrl: data.deliveryUrl,
            productId: data.productId,
            amount: 0,
            paymentId: data.paymentId,
          }),
        )
        window.location.href = '/success?provider=myfatoorah'
      } else {
        console.error('Free order failed:', data.error)
        alert('حدث خطأ. يرجى المحاولة مرة أخرى.')
        setFreeOrderLoading(false)
      }
    } catch (error) {
      console.error('Free order error:', error)
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.')
      setFreeOrderLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) {
      // For free products, skip payment and process directly
      if (finalPrice === 0) {
        handleFreeOrder()
        return
      }
      // Meta Pixel: AddPaymentInfo
      fbq.addPaymentInfo({
        content_ids: [product.id],
        content_type: 'product',
        value: product.price_sar,
        currency: 'SAR',
      })
      setShowPayment(true)
    }
  }

  // Helper function to log to server
  const logToServer = async (type: string, message: string, data?: unknown) => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, data }),
      })
    } catch (e) {
      console.error('Failed to log to server:', e)
    }
  }

  // Create MyFatoorah session and initialize embedded form
  useEffect(() => {
    if (showPayment && paymentMethod !== 'tamara' && mfScriptLoaded && !mfInitialized && !mfSessionLoading) {
      const initMyFatoorah = async () => {
        setMfSessionLoading(true)
        await logToServer('MYFATOORAH_INIT', 'Creating MyFatoorah session', {
          amount: finalPrice,
          email,
        })

        try {
          // Create session on server
          const response = await fetch('/api/myfatoorah/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: finalPrice,
              email,
              productId: product.id,
            }),
          })

          const data = await response.json()

          if (!data.success) {
            await logToServer('MYFATOORAH_SESSION_FAILED', 'Session creation failed', data)
            alert('فشل في إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.')
            setMfSessionLoading(false)
            return
          }

          setMfEncryptionKey(data.encryptionKey)

          // Clear previous form
          if (mfContainerRef.current) {
            mfContainerRef.current.innerHTML = ''
          }

          // Small delay for DOM readiness
          setTimeout(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const myfatoorah = (window as any).myfatoorah
            if (!myfatoorah) {
              logToServer('MYFATOORAH_ERROR', 'myfatoorah global not found')
              alert('حدث خطأ في تحميل نموذج الدفع. يرجى تحديث الصفحة.')
              setMfSessionLoading(false)
              return
            }

            const config = {
              sessionId: data.sessionId,
              callback: async (paymentResponse: {
                isSuccess: boolean
                sessionId: string
                paymentCompleted: boolean
                paymentData?: string
                paymentType?: string
                redirectionUrl?: string
              }) => {
                await logToServer('MYFATOORAH_CALLBACK', 'Payment callback received', paymentResponse)

                if (paymentResponse.isSuccess && paymentResponse.paymentCompleted && paymentResponse.paymentData) {
                  // Verify and process payment on server
                  try {
                    const verifyResponse = await fetch('/api/myfatoorah/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        paymentData: paymentResponse.paymentData,
                        encryptionKey: data.encryptionKey,
                        email,
                        productId: product.id,
                      }),
                    })

                    const verifyResult = await verifyResponse.json()

                    if (verifyResult.success) {
                      // Store result for success page
                      sessionStorage.setItem(
                        'mf_payment_result',
                        JSON.stringify({
                          success: true,
                          productTitle: verifyResult.productTitle,
                          deliveryUrl: verifyResult.deliveryUrl,
                          productId: verifyResult.productId,
                          amount: verifyResult.amount,
                          paymentId: verifyResult.paymentId,
                        }),
                      )
                      window.location.href = '/success?provider=myfatoorah'
                    } else {
                      await logToServer('MYFATOORAH_VERIFY_FAILED', 'Verification failed', verifyResult)
                      alert(verifyResult.error || 'فشل في التحقق من الدفع')
                    }
                  } catch (verifyError) {
                    await logToServer('MYFATOORAH_VERIFY_ERROR', 'Verification error', verifyError)
                    alert('حدث خطأ في التحقق من الدفع. يرجى التواصل مع الدعم.')
                  }
                } else if (paymentResponse.isSuccess && paymentResponse.redirectionUrl) {
                  // Hosted payment method - redirect URL has paymentId
                  // Extract paymentId from redirectionUrl and store for later verification
                  const url = new URL(paymentResponse.redirectionUrl)
                  const paymentId = url.searchParams.get('paymentId')
                  if (paymentId) {
                    sessionStorage.setItem('mf_pending_paymentId', paymentId)
                    sessionStorage.setItem('mf_pending_encryptionKey', data.encryptionKey)
                    sessionStorage.setItem('mf_pending_email', email)
                  }
                  // MyFatoorah handles the redirect for hosted methods
                } else if (!paymentResponse.isSuccess) {
                  await logToServer('MYFATOORAH_PAYMENT_FAILED', 'Payment failed', paymentResponse)
                  alert('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.')
                }
              },
              containerId: 'myfatoorah-form',
              shouldHandlePaymentUrl: true,
            }

            myfatoorah.init(config)
            logToServer('MYFATOORAH_INIT_COMPLETE', 'MyFatoorah init() called successfully')
            setMfInitialized(true)
            setMfSessionLoading(false)
          }, 200)
        } catch (error) {
          await logToServer('MYFATOORAH_INIT_ERROR', 'Initialization error', error)
          alert('حدث خطأ. يرجى المحاولة مرة أخرى.')
          setMfSessionLoading(false)
        }
      }

      initMyFatoorah()
    }
  }, [showPayment, paymentMethod, mfScriptLoaded, mfInitialized, mfSessionLoading, product, email, finalPrice])

  return (
    <main className="min-h-screen pb-16">
      {/* Product Card */}
      <section className="px-4 mb-8 animate-fade-in">
        <div className="max-w-lg mx-auto glass-card overflow-hidden relative">
          {/* Discount Badge */}
          {product.before_price_sar && product.before_price_sar > product.price_sar && (
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
              -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
            </div>
          )}

          {/* Product Image */}
          {product.product_image_url && (
            <div className="w-full relative">
              <Image
                src={product.product_image_url}
                alt={product.title}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto"
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            </div>
          )}
          
          <div className="p-6">
            {product.times_bought > 0 && (
              <p className="text-sm text-muted-foreground mb-3">{product.times_bought}+ عملية شراء</p>
            )}

            <h2 className="text-2xl font-semibold text-foreground mb-4">{product.title}</h2>
            
            {/* Collapsible Description with Markdown */}
            <div className="mb-6">
              <div 
                className={`markdown-content overflow-hidden transition-all duration-300 ${
                  descriptionExpanded ? 'max-h-[2000px]' : 'max-h-32'
                }`}
              >
                <ReactMarkdown>{product.description}</ReactMarkdown>
              </div>
              {product.description.length > 150 && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="mt-2 text-sm font-medium text-primary hover:text-primary/90 flex items-center gap-1"
                >
                  {descriptionExpanded ? (
                    <>
                      عرض أقل
                      <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      عرض المزيد
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                {product.price_sar === 0 ? (
                  <span className="text-3xl font-bold text-green-600">مجاني</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-primary">
                      {product.price_sar.toFixed(0)} ر.س
                    </span>
                    {product.before_price_sar && product.before_price_sar > product.price_sar && (
                      <span className="text-xl text-muted-foreground line-through">
                        {product.before_price_sar.toFixed(0)} ر.س
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* CTA Button */}
            <button
              onClick={handleBuyClick}
              className="btn-primary w-full text-center text-lg py-4"
            >
              {product.price_sar === 0 ? 'احصل عليه مجاناً' : 'احصل عليه الآن'}
            </button>
            
            {/* Payment Methods - hide for free products */}
            {product.price_sar > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {/* Tamara */}
              <div className="h-4 w-auto">
                <Image
                  src="/tamara.png"
                  alt="Tamara"
                  width={36}
                  height={14}
                  className="h-3.5 w-auto object-contain opacity-60"
                />
              </div>
              {/* Apple Pay */}
              <div className="h-4 px-1.5 bg-black rounded flex items-center justify-center">
                <svg className="h-2.5 w-auto" viewBox="0 0 50 20" fill="white">
                  <path d="M9.6 5.3c-.6.7-1.5 1.2-2.4 1.1-.1-.9.3-1.9.9-2.5.6-.7 1.6-1.2 2.4-1.2.1 1-.3 1.9-.9 2.6zm.9 1.3c-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.2 2.7 2.1 1-.1 1.5-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.9-1 2.6-2.1.8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.3 0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.5-1.6-3.2-1.7z"/>
                  <path d="M21.2 3.2c3.2 0 5.4 2.2 5.4 5.4 0 3.2-2.3 5.4-5.5 5.4h-3.5v5.6h-2.5V3.2h6.1zm-3.6 8.6h2.9c2.2 0 3.5-1.2 3.5-3.2 0-2-1.3-3.2-3.5-3.2h-2.9v6.4zm10.5 2.6c0-2.1 1.6-3.4 4.5-3.5l3.3-.2v-.9c0-1.3-.9-2.1-2.4-2.1-1.4 0-2.3.7-2.5 1.7h-2.3c.1-2.2 2-3.8 4.9-3.8 2.9 0 4.7 1.5 4.7 3.9v8.2h-2.3v-2h-.1c-.7 1.4-2.2 2.2-3.8 2.2-2.4 0-4-1.5-4-3.5zm7.8-1v-.9l-3 .2c-1.5.1-2.3.7-2.3 1.7 0 1 .9 1.7 2.2 1.7 1.7 0 3.1-1.2 3.1-2.7zm4.4 6.9v-1.9c.2 0 .6.1.9.1 1.3 0 2-.5 2.4-1.9l.3-.8-4.5-12.5h2.6l3.2 10.2h.1l3.2-10.2h2.5l-4.6 13.1c-1.1 3-2.3 4-4.9 4-.3 0-.9 0-1.2-.1z"/>
                </svg>
              </div>
              {/* Visa */}
              <div className="h-4 px-1.5 bg-[#1A1F71] rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold italic">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="h-4 px-1 bg-neutral-100 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-[#EB001B] rounded-full"></div>
                <div className="w-2 h-2 bg-[#F79E1B] rounded-full -ml-0.5"></div>
              </div>
              {/* Mada */}
              <div className="h-4 px-1.5 bg-[#004B87] rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">mada</span>
              </div>
            </div>
            )}
            
            {/* Scarcity Text */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              ⚡ التوصيل الفوري متاح الآن
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials - Horizontal Scroll */}
      {testimonials && testimonials.length > 0 && (
        <section className="mb-8 animate-fade-in animate-delay-200">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">آراء العملاء</h3>
              <span className="text-sm text-muted-foreground">
                {testimonials.length} تقييم
              </span>
            </div>
          </div>
          <div className="relative">
            <div 
              className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Start spacer for centering on larger screens */}
              <div className="flex-shrink-0 w-[calc((100vw-32rem)/2)] max-lg:hidden" />
              
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id} 
                  className="glass-card p-5 flex-shrink-0 w-72 snap-center"
                >
                  {/* 5 Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-amber-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-4 leading-relaxed text-sm">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-sm">{testimonial.name}</span>
                  </div>
                </div>
              ))}
              
              {/* End spacer for centering on larger screens */}
              <div className="flex-shrink-0 w-[calc((100vw-32rem)/2)] max-lg:hidden" />
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="px-4 mb-8 animate-fade-in animate-delay-300">
          <div className="max-w-lg mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">FAQ</h3>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.id} className="glass-card group">
                  <summary className="p-4 cursor-pointer font-medium flex items-center justify-between">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom Blocks */}
      {product.custom_blocks && (
        <section className="px-4 mb-8">
          <div className="max-w-lg mx-auto glass-card p-6">
            <div className="markdown-content">
              <ReactMarkdown>{product.custom_blocks}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* Social Links */}
      {socialLinks && socialLinks.length > 0 && (
        <section className="px-4 mb-8">
          <div className="max-w-lg mx-auto flex justify-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center transition-colors hover:bg-neutral-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d={socialIcons[link.platform] || socialIcons.twitter} />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-xs">
        <p>© {new Date().getFullYear()} {brandName}</p>
      </footer>

      {/* Checkout Modal */}
      {showCheckout && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
            onClick={handleCloseCheckout}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div 
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                <h2 className="text-lg font-semibold">إتمام الطلب</h2>
                <button
                  onClick={handleCloseCheckout}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Order Summary */}
                <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-muted-foreground text-sm">{product.title}</span>
                    {product.price_sar === 0 ? (
                      <span className="font-medium text-green-600">مجاني</span>
                    ) : (
                      <span className={`font-medium ${discountApplied ? 'line-through text-muted-foreground' : ''}`}>
                        {product.price_sar.toFixed(0)} ر.س
                      </span>
                    )}
                  </div>
                  {product.price_sar > 0 && product.before_price_sar && product.before_price_sar > product.price_sar && (
                    <div className="flex justify-between items-center py-2 border-b border-border text-primary">
                      <span className="text-sm">💰 التوفير</span>
                      <span className="font-medium">-{(product.before_price_sar - product.price_sar).toFixed(0)} ر.س</span>
                    </div>
                  )}
                  {product.price_sar > 0 && discountApplied && (
                    <div className="flex justify-between items-center py-2 border-b border-border text-primary">
                      <span className="text-sm">🎁 كود الخصم ({discountPercent}%)</span>
                      <span className="font-medium">-{discountAmount.toFixed(0)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">الإجمالي</span>
                    {finalPrice === 0 ? (
                      <span className="text-xl font-bold text-green-600">مجاني</span>
                    ) : (
                      <span className="text-xl font-bold text-primary">{finalPrice.toFixed(0)} ر.س</span>
                    )}
                  </div>
                </div>

                {/* Discount Code - hide for free products */}
                {product.price_sar > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">كود الخصم</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value)
                        setDiscountApplied(false)
                      }}
                      placeholder="أدخل كود الخصم"
                      className="input-field flex-1"
                      dir="ltr"
                      disabled={discountApplied}
                    />
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      disabled={discountApplied || !discountCode}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        discountApplied 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-neutral-900 text-white hover:bg-neutral-800'
                      }`}
                    >
                      {discountApplied ? '✓ تم' : 'تطبيق'}
                    </button>
                  </div>
                  {discountApplied && (
                    <p className="text-xs text-primary mt-1">🎉 تم تطبيق الخصم بنجاح!</p>
                  )}
                </div>
                )}

                {/* Email Form */}
                {!showPayment && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-semibold mb-2">البريد الإلكتروني</h3>
                    <p className="text-muted-foreground text-sm mb-4">
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
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        className="btn-primary w-full py-4 text-lg relative overflow-hidden group"
                        disabled={!validateEmail(email) || freeOrderLoading}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {freeOrderLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              جاري المعالجة...
                            </>
                          ) : finalPrice === 0 ? (
                            'احصل عليه مجاناً'
                          ) : (
                            '🔒 متابعة للدفع الآمن'
                          )}
                        </span>
                      </button>
                      <p className="text-center text-[10px] text-muted-foreground mt-2">
                        ✓ معلوماتك محمية بتشفير SSL
                      </p>
                    </form>
                  </div>
                )}

                {/* Payment Form - MyFatoorah Default + Tamara Option */}
                {showPayment && paymentMethod !== 'tamara' && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold">الدفع</h3>
                      <button
                        onClick={() => {
                          setShowPayment(false)
                          setMfInitialized(false)
                          setMfSessionLoading(false)
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        تغيير الإيميل
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4" dir="ltr">
                      Paying as <span className="font-medium text-foreground">{email}</span>
                    </p>
                    
                    {/* MyFatoorah Embedded Payment Form */}
                    {mfSessionLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-3 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
                        <span className="mr-3 text-sm text-muted-foreground">جاري تحميل نموذج الدفع...</span>
                      </div>
                    )}
                    <div id="myfatoorah-form" ref={mfContainerRef} className="mb-6"></div>
                    
                    {/* MyFatoorah Script - Saudi Arabia live */}
                    <Script
                      src={process.env.NEXT_PUBLIC_MYFATOORAH_JS_URL || 'https://sa.myfatoorah.com/sessions/v1/session.js'}
                      onLoad={() => setMfScriptLoaded(true)}
                    />

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-muted-foreground">أو</span>
                      </div>
                    </div>

                    {/* Tamara Option Below */}
                    <button
                      onClick={() => setPaymentMethod('tamara')}
                      className="w-full p-4 bg-gradient-to-r from-[#FFB88C]/10 via-[#DE6FA1]/10 to-[#8B5CF6]/10 border border-[#DE6FA1]/30 rounded-2xl hover:shadow-lg hover:border-[#DE6FA1]/50 transition-all text-right group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Tamara Logo */}
                        <div className="flex-shrink-0">
                          <Image
                            src="/tamara.png"
                            alt="Tamara"
                            width={70}
                            height={24}
                            className="h-6 w-auto object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            ادفع <span className="font-semibold bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">{Math.round(finalPrice / 4)} ر.س</span>/شهريًا أو على 4 دفعات
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">متوافقة مع الشريعة الإسلامية</p>
                        </div>
                        <svg className="w-5 h-5 text-[#DE6FA1] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                )}

                {/* Tamara Payment - Colorful Gradient Branding */}
                {showPayment && paymentMethod === 'tamara' && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold">الدفع عبر تمارا</h3>
                      <button
                        onClick={() => setPaymentMethod(null)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← العودة
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4" dir="ltr">
                      Paying as <span className="font-medium text-foreground">{email}</span>
                    </p>

                    {/* Tamara Widget - Colorful Gradient Theme */}
                    <div className="bg-gradient-to-br from-[#FFB88C]/5 via-[#DE6FA1]/5 to-[#8B5CF6]/5 border border-[#DE6FA1]/20 rounded-2xl p-4 mb-4">
                      {/* Logo */}
                      <div className="flex items-center justify-between mb-4">
                        <Image
                          src="/tamara.png"
                          alt="Tamara"
                          width={90}
                          height={32}
                          className="h-8 w-auto object-contain"
                        />
                        <span className="text-xs text-[#8B5CF6]">متوافقة مع الشريعة</span>
                      </div>

                      {/* Hero Message */}
                      <div className="text-center mb-4">
                        <p className="text-lg font-medium bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">دفعاتك، على راحتك</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ادفع <span className="font-semibold text-foreground">{Math.round(finalPrice / 4)} ر.س</span> أو على 4 دفعات
                        </p>
                      </div>

                      {/* Payment Breakdown */}
                      <div className="bg-white/80 rounded-xl p-3 mb-4 border border-[#DE6FA1]/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">4x</span>
                            </div>
                            <span className="text-sm text-muted-foreground">4 دفعات شهرية</span>
                          </div>
                          <span className="font-bold text-foreground">{(finalPrice / 4).toFixed(0)} ر.س</span>
                        </div>
                      </div>

                      {/* How it works */}
                      <div className="grid grid-cols-4 gap-2 text-center mb-4">
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#FFB88C]/20 to-[#F97316]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#F97316] text-xs font-bold">1</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">اختر الخطة</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#F9DC5C]/20 to-[#EC4899]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#EC4899] text-xs font-bold">2</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">أدخل البطاقة</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#8B5CF6] text-xs font-bold">3</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">تابع من التطبيق</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#8B5CF6]/20 to-[#67E8F9]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#06B6D4] text-xs font-bold">4</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">تذكيرات</p>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground border-t border-[#DE6FA1]/10 pt-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#EC4899]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          بدون رسوم خفية
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          حماية المشتري
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleTamaraCheckout}
                      disabled={tamaraLoading}
                      className="w-full py-4 bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] hover:from-[#EA580C] hover:via-[#DB2777] hover:to-[#7C3AED] text-white font-semibold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#EC4899]/25"
                    >
                      {tamaraLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          جاري التحويل...
                        </>
                      ) : (
                        <>
                          متابعة مع تمارا
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Payment Methods */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <span className="text-[10px] text-muted-foreground">طرق الدفع المقبولة:</span>
                      <div className="flex items-center gap-2">
                        <div className="h-5 px-2 bg-neutral-100 rounded flex items-center justify-center">
                          <span className="text-[10px] font-medium text-[#1A1F71]">VISA</span>
                        </div>
                        <div className="h-5 px-2 bg-neutral-100 rounded flex items-center justify-center">
                          <span className="text-[10px] font-medium text-[#EB001B]">MC</span>
                        </div>
                        <div className="h-5 px-2 bg-[#6C3D91] rounded flex items-center justify-center">
                          <span className="text-[10px] font-medium text-white">mada</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Note */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    دفع آمن ومشفّر
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
