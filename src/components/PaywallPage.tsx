'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { initiateCheckout } from '@/lib/meta-pixel'

const plans = {
  monthly: { price: 45, period: 'شهر', productId: 'moyasar_monthly', savings: null, days: 30, label: 'شهري' },
  yearly: { price: 155, period: 'سنة', productId: 'moyasar_yearly', savings: 293, days: 365, label: 'سنوي' },
}

const hardcodedDiscounts: Record<string, { percent: number; label: string }> = {
  'VEGA10': { percent: 10, label: '10%' },
  'VEGA20': { percent: 20, label: '20%' },
  'NEWYEAR': { percent: 15, label: '15%' },
  'FITNESS': { percent: 10, label: '10%' },
}

const EMAIL_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'outlook.sa',
  'live.com',
]

type PlanType = 'monthly' | 'yearly'

const reviews = [
  { name: 'سارة', rating: 5, text: 'التطبيق غيّر حياتي! نزلت ١٢ كيلو في ٣ أشهر بدون ما أحرم نفسي من أكل.', period: 'مشتركة من ٣ أشهر' },
  { name: 'محمد', rating: 5, text: 'أفضل برنامج تمارين جربته، الذكاء الاصطناعي يعطيك برنامج مخصص فعلاً مو عشوائي.', period: 'مشترك من ٦ أشهر' },
  { name: 'نورة', rating: 5, text: 'حسبة السعرات سهلة جداً وحاسبة البروتين ساعدتني أوصل لهدفي بسرعة.', period: 'مشتركة من شهرين' },
  { name: 'عبدالله', rating: 5, text: 'زاد وزني ٨ كيلو عضل نظيف، البرنامج يتكيف مع تقدمك كل أسبوع.', period: 'مشترك من ٤ أشهر' },
  { name: 'ريم', rating: 5, text: 'المجتمع يحفزك تكمل، والتطبيق سهل الاستخدام حتى لو ما عندك خبرة.', period: 'مشتركة من شهر' },
]

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const atIndex = value.indexOf('@')
  const hasAt = atIndex !== -1
  const localPart = hasAt ? value.slice(0, atIndex) : value
  const domainPart = hasAt ? value.slice(atIndex + 1) : ''

  const suggestions = hasAt && localPart.length > 0
    ? EMAIL_DOMAINS.filter(d => d.startsWith(domainPart.toLowerCase()) && d !== domainPart.toLowerCase())
    : []

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="email"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true) }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="أدخل بريدك الإلكتروني"
        dir="ltr"
        className="w-full px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur border border-neutral-200 dark:border-neutral-700 outline-none text-sm text-center focus:border-vp-navy/50 focus:ring-2 focus:ring-vp-navy/10 transition-all"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((domain) => (
            <button
              key={domain}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              dir="ltr"
              onClick={() => { onChange(`${localPart}@${domain}`); setShowSuggestions(false) }}
            >
              <span className="text-neutral-400">{localPart}@</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function PaywallPage() {
  const [email, setEmail] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; label: string } | null>(null)
  const [streampayCouponId, setStreampayCouponId] = useState<string | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [activeReview, setActiveReview] = useState(0)
  const [graphAnimated, setGraphAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setGraphAnimated(true), 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReview(prev => (prev + 1) % reviews.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const getFinalPrice = (base: number) => {
    if (appliedDiscount) return Math.round(base * (1 - appliedDiscount.percent / 100))
    return base
  }

  const getDailyPrice = (price: number, days: number) => (price / days).toFixed(2)

  const applyDiscountCode = async () => {
    const code = discountCode.toUpperCase().trim()
    if (!code) return

    if (hardcodedDiscounts[code]) {
      setAppliedDiscount(hardcodedDiscounts[code])
      setStreampayCouponId(null)
      setDiscountError('')
      return
    }

    setDiscountError('')
    setDiscountValidating(true)
    try {
      const res = await fetch(`/api/validate-code?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.valid) {
        setAppliedDiscount({ percent: data.discount_percentage, label: `${data.discount_percentage}%` })
        setStreampayCouponId(data.streampay_coupon_id || null)
        setDiscountError('')
        return
      }
    } catch {
      // fall through
    } finally {
      setDiscountValidating(false)
    }
    setAppliedDiscount(null)
    setStreampayCouponId(null)
    setDiscountError('كود الخصم غير صالح')
  }

  const handlePayment = async () => {
    if (!validateEmail(email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }

    setIsProcessing(true)
    setPaymentError('')

    const finalPrice = getFinalPrice(plans[selectedPlan].price)

    initiateCheckout({
      content_ids: [plans[selectedPlan].productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })

    try {
      const response = await fetch('/api/streampay/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          email,
          authMethod: 'email',
          discountCode: appliedDiscount ? discountCode : null,
          discountPercent: appliedDiscount?.percent || 0,
          streampayCouponId: appliedDiscount ? streampayCouponId : null,
          finalPrice,
          userData: {
            gender: '',
            activityLevel: '',
            fitnessLevel: '',
            workoutLocation: '',
            height: 0,
            weight: 0,
            birthYear: 0,
            age: 0,
            fitnessGoal: '',
            targetWeight: 0,
            daysPerWeek: '',
            splitPreference: 'ai_decide',
            trainingStyle: 'mixed',
            priorityMuscles: [],
            injuries: [],
            cardioPreference: '',
            targetSpeed: 0.5,
            challenges: [],
            accomplishments: [],
            calculatedCalories: 0,
            proteinGrams: 0,
            carbsGrams: 0,
            fatGrams: 0,
            proteinPercentage: 0,
            carbsPercentage: 0,
            fatPercentage: 0,
            programName: 'Vega Power',
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        setPaymentError(data.error || 'حدث خطأ في إنشاء رابط الدفع')
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
      setIsProcessing(false)
    }
  }

  const finalPrice = getFinalPrice(plans[selectedPlan].price)
  const currentReview = reviews[activeReview]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f7f5] to-[#edeae5]" dir="rtl">
      <div className="max-w-md mx-auto px-4 pb-8 pt-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Image src="/Vegapower Logo-05.jpg" alt="Vega Power" width={64} height={64} className="rounded-2xl shadow-md" />
          </div>
          <h1 className="text-2xl font-black text-vp-navy mb-1">Vega Power</h1>
          <p className="text-sm text-neutral-500">مدربك الشخصي بالذكاء الاصطناعي</p>
        </div>

        {/* Animated Progress Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
          <p className="text-[11px] text-neutral-400 text-center mb-1">شوف الفرق</p>
          <div className="flex justify-center gap-5 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-vp-navy" />
              <span className="text-[11px] font-medium text-neutral-700">مع Vega Power</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
              <span className="text-[11px] font-medium text-neutral-400">بدون خطة</span>
            </div>
          </div>
          <div className="relative" style={{ height: 180 }}>
            <svg viewBox="0 0 320 170" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="pw-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#123458" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#123458" stopOpacity="0.01" />
                </linearGradient>
                <filter id="pw-glow">
                  <feGaussianBlur stdDeviation="2" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1="35" y1={15 + i * 45} x2="310" y2={15 + i * 45} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
              ))}
              <text x="28" y="19" textAnchor="end" className="fill-current" fontSize="7" opacity="0.3">هدفك</text>
              <text x="28" y="84" textAnchor="end" className="fill-current" fontSize="7" opacity="0.3">الآن</text>
              <text x="28" y="154" textAnchor="end" className="fill-current" fontSize="7" opacity="0.3">بداية</text>
              {['اليوم', 'شهر ١', 'شهر ٣', 'شهر ٦'].map((l, i) => (
                <text key={i} x={35 + i * 92} y="168" textAnchor="middle" className="fill-current" fontSize="7" opacity="0.3">{l}</text>
              ))}
              <path d="M35,110 C127,105 200,85 265,40 S300,18 310,15 L310,150 L35,150 Z" fill="url(#pw-grad)" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 1s ease-out 0.5s' }} />
              <path d="M35,110 C127,112 200,115 265,113 S300,116 310,114" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={graphAnimated ? 0 : 400} style={{ transition: 'stroke-dashoffset 1.5s ease-out 0.3s' }} />
              <path d="M35,110 C127,105 200,85 265,40 S300,18 310,15" fill="none" stroke="#123458" strokeWidth="3" strokeLinecap="round" filter="url(#pw-glow)" strokeDasharray="400" strokeDashoffset={graphAnimated ? 0 : 400} style={{ transition: 'stroke-dashoffset 2s ease-out 0.6s' }} />
              <circle cx="310" cy="15" r="5" fill="#123458" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.3s ease-out 2.4s' }} />
              <circle cx="310" cy="15" r="8" fill="#123458" opacity={graphAnimated ? 0.2 : 0} style={{ transition: 'opacity 0.3s ease-out 2.4s' }}>
                {graphAnimated && <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />}
              </circle>
              <text x="310" y="8" textAnchor="middle" fontSize="11" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.5s ease-out 2.6s' }}>🎯</text>
              <circle cx="310" cy="114" r="4" fill="#d1d5db" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.3s ease-out 1.6s' }} />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            <div className="p-3 rounded-2xl bg-vp-navy/5 text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease-out 2s' }}>
              <p className="text-xl font-black text-vp-navy">3x</p>
              <p className="text-[10px] text-neutral-500">نتائج أسرع مع خطة مخصصة</p>
            </div>
            <div className="p-3 rounded-2xl bg-vp-navy/5 text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.5s ease-out 2.3s' }}>
              <p className="text-xl font-black text-vp-navy">%91</p>
              <p className="text-[10px] text-neutral-500">حققوا أهدافهم</p>
            </div>
          </div>
        </div>

        {/* What You Get — Feature Grid */}
        <div className="mb-4">
          <h2 className="text-base font-bold text-vp-navy mb-3 text-center">ايش بتحصل؟</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '🤖', title: 'برنامج تمارين AI', desc: 'مخصص لك ويتكيف أسبوعياً', color: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
              { icon: '🍽️', title: 'سعرات وماكروز', desc: 'أرقام دقيقة لنتائج حقيقية', color: 'from-green-50 to-emerald-50', border: 'border-green-100' },
              { icon: '📊', title: 'تتبع التقدم', desc: 'شوف تطورك كل أسبوع', color: 'from-purple-50 to-violet-50', border: 'border-purple-100' },
              { icon: '👥', title: 'مجتمع محفز', desc: 'آلاف يتمرنون معك', color: 'from-orange-50 to-amber-50', border: 'border-orange-100' },
            ].map((f) => (
              <div key={f.title} className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-3.5 text-center`}>
                <span className="text-2xl block mb-1.5">{f.icon}</span>
                <p className="text-xs font-bold text-neutral-800 mb-0.5">{f.title}</p>
                <p className="text-[10px] text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 bg-gradient-to-br from-vp-navy/5 to-vp-navy/10 border border-vp-navy/10 rounded-2xl p-3.5 flex items-center gap-3">
            <span className="text-2xl shrink-0">🔄</span>
            <div>
              <p className="text-xs font-bold text-neutral-800">برنامج يتطور معك</p>
              <p className="text-[10px] text-neutral-500">يتغير ويتحدث كل فترة — مو برنامج ثابت</p>
            </div>
          </div>
        </div>

        {/* Results Banner */}
        <div className="bg-vp-navy rounded-3xl p-5 mb-4 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative">
            <p className="text-xs font-medium opacity-80 mb-2">نتائج حقيقية من متدربينا</p>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-3xl font-black">-١٢</p>
                <p className="text-[10px] opacity-70">كيلو بـ ٣ أشهر</p>
              </div>
              <div>
                <p className="text-3xl font-black">+٨</p>
                <p className="text-[10px] opacity-70">كيلو عضل نظيف</p>
              </div>
              <div>
                <p className="text-3xl font-black">%95</p>
                <p className="text-[10px] opacity-70">التزام بالبرنامج</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-5">
          <h2 className="text-base font-bold text-vp-navy mb-3 text-center">تجارب المتدربين</h2>
          <div className="relative overflow-hidden min-h-[90px]">
            <div className="transition-all duration-500">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-vp-navy/10 flex items-center justify-center shrink-0 text-sm font-bold text-vp-navy">
                  {currentReview.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-neutral-800">{currentReview.name}</span>
                    <StarRating count={currentReview.rating} />
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{currentReview.text}</p>
                  <p className="text-[10px] text-neutral-400 mt-1.5">{currentReview.period}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveReview(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeReview ? 'bg-vp-navy w-4' : 'bg-neutral-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs text-neutral-500 mb-1.5 text-center">البريد الإلكتروني</label>
          <EmailInput value={email} onChange={setEmail} />
          {email.trim() && !validateEmail(email) && (
            <p className="text-xs text-red-500 text-center mt-1">أدخل بريداً إلكترونياً صحيحاً</p>
          )}
        </div>

        {/* Plan Selection */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(plans) as [PlanType, typeof plans[PlanType]][]).map(([key, plan]) => {
              const price = getFinalPrice(plan.price)
              const daily = getDailyPrice(price, plan.days)
              const isSelected = selectedPlan === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`relative rounded-2xl p-3.5 text-center transition-all duration-200 border-2 ${
                    isSelected
                      ? 'bg-vp-navy text-white border-vp-navy shadow-lg shadow-vp-navy/20 scale-[1.02]'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-vp-navy/30'
                  }`}
                >
                  {key === 'yearly' && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full text-amber-900 whitespace-nowrap">
                      الأوفر 🔥
                    </div>
                  )}
                  <p className={`text-[11px] mb-1 ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>{plan.label}</p>
                  <p className="text-xl font-black leading-tight">{price}</p>
                  <p className={`text-[10px] ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}>ريال</p>
                  <div className={`mt-2 pt-2 border-t ${isSelected ? 'border-white/20' : 'border-neutral-100'}`}>
                    <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>{daily} ر.س/يوم</p>
                  </div>
                  {appliedDiscount && (
                    <p className={`text-[10px] mt-1 line-through ${isSelected ? 'text-white/40' : 'text-neutral-300'}`}>
                      {plan.price} ريال
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Discount Code */}
        <div className="mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(''); setAppliedDiscount(null) }}
              placeholder="كود خصم"
              dir="ltr"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/80 backdrop-blur border border-neutral-200 outline-none text-sm text-center focus:border-vp-navy/50 focus:ring-2 focus:ring-vp-navy/10 transition-all"
            />
            <button
              onClick={applyDiscountCode}
              disabled={!discountCode.trim() || discountValidating}
              className="px-5 py-3 rounded-2xl bg-neutral-800 text-white text-sm font-semibold disabled:opacity-40 hover:bg-neutral-700 transition-colors"
            >
              {discountValidating ? '...' : 'تطبيق'}
            </button>
          </div>
          {discountError && <p className="text-xs text-red-500 text-center mt-1.5">{discountError}</p>}
          {appliedDiscount && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-green-600 text-xs">✓</span>
              <p className="text-xs text-green-600 font-medium">تم تطبيق خصم {appliedDiscount.label}</p>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handlePayment}
          disabled={!validateEmail(email) || isProcessing}
          className="w-full py-4 rounded-2xl bg-vp-navy text-white font-bold text-base shadow-xl shadow-vp-navy/25 disabled:opacity-50 hover:bg-[#1a4570] active:scale-[0.98] transition-all duration-200 mb-3"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري المعالجة...
            </span>
          ) : (
            `ابدأ الآن — ${finalPrice} ريال / ${plans[selectedPlan].period}`
          )}
        </button>

        {paymentError && (
          <p className="text-xs text-red-500 text-center mb-3">{paymentError}</p>
        )}

        <p className="text-[11px] text-neutral-400 text-center mb-3 leading-relaxed">
          اشتراك يتجدد تلقائياً — تقدر تلغيه أي وقت من التطبيق أو عبر الدعم
        </p>

        {/* Trust Signals */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">🔒 دفع آمن</span>
            <span className="flex items-center gap-1">↩️ إلغاء بسهولة</span>
            <span className="flex items-center gap-1">⚡ وصول فوري</span>
          </div>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            بالاشتراك أنت توافق على <span className="underline">شروط الاستخدام</span> و <span className="underline">سياسة الخصوصية</span>
          </p>
        </div>

      </div>
    </div>
  )
}
