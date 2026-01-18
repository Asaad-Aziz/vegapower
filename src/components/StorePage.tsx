'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import ReactMarkdown from 'react-markdown'
import { trackEvent } from '@/lib/analytics'
import * as fbq from '@/lib/meta-pixel'
import type { Product } from '@/types/database'
import type { MoyasarConfig } from '@/types/moyasar.d'

interface StorePageProps {
  product: Product
}

const socialIcons: Record<string, string> = {
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  snapchat: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.217-.937 1.407-5.965 1.407-5.965s-.359-.72-.359-1.781c0-1.669.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.03-.655 2.569-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

type PaymentMethod = 'card' | 'tamara' | null

export default function StorePage({ product }: StorePageProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [email, setEmail] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [moyasarLoaded, setMoyasarLoaded] = useState(false)
  const [moyasarInitialized, setMoyasarInitialized] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [tamaraLoading, setTamaraLoading] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [viewersCount] = useState(() => Math.floor(Math.random() * 15) + 8) // 8-22 viewers
  const [recentBuyers] = useState(() => Math.floor(Math.random() * 20) + 12) // 12-31 recent buyers

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
    setMoyasarInitialized(false)
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateEmail(email)) {
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

  useEffect(() => {
    if (showPayment && paymentMethod !== 'tamara' && moyasarLoaded && window.Moyasar && !moyasarInitialized) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
      
      const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || ''
      logToServer('MOYASAR_INIT', 'Initializing Moyasar Payment Form', {
        amount: Math.round(product.price_sar * 100),
        appUrl,
        hasPublishableKey: !!publishableKey,
        keyPrefix: publishableKey.substring(0, 10),
        isTestKey: publishableKey.startsWith('pk_test'),
        isLiveKey: publishableKey.startsWith('pk_live'),
      })
      
      // Small delay to ensure DOM element is ready
      setTimeout(() => {
        const moyasarElement = document.querySelector('.moyasar-form')
        if (moyasarElement) {
          moyasarElement.innerHTML = ''
        }
        
        window.Moyasar.init({
          element: '.moyasar-form',
          amount: Math.round(product.price_sar * 100),
          currency: 'SAR',
          description: product.title,
          publishable_api_key: publishableKey,
          callback_url: `${appUrl}/success`,
          methods: ['creditcard', 'applepay'],
          apple_pay: {
            label: 'Vega Power',
            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
            country: 'SA',
            supported_countries: ['SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'US', 'GB'],
          },
          supported_networks: ['mada', 'visa', 'mastercard'],
          on_initiating: async function() {
            await logToServer('PAYMENT_INITIATING', 'Payment is being initiated')
            return true
          },
          on_completed: async function(payment) {
            await logToServer('PAYMENT_COMPLETED', 'Payment completed', payment)
          },
          on_failure: async function(error) {
            await logToServer('PAYMENT_FAILURE', 'Payment failed', error)
          },
          metadata: {
            buyer_email: email,
            product_id: product.id,
          },
        })
        
        logToServer('MOYASAR_INIT_COMPLETE', 'Moyasar init() called successfully')
        setMoyasarInitialized(true)
      }, 100)
    }
  }, [showPayment, paymentMethod, moyasarLoaded, product, email, moyasarInitialized])

  // Load Moyasar CSS
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.5/dist/moyasar.css'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return (
    <main className="min-h-screen pb-16">
      {/* Hero Section */}
      <section className="pt-12 pb-8 px-4 animate-fade-in">
        <div className="max-w-lg mx-auto text-center">
          {/* Profile Image */}
          {product.profile_image_url ? (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <Image
                src={product.profile_image_url}
                alt={product.brand_name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-neutral-500">
                {product.brand_name.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Brand Name */}
          <h1 className="text-xl font-semibold mb-2">{product.brand_name}</h1>
          
          {/* Bio */}
          <p className="text-muted text-sm leading-relaxed">{product.bio}</p>
        </div>
      </section>

      {/* FOMO Banner */}
      <section className="px-4 mb-4 animate-fade-in">
        <div className="max-w-lg mx-auto">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <span className="animate-pulse">🔥</span>
            <span>عرض محدود - ينتهي قريباً!</span>
            <span className="animate-pulse">🔥</span>
          </div>
        </div>
      </section>

      {/* Product Card */}
      <section className="px-4 mb-8 animate-fade-in animate-delay-100">
        <div className="max-w-lg mx-auto glass-card overflow-hidden relative">
          {/* Live Viewers Badge */}
          <div className="absolute top-3 right-3 z-10 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>{viewersCount} يشاهدون الآن</span>
          </div>

          {/* Discount Badge */}
          {product.before_price_sar && product.before_price_sar > product.price_sar && (
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-bounce">
              -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
            </div>
          )}

          {/* Product Image */}
          {product.product_image_url && (
            <div className="w-full">
              <Image
                src={product.product_image_url}
                alt={product.title}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
          )}
          
          <div className="p-6">
            {/* Recent Buyers FOMO */}
            <div className="flex items-center gap-2 mb-3 text-sm text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>{recentBuyers}+ اشتروا هذا المنتج اليوم</span>
            </div>

            <h2 className="text-2xl font-semibold mb-4">{product.title}</h2>
            
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
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
            
            {/* Price with FOMO */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-green-600">
                  {product.price_sar.toFixed(0)} ر.س
                </span>
                {product.before_price_sar && product.before_price_sar > product.price_sar && (
                  <>
                    <span className="text-xl text-muted line-through">
                      {product.before_price_sar.toFixed(0)} ر.س
                    </span>
                    <span className="text-sm font-medium text-white bg-red-500 px-2 py-1 rounded-full">
                      وفّر {(product.before_price_sar - product.price_sar).toFixed(0)} ر.س
                    </span>
                  </>
                )}
              </div>
              {/* Urgency Text */}
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                السعر قد يتغير في أي وقت!
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mb-4 py-3 border-y border-neutral-100">
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                دفع آمن
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                توصيل فوري
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                جودة عالية
              </div>
            </div>
            
            {/* CTA Button with FOMO */}
            <button
              onClick={handleBuyClick}
              className="btn-primary w-full text-center text-lg py-4 relative overflow-hidden group"
            >
              <span className="relative z-10">احصل عليه الآن</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
            
            {/* Scarcity Text */}
            <p className="text-center text-xs text-neutral-500 mt-3">
              ⚡ التوصيل الفوري متاح الآن
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials - Horizontal Scroll */}
      {product.testimonials && product.testimonials.length > 0 && (
        <section className="mb-8 animate-fade-in animate-delay-200">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">آراء العملاء</h3>
              <span className="text-sm text-muted">
                {product.testimonials.length} تقييم
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
              
              {product.testimonials.map((testimonial) => (
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
                  
                  <p className="text-muted mb-4 leading-relaxed text-sm">"{testimonial.text}"</p>
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
                        <span className="text-sm font-medium text-neutral-500">
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
      {product.faqs && product.faqs.length > 0 && (
        <section className="px-4 mb-8 animate-fade-in animate-delay-300">
          <div className="max-w-lg mx-auto">
            <h3 className="text-lg font-semibold mb-4">FAQ</h3>
            <div className="space-y-3">
              {product.faqs.map((faq) => (
                <details key={faq.id} className="glass-card group">
                  <summary className="p-4 cursor-pointer font-medium flex items-center justify-between">
                    {faq.question}
                    <svg
                      className="w-5 h-5 text-muted transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4 text-muted text-sm leading-relaxed">
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
      {product.social_links && product.social_links.length > 0 && (
        <section className="px-4 mb-8">
          <div className="max-w-lg mx-auto flex justify-center gap-4">
            {product.social_links.map((link) => (
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
      <footer className="text-center text-muted text-xs">
        <p>© {new Date().getFullYear()} {product.brand_name}</p>
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
                <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="text-muted text-sm">{product.title}</span>
                    <span className="font-medium">{product.price_sar.toFixed(0)} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">الإجمالي</span>
                    <span className="text-xl font-bold">{product.price_sar.toFixed(0)} ر.س</span>
                  </div>
                </div>

                {/* Email Form */}
                {!showPayment && (
                  <div className="animate-fade-in">
                    <h3 className="text-base font-semibold mb-2">البريد الإلكتروني</h3>
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
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={!validateEmail(email)}
                      >
                        متابعة الدفع
                      </button>
                    </form>
                  </div>
                )}

                {/* Payment Form - Moyasar Default + Tamara Option */}
                {showPayment && paymentMethod !== 'tamara' && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold">الدفع</h3>
                      <button
                        onClick={() => {
                          setShowPayment(false)
                          setMoyasarInitialized(false)
                        }}
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        تغيير الإيميل
                      </button>
                    </div>
                    <p className="text-sm text-muted mb-4" dir="ltr">
                      Paying as <span className="font-medium text-foreground">{email}</span>
                    </p>
                    
                    {/* Moyasar Payment Form - Default */}
                    <div className="moyasar-form mb-6"></div>
                    
                    {/* Moyasar Script */}
                    <Script
                      src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.5/dist/moyasar.umd.min.js"
                      onLoad={() => setMoyasarLoaded(true)}
                    />

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-neutral-500">أو</span>
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
                          <p className="text-sm text-neutral-800">
                            ادفع <span className="font-semibold bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] bg-clip-text text-transparent">{Math.round(product.price_sar / 4)} ر.س</span>/شهريًا أو على 4 دفعات
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">متوافقة مع الشريعة الإسلامية</p>
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
                        className="text-sm text-muted hover:text-foreground transition-colors"
                      >
                        ← العودة
                      </button>
                    </div>
                    <p className="text-sm text-muted mb-4" dir="ltr">
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
                        <p className="text-sm text-neutral-500 mt-1">
                          ادفع <span className="font-semibold text-neutral-800">{Math.round(product.price_sar / 4)} ر.س</span> أو على 4 دفعات
                        </p>
                      </div>

                      {/* Payment Breakdown */}
                      <div className="bg-white/80 rounded-xl p-3 mb-4 border border-[#DE6FA1]/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#F97316] via-[#EC4899] to-[#8B5CF6] rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">4x</span>
                            </div>
                            <span className="text-sm text-neutral-600">4 دفعات شهرية</span>
                          </div>
                          <span className="font-bold text-neutral-800">{(product.price_sar / 4).toFixed(0)} ر.س</span>
                        </div>
                      </div>

                      {/* How it works */}
                      <div className="grid grid-cols-4 gap-2 text-center mb-4">
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#FFB88C]/20 to-[#F97316]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#F97316] text-xs font-bold">1</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">اختر الخطة</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#F9DC5C]/20 to-[#EC4899]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#EC4899] text-xs font-bold">2</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">أدخل البطاقة</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#8B5CF6] text-xs font-bold">3</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">تابع من التطبيق</p>
                        </div>
                        <div>
                          <div className="w-8 h-8 mx-auto bg-gradient-to-br from-[#8B5CF6]/20 to-[#67E8F9]/20 rounded-full flex items-center justify-center mb-1">
                            <span className="text-[#06B6D4] text-xs font-bold">4</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">تذكيرات</p>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-500 border-t border-[#DE6FA1]/10 pt-3">
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
                      <span className="text-[10px] text-neutral-400">طرق الدفع المقبولة:</span>
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
                  <p className="text-xs text-muted flex items-center justify-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    دفع آمن عبر Moyasar
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

