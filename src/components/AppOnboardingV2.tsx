'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import {
  CreditCard, Lock, ChevronDown, ChevronUp, Scale, Flame,
  Sprout, Footprints, Dumbbell, TrendingUp, Sparkles, Star, Check,
  Camera, BarChart3, Users, Zap, X, ArrowDown, Shield,
  Target, CalendarCheck, Brain,
} from 'lucide-react'
import { initiateCheckout } from '@/lib/meta-pixel'
import { snapStartCheckout } from '@/lib/snapchat-pixel'
import { ttInitiateCheckout } from '@/lib/tiktok-pixel'
import posthog from 'posthog-js'

// ─── Config ──────────────────────────────────────────────────────────
const EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'outlook.sa', 'live.com']

const discountCodes: Record<string, { percent: number; label: string }> = {
  'VEGA10': { percent: 10, label: '10%' },
  'VEGA20': { percent: 20, label: '20%' },
  'NEWYEAR': { percent: 15, label: '15%' },
  'FITNESS': { percent: 10, label: '10%' },
}

const plan = { price: 216, period: 'سنة', productId: 'myfatoorah_yearly', days: 365, label: 'سنوي' }

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// ─── Component ───────────────────────────────────────────────────────
export default function AppOnboardingV2() {
  // Personalization state
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain' | ''>('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [activity, setActivity] = useState<'light' | 'moderate' | 'active' | ''>('')

  // Email state
  const [email, setEmail] = useState('')
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false)
  const [filteredDomains, setFilteredDomains] = useState<string[]>([])
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Payment state
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; label: string } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [streampayCouponId, setStreampayCouponId] = useState<string | null>(null)
  const [mfScriptLoaded, setMfScriptLoaded] = useState(false)
  const [mfInitialized, setMfInitialized] = useState(false)
  const [mfEncryptionKey, setMfEncryptionKey] = useState('')
  const [mfSessionLoading, setMfSessionLoading] = useState(false)
  const mfContainerRef = useRef<HTMLDivElement>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [tamaraLoading, setTamaraLoading] = useState(false)

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Results visibility
  const [resultsVisible, setResultsVisible] = useState(false)
  const [resultsTracked, setResultsTracked] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Sticky CTA visibility
  const [showStickyCta, setShowStickyCta] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  // ─── Calculations ────────────────────────────────────────────────
  const allFilled = gender !== '' && goal !== '' && activity !== '' &&
    height !== '' && weight !== '' && age !== '' &&
    Number(height) > 0 && Number(weight) > 0 && Number(age) > 0

  const calculations = useMemo(() => {
    if (!allFilled) return null
    const h = Number(height)
    const w = Number(weight)
    const a = Number(age)

    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

    const multipliers = { light: 1.375, moderate: 1.55, active: 1.725 }
    const tdee = bmr * multipliers[activity as 'light' | 'moderate' | 'active']

    const calories = Math.round(
      goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee
    )

    const proteinGrams = Math.round(w * 2)
    const fatGrams = Math.round((calories * 0.25) / 9)
    const carbsGrams = Math.round((calories - (proteinGrams * 4) - (fatGrams * 9)) / 4)

    return { calories, proteinGrams, fatGrams, carbsGrams }
  }, [gender, goal, height, weight, age, activity, allFilled])

  // ─── Show results with animation ────────────────────────────────
  useEffect(() => {
    if (calculations && !resultsVisible) {
      const timer = setTimeout(() => {
        setResultsVisible(true)
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [calculations, resultsVisible])

  useEffect(() => {
    if (resultsVisible && !resultsTracked) {
      posthog.capture('onboarding_v2_results_shown')
      setResultsTracked(true)
    }
  }, [resultsVisible, resultsTracked])

  // ─── PostHog: page view ──────────────────────────────────────────
  useEffect(() => {
    posthog.capture('onboarding_v2_viewed')
  }, [])

  // ─── Sticky CTA: show after scrolling past hero ─────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  // ─── Price helpers ───────────────────────────────────────────────
  const getFinalPrice = useCallback((basePrice: number) => {
    if (appliedDiscount) return Math.round(basePrice * (1 - appliedDiscount.percent / 100))
    return basePrice
  }, [appliedDiscount])

  const finalPrice = getFinalPrice(plan.price)

  // ─── Email domain autocomplete ───────────────────────────────────
  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (val.includes('@')) {
      const afterAt = val.split('@')[1] || ''
      const matches = EMAIL_DOMAINS.filter(d => d.startsWith(afterAt) && d !== afterAt)
      setFilteredDomains(matches)
      setShowDomainSuggestions(matches.length > 0)
    } else {
      setShowDomainSuggestions(false)
    }
  }

  const selectDomain = (domain: string) => {
    const localPart = email.split('@')[0]
    setEmail(`${localPart}@${domain}`)
    setShowDomainSuggestions(false)
    emailInputRef.current?.focus()
  }

  // ─── Discount code ──────────────────────────────────────────────
  const applyDiscountCode = async () => {
    const code = discountCode.toUpperCase().trim()
    if (discountCodes[code]) {
      setAppliedDiscount(discountCodes[code])
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
      } else {
        setDiscountError('كود الخصم غير صالح')
      }
    } catch {
      setDiscountError('حدث خطأ في التحقق من الكود')
    } finally {
      setDiscountValidating(false)
    }
  }

  // ─── Build userData for payment backend ──────────────────────────
  const buildUserData = () => {
    const w = Number(weight) || 0
    const h = Number(height) || 0
    const a = Number(age) || 0
    const cal = calculations?.calories || 0
    const prot = calculations?.proteinGrams || 0
    const carbs = calculations?.carbsGrams || 0
    const fat = calculations?.fatGrams || 0
    const totalCal = prot * 4 + carbs * 4 + fat * 9
    return {
      gender,
      activityLevel: activity,
      fitnessLevel: '',
      workoutLocation: '',
      height: h,
      weight: w,
      birthYear: new Date().getFullYear() - a,
      age: a,
      fitnessGoal: goal === 'lose' ? 'خسارة الوزن' : goal === 'gain' ? 'زيادة الوزن' : 'الحفاظ على الوزن',
      targetWeight: w,
      daysPerWeek: '',
      splitPreference: '',
      trainingStyle: '',
      priorityMuscles: [] as string[],
      injuries: [] as string[],
      cardioPreference: '',
      targetSpeed: 0.5,
      challenges: [] as string[],
      motivation: '',
      accomplishments: [''],
      calculatedCalories: cal,
      proteinGrams: prot,
      carbsGrams: carbs,
      fatGrams: fat,
      proteinPercentage: totalCal > 0 ? Math.round((prot * 4 / totalCal) * 100) : 0,
      carbsPercentage: totalCal > 0 ? Math.round((carbs * 4 / totalCal) * 100) : 0,
      fatPercentage: totalCal > 0 ? Math.round((fat * 9 / totalCal) * 100) : 0,
      programName: 'Vega Power AI',
    }
  }

  // ─── MyFatoorah payment ──────────────────────────────────────────
  const initMyFatoorahPayment = async () => {
    if (!validateEmail(email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    if (mfInitialized || mfSessionLoading) return

    setMfSessionLoading(true)
    setPaymentError('')

    posthog.capture('onboarding_v2_payment_initiated', { method: 'myfatoorah', amount: finalPrice })

    initiateCheckout({
      content_ids: [plan.productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })
    snapStartCheckout({
      price: finalPrice,
      currency: 'SAR',
      item_ids: [plan.productId],
    })
    ttInitiateCheckout({
      content_id: plan.productId,
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
    })

    try {
      const response = await fetch('/api/myfatoorah/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          email,
          productId: 'app_yearly',
        }),
      })
      const data = await response.json()
      if (!data.success) {
        setPaymentError('فشل في إنشاء جلسة الدفع. يرجى المحاولة مرة أخرى.')
        setMfSessionLoading(false)
        return
      }

      setMfEncryptionKey(data.encryptionKey)

      if (mfContainerRef.current) mfContainerRef.current.innerHTML = ''

      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myfatoorah = (window as any).myfatoorah
        if (!myfatoorah) {
          setPaymentError('حدث خطأ في تحميل نموذج الدفع. يرجى تحديث الصفحة.')
          setMfSessionLoading(false)
          return
        }

        myfatoorah.init({
          sessionId: data.sessionId,
          containerId: 'mf-app-form-v2',
          shouldHandlePaymentUrl: true,
          callback: async (paymentResponse: {
            isSuccess: boolean
            sessionId: string
            paymentCompleted: boolean
            paymentData?: string
            redirectionUrl?: string
          }) => {
            if (paymentResponse.isSuccess && paymentResponse.paymentCompleted && paymentResponse.paymentData) {
              setIsProcessingPayment(true)
              try {
                const userData = buildUserData()
                const verifyRes = await fetch('/api/myfatoorah/verify-app', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentData: paymentResponse.paymentData,
                    encryptionKey: data.encryptionKey,
                    email,
                    plan: 'yearly',
                    amount: finalPrice,
                    discountCode: appliedDiscount ? discountCode : null,
                    authMethod: 'email',
                    userData: JSON.stringify(userData),
                  }),
                })
                const result = await verifyRes.json()
                if (result.success) {
                  posthog.capture('onboarding_v2_payment_completed', { amount: finalPrice, method: 'myfatoorah' })
                  sessionStorage.setItem('mf_payment_result', JSON.stringify({
                    success: true, email, plan: 'yearly', amount: finalPrice,
                  }))
                  window.location.href = `/app/success?source=streampay&email=${encodeURIComponent(email)}&plan=yearly&amount=${finalPrice}&session=mf_${Date.now()}&authMethod=email${discountCode && appliedDiscount ? `&discountCode=${discountCode}` : ''}`
                } else {
                  setPaymentError(result.error || 'فشل في التحقق من الدفع')
                  setIsProcessingPayment(false)
                }
              } catch {
                setPaymentError('حدث خطأ في التحقق من الدفع.')
                setIsProcessingPayment(false)
              }
            } else if (paymentResponse.isSuccess && paymentResponse.redirectionUrl) {
              // hosted payment method redirect
            } else if (!paymentResponse.isSuccess) {
              setPaymentError('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.')
            }
          },
        })
        setMfInitialized(true)
        setMfSessionLoading(false)
      }, 200)
    } catch {
      setPaymentError('حدث خطأ. يرجى المحاولة مرة أخرى.')
      setMfSessionLoading(false)
    }
  }

  // ─── Tamara checkout ─────────────────────────────────────────────
  const handleTamaraCheckout = async () => {
    if (!validateEmail(email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    setTamaraLoading(true)
    setPaymentError('')

    posthog.capture('onboarding_v2_payment_initiated', { method: 'tamara', amount: finalPrice })

    initiateCheckout({
      content_ids: [plan.productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })
    snapStartCheckout({
      price: finalPrice,
      currency: 'SAR',
      item_ids: [plan.productId],
    })
    ttInitiateCheckout({
      content_id: plan.productId,
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
    })

    try {
      const userData = buildUserData()
      sessionStorage.setItem('tamara_userData', JSON.stringify(userData))

      const response = await fetch('/api/tamara/app-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: finalPrice,
          plan: 'yearly',
          discountCode: appliedDiscount ? discountCode : null,
        }),
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
        posthog.capture('onboarding_v2_payment_completed', { amount: finalPrice, method: 'tamara' })
        window.location.href = data.checkoutUrl
      } else {
        setPaymentError(data.error || 'فشل في إنشاء جلسة تمارا. يرجى المحاولة مرة أخرى.')
        setTamaraLoading(false)
      }
    } catch {
      setPaymentError('حدث خطأ. يرجى المحاولة مرة أخرى.')
      setTamaraLoading(false)
    }
  }

  // ─── FAQ data ────────────────────────────────────────────────────
  const faqs = [
    { q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟', a: 'الاشتراك السنوي دفعة واحدة بدون تجديد تلقائي. لا تحتاج لإلغاء أي شيء.' },
    { q: 'هل التطبيق مناسب للمبتدئين؟', a: 'نعم! التطبيق يصمم برنامجاً مخصصاً حسب مستواك ويتطور معك تدريجياً.' },
    { q: 'كيف أحصل على البرنامج بعد الدفع؟', a: 'ستصلك بيانات الدخول على بريدك الإلكتروني فوراً بعد الدفع. حمّل التطبيق وسجّل دخولك.' },
    { q: 'هل يعمل التطبيق بدون إنترنت؟', a: 'نعم، بعد تحميل برنامجك يعمل بدون إنترنت. تحتاج اتصال فقط للمزامنة والتحديث.' },
  ]

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white text-vp-navy" style={{ scrollBehavior: 'smooth' }}>
      <Script
        src={process.env.NEXT_PUBLIC_MYFATOORAH_JS_URL || 'https://sa.myfatoorah.com/sessions/v1/session.js'}
        onLoad={() => setMfScriptLoaded(true)}
      />

      {/* ═══════════════════════════════════════════════════════════════
          STICKY BOTTOM CTA BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-vp-navy/10 px-4 py-3 transition-all duration-300 ease-out ${
          showStickyCta ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-bold">{finalPrice} ر.س</span>
            <span className="text-vp-navy/40 text-xs mr-1">/سنة</span>
          </div>
          <button
            onClick={() => document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="cursor-pointer flex-1 max-w-[200px] py-3 rounded-xl bg-amber-500 text-vp-navy font-bold text-sm shadow-lg hover:bg-amber-400 transition-all duration-200 ease-out"
          >
            اشترك الآن
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pb-28">

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: Hero — Emotional Hook
        ═══════════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="min-h-[90vh] flex flex-col items-center justify-center text-center pt-12 pb-8">
          <Image
            src="/Vegapower Logo-05.jpg"
            alt="Vega Power"
            width={80}
            height={80}
            className="rounded-2xl mb-6 shadow-lg"
            priority
          />

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.2] mb-4 tracking-tight">
            مدربك الشخصي<br />
            <span className="text-amber-500">في جيبك</span>
          </h1>

          <p className="text-lg text-vp-navy/60 mb-8 max-w-xs mx-auto leading-relaxed">
            تمارين مخصصة، تغذية ذكية، وتتبع تقدمك — كل شيء بالذكاء الاصطناعي
          </p>

          {/* Social proof counter */}
          <div className="flex flex-col items-center gap-3 mb-10">
            <div className="flex -space-x-2.5 rtl:space-x-reverse">
              {['bg-amber-400', 'bg-sky-400', 'bg-rose-400', 'bg-emerald-400', 'bg-violet-400'].map((color, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full ${color} border-[3px] border-white flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                >
                  {['A', 'S', 'M', 'N', 'K'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-vp-navy/50 font-medium">
              <span className="font-extrabold text-vp-navy text-base">+28,900</span> شخص يستخدمون فيقا باور
            </p>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold">847 شخص اشتركوا هذا الأسبوع</span>
            </div>
          </div>

          {/* Scroll indicator */}
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="cursor-pointer animate-bounce"
            aria-label="انتقل للأسفل"
          >
            <ArrowDown className="w-7 h-7 text-vp-navy/30" />
          </button>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: Feature Showcase — Create Desire
        ═══════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-14">
          <h2 className="text-2xl font-extrabold text-center mb-3">
            كل اللي تحتاجه في تطبيق واحد
          </h2>
          <p className="text-center text-vp-navy/50 text-sm mb-10">
            لا تطبيقات كثيرة ولا حسابات يدوية — كل شيء جاهز لك
          </p>

          <div className="space-y-4">
            {/* AI Meal Scanner — killer feature */}
            <div className="bg-gradient-to-bl from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-3 left-3">
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">الأكثر طلباً</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">ماسح الوجبات بالذكاء الاصطناعي</h3>
              <p className="text-sm text-vp-navy/60 leading-relaxed">صوّر وجبتك وخلّ الذكاء الاصطناعي يحسب السعرات والماكروز في ثانية. بدون إدخال يدوي، بدون تخمين.</p>
            </div>

            {/* Two cards row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sky-50 border border-sky-200/50 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold mb-1">برنامج AI يتطور معك</h3>
                <p className="text-xs text-vp-navy/50 leading-relaxed">مو برنامج ثابت — يتغير ويتطور كل ما تتقدم</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold mb-1">تتبع أوزانك وتقدمك</h3>
                <p className="text-xs text-vp-navy/50 leading-relaxed">سجّل أوزانك في الجيم وشوف تطورك بالأرقام</p>
              </div>
            </div>

            {/* Two more cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 border border-purple-200/50 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm font-bold mb-1">سعرات وماكروز دقيقة</h3>
                <p className="text-xs text-vp-navy/50 leading-relaxed">حساب مخصص لجسمك وهدفك بالضبط</p>
              </div>

              <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-sm font-bold mb-1">مجتمع يحفزك</h3>
                <p className="text-xs text-vp-navy/50 leading-relaxed">+28,900 متدرب يشاركونك الرحلة والتحفيز</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: Without vs With — Loss Aversion
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-14">
          <h2 className="text-2xl font-extrabold text-center mb-10">الفرق واضح</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Without header */}
            <div className="bg-neutral-100 rounded-t-2xl px-4 py-3 text-center">
              <X className="w-5 h-5 mx-auto text-red-400 mb-1" />
              <p className="text-xs font-bold text-neutral-500">بدون التطبيق</p>
            </div>
            <div className="bg-vp-navy rounded-t-2xl px-4 py-3 text-center">
              <Check className="w-5 h-5 mx-auto text-green-400 mb-1" />
              <p className="text-xs font-bold text-white">مع فيقا باور</p>
            </div>

            {/* Rows */}
            {[
              ['تحسب سعراتك يدوياً وتنسى', 'تصوّر وجبتك والباقي علينا'],
              ['تتمرن عشوائي بدون خطة', 'برنامج مصمم لهدفك بالضبط'],
              ['ما تدري إذا تتقدم أو لا', 'تشوف تطورك بالأرقام كل أسبوع'],
              ['تبدأ متحمس وتوقف بعد أسبوع', 'مجتمع ودعم يخليك مستمر'],
            ].map(([without, withApp], i) => (
              <div key={i} className="contents">
                <div className={`bg-neutral-50 px-4 py-3.5 ${i === 3 ? 'rounded-b-2xl' : ''} border-b border-neutral-100`}>
                  <p className="text-xs text-neutral-400 leading-relaxed">{without}</p>
                </div>
                <div className={`bg-vp-navy/95 px-4 py-3.5 ${i === 3 ? 'rounded-b-2xl' : ''} border-b border-white/5`}>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">{withApp}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: Quick Personalization
        ═══════════════════════════════════════════════════════════════ */}
        <section id="personalization" className="py-14 space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold mb-2">
              <Sparkles className="inline-block w-6 h-6 ml-2 text-amber-500" />
              خصّص برنامجك في 30 ثانية
            </h2>
            <p className="text-sm text-vp-navy/50">أربع أسئلة بس وبرنامجك جاهز</p>
          </div>

          {/* Q1: Gender */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold">الجنس</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'male' as const, label: 'ذكر', icon: <Dumbbell className="w-6 h-6" /> },
                { value: 'female' as const, label: 'أنثى', icon: <Sprout className="w-6 h-6" /> },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setGender(opt.value)
                    posthog.capture('onboarding_v2_gender_selected', { gender: opt.value })
                  }}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 ease-out min-h-[80px] text-lg font-semibold
                    ${gender === opt.value
                      ? 'border-vp-navy bg-vp-navy text-white shadow-lg scale-[1.02]'
                      : 'border-vp-navy/15 bg-white hover:border-vp-navy/40 text-vp-navy'
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Goal */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold">هدفك</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'lose' as const, label: 'خسارة الوزن', icon: <Scale className="w-5 h-5" /> },
                { value: 'maintain' as const, label: 'الحفاظ على الوزن', icon: <Footprints className="w-5 h-5" /> },
                { value: 'gain' as const, label: 'زيادة الوزن', icon: <TrendingUp className="w-5 h-5" /> },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setGoal(opt.value)
                    posthog.capture('onboarding_v2_goal_selected', { goal: opt.value })
                  }}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ease-out min-h-[90px] text-sm font-semibold text-center leading-snug
                    ${goal === opt.value
                      ? 'border-vp-navy bg-vp-navy text-white shadow-lg scale-[1.02]'
                      : 'border-vp-navy/15 bg-white hover:border-vp-navy/40 text-vp-navy'
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Body Metrics */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold">قياساتك</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: height, setter: setHeight, placeholder: 'الطول', unit: 'سم' },
                { value: weight, setter: setWeight, placeholder: 'الوزن', unit: 'كجم' },
                { value: age, setter: setAge, placeholder: 'العمر', unit: 'سنة' },
              ]).map((field, i) => (
                <div key={i} className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={field.value}
                    onChange={(e) => {
                      field.setter(e.target.value)
                      const vals = [height, weight, age]
                      vals[i] = e.target.value
                      if (vals.every(v => v !== '' && Number(v) > 0)) {
                        posthog.capture('onboarding_v2_metrics_completed')
                      }
                    }}
                    placeholder={field.placeholder}
                    className="w-full p-4 rounded-2xl border-2 border-vp-navy/15 bg-white text-center text-lg font-semibold text-vp-navy placeholder:text-vp-navy/30 outline-none transition-all duration-200 ease-out focus:border-vp-navy/50 focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2"
                    min={1}
                  />
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] text-vp-navy/40 font-medium">
                    {field.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Q4: Activity Level */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold">مستوى نشاطك</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'light' as const, label: 'نشاط خفيف', sub: '0-2 تمارين/أسبوع', icon: <Footprints className="w-5 h-5" /> },
                { value: 'moderate' as const, label: 'نشاط متوسط', sub: '3-5 تمارين/أسبوع', icon: <Flame className="w-5 h-5" /> },
                { value: 'active' as const, label: 'نشاط عالي', sub: '6+ تمارين/أسبوع', icon: <Dumbbell className="w-5 h-5" /> },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setActivity(opt.value)
                    posthog.capture('onboarding_v2_activity_selected', { activity: opt.value })
                  }}
                  className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-200 ease-out min-h-[100px] text-center leading-snug
                    ${activity === opt.value
                      ? 'border-vp-navy bg-vp-navy text-white shadow-lg scale-[1.02]'
                      : 'border-vp-navy/15 bg-white hover:border-vp-navy/40 text-vp-navy'
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2`}
                >
                  {opt.icon}
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className={`text-[10px] ${activity === opt.value ? 'text-white/60' : 'text-vp-navy/40'}`}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: Results Preview
        ═══════════════════════════════════════════════════════════════ */}
        <div ref={resultsRef}>
          {calculations && (
            <section
              className={`py-6 transition-all duration-500 ease-out ${
                resultsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="bg-vp-navy rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold">نتائجك المخصصة جاهزة</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/10 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-green-400">{calculations.calories}</p>
                    <p className="text-[11px] text-white/50 mt-1">سعرة / يوم</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-blue-400">{calculations.proteinGrams}g</p>
                    <p className="text-[11px] text-white/50 mt-1">بروتين</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-purple-400">{calculations.carbsGrams}g</p>
                    <p className="text-[11px] text-white/50 mt-1">كربوهيدرات</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 text-center">
                    <p className="text-3xl font-extrabold text-yellow-400">{calculations.fatGrams}g</p>
                    <p className="text-[11px] text-white/50 mt-1">دهون</p>
                  </div>
                </div>

                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-amber-300">
                    اشترك الآن وابدأ برنامجك المخصص
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: Price Anchoring — Make It Feel Like a Steal
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-14">
          <h2 className="text-2xl font-extrabold text-center mb-3">قارن بنفسك</h2>
          <p className="text-center text-vp-navy/50 text-sm mb-8">كل هذا بسعر أقل من كوب قهوة في الأسبوع</p>

          {/* Price comparison cards */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm font-semibold">مدرب شخصي</span>
              </div>
              <span className="text-sm font-bold text-red-500 line-through">+500 ر.س/شهر</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm font-semibold">أخصائي تغذية</span>
              </div>
              <span className="text-sm font-bold text-red-500 line-through">+300 ر.س/جلسة</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-bold block">فيقا باور</span>
                  <span className="text-[11px] text-green-600">مدرب + تغذية + تتبع + مجتمع</span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-lg font-extrabold text-green-600">{Math.round(finalPrice / 12)} ر.س</span>
                <span className="text-[11px] text-green-600 block">/شهر فقط</span>
              </div>
            </div>
          </div>

          {/* Savings callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-sm font-bold text-amber-800">
              توفّر أكثر من <span className="text-lg">9,400</span> ر.س سنوياً
            </p>
            <p className="text-xs text-amber-600 mt-1">مقارنة بمدرب شخصي + أخصائي تغذية</p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: Pricing Card + Offer
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-8">
          <div className="border-2 border-vp-navy/10 rounded-3xl p-8 relative overflow-hidden bg-gradient-to-b from-white to-vp-beige/20">
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="inline-block bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                خصم 60%
              </span>
              <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full animate-pulse">
                عرض محدود
              </span>
            </div>

            <div className="text-center mb-6 pt-6">
              <p className="text-sm text-vp-navy/50 font-semibold mb-1">{plan.label}</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-extrabold">{finalPrice}</span>
                <span className="text-lg text-vp-navy/60">ر.س/سنة</span>
              </div>
              {appliedDiscount && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  خصم {appliedDiscount.label} مطبق
                </p>
              )}
              <p className="text-vp-navy/40 text-sm mt-1">
                = {Math.round(finalPrice / 12)} ر.س/شهر &middot; أقل من قهوة في الأسبوع
              </p>
              <p className="text-vp-navy/30 line-through text-sm mt-1">540 ر.س</p>
              <p className="text-vp-navy/50 text-xs mt-2">دفعة واحدة &middot; بدون تجديد تلقائي</p>
            </div>

            {/* Discount code */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError('') }}
                  placeholder="كود الخصم (اختياري)"
                  className="flex-1 p-3 rounded-xl bg-white border-2 border-vp-navy/10 focus:border-vp-navy/40 outline-none text-sm text-center transition-colors duration-200"
                  dir="ltr"
                />
                <button
                  onClick={applyDiscountCode}
                  disabled={!discountCode.trim() || discountValidating}
                  className="cursor-pointer px-5 py-3 rounded-xl bg-vp-navy/10 text-vp-navy hover:bg-vp-navy/20 disabled:opacity-50 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2"
                >
                  {discountValidating ? '...' : 'تطبيق'}
                </button>
              </div>
              {discountError && <p className="text-red-500 text-xs mt-2 text-center">{discountError}</p>}
              {appliedDiscount && (
                <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-500/10 rounded-xl">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">تم تطبيق خصم {appliedDiscount.label}</span>
                </div>
              )}
            </div>

            {/* What's included — enhanced */}
            <div className="space-y-3">
              {[
                { text: 'ماسح وجبات بالذكاء الاصطناعي', icon: Camera },
                { text: 'جدول تمارين مخصص يتطور معك', icon: Brain },
                { text: 'تتبع أوزانك وتقدمك بالأرقام', icon: BarChart3 },
                { text: 'حساب سعرات وماكروز دقيق', icon: Target },
                { text: 'متابعة يومية وتحديث أسبوعي', icon: CalendarCheck },
                { text: 'مجتمع +28,900 متدرب للتحفيز', icon: Users },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-sm text-vp-navy/80 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: Email + Payment
        ═══════════════════════════════════════════════════════════════ */}
        <section id="payment-section" className="py-12 space-y-6">
          <h3 className="text-xl font-bold text-center mb-4">ابدأ الآن</h3>

          {/* Email input */}
          <div className="relative">
            <input
              ref={emailInputRef}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => {
                setTimeout(() => setShowDomainSuggestions(false), 150)
                if (validateEmail(email)) {
                  posthog.capture('onboarding_v2_email_entered')
                }
              }}
              onFocus={() => {
                if (email.includes('@')) {
                  const afterAt = email.split('@')[1] || ''
                  const matches = EMAIL_DOMAINS.filter(d => d.startsWith(afterAt) && d !== afterAt)
                  if (matches.length > 0) {
                    setFilteredDomains(matches)
                    setShowDomainSuggestions(true)
                  }
                }
              }}
              placeholder="البريد الإلكتروني"
              className="w-full p-4 rounded-2xl border-2 border-vp-navy/15 bg-white text-base font-medium text-vp-navy placeholder:text-vp-navy/30 outline-none transition-all duration-200 ease-out focus:border-vp-navy/50 focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2"
              dir="ltr"
            />
            {/* Domain suggestions */}
            {showDomainSuggestions && filteredDomains.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-vp-navy/10 rounded-xl shadow-lg z-20 overflow-hidden">
                {filteredDomains.map(domain => (
                  <button
                    key={domain}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectDomain(domain)}
                    className="cursor-pointer w-full px-4 py-3 text-sm text-right hover:bg-vp-beige/30 transition-colors duration-150 border-b border-vp-navy/5 last:border-b-0 focus-visible:outline-none focus-visible:bg-vp-beige/30"
                    dir="ltr"
                  >
                    {email.split('@')[0]}@<span className="font-semibold">{domain}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary CTA — MyFatoorah */}
          {!mfInitialized && !isProcessingPayment && (
            <button
              onClick={initMyFatoorahPayment}
              disabled={mfSessionLoading}
              className="cursor-pointer w-full py-4 rounded-2xl bg-amber-500 text-vp-navy font-bold text-lg shadow-lg shadow-amber-500/25 hover:bg-amber-400 disabled:opacity-50 transition-all duration-200 ease-out flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 min-h-[56px]"
            >
              {mfSessionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-vp-navy/30 border-t-vp-navy rounded-full animate-spin" />
                  <span>جاري تحميل نموذج الدفع...</span>
                </>
              ) : appliedDiscount ? (
                <>اشترك الآن - <span className="line-through opacity-60 mx-1">{plan.price}</span> {finalPrice} ريال</>
              ) : (
                <>اشترك الآن - {plan.price} ريال</>
              )}
            </button>
          )}

          {/* Processing overlay */}
          {isProcessingPayment && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-3 border-vp-navy/20 border-t-vp-navy rounded-full animate-spin mx-auto mb-4" />
              <p className="text-vp-navy/70 font-medium">جاري معالجة الدفع...</p>
            </div>
          )}

          {/* MyFatoorah embedded form */}
          <div id="mf-app-form-v2" ref={mfContainerRef} className={mfInitialized ? 'mb-4' : 'hidden'} />

          {/* Payment error */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-red-600 text-sm">{paymentError}</p>
            </div>
          )}

          {/* Divider */}
          {!isProcessingPayment && (
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-vp-navy/10" />
              <span className="text-sm text-vp-navy/40">أو</span>
              <div className="flex-1 h-px bg-vp-navy/10" />
            </div>
          )}

          {/* Tamara BNPL */}
          {!isProcessingPayment && (
            <button
              onClick={handleTamaraCheckout}
              disabled={tamaraLoading}
              className="cursor-pointer w-full py-4 rounded-2xl border-2 border-vp-navy/15 bg-white text-vp-navy font-semibold text-base hover:border-vp-navy/30 disabled:opacity-50 transition-all duration-200 ease-out flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2 min-h-[56px]"
            >
              {tamaraLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-vp-navy/30 border-t-vp-navy rounded-full animate-spin" />
                  <span>جاري التحويل...</span>
                </>
              ) : (
                <span>قسّمها على 4 دفعات - {Math.round(finalPrice / 4)} ر.س &times; 4 بدون فوائد</span>
              )}
            </button>
          )}

          {/* Payment methods + trust */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {['Visa', 'Mastercard', 'مدى', 'Apple Pay', 'Tamara'].map(m => (
                <span key={m} className="text-xs text-vp-navy/40 bg-vp-navy/5 px-3 py-1.5 rounded-lg font-medium">
                  {m}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-vp-navy/40">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">دفع آمن ومشفر</span>
              </div>
              <div className="flex items-center gap-1.5 text-vp-navy/40">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">بدون تجديد تلقائي</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: Testimonials — Social Proof with Specific Results
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-14">
          <h3 className="text-xl font-extrabold text-center mb-2">نتائج حقيقية من مستخدمين حقيقيين</h3>
          <p className="text-center text-vp-navy/40 text-sm mb-8">+4.9 تقييم على متجر التطبيقات</p>

          <div className="space-y-4">
            {[
              { text: 'التطبيق غير حياتي كلياً. خسيت 12 كيلو في 3 أشهر بدون حرمان — فقط التزمت بالسعرات اللي حسبها لي التطبيق', name: 'سارة', initial: 'س', result: '-12 كيلو', period: '3 أشهر' },
              { text: 'ماسح الوجبات شيء خرافي! أصوّر الأكل وبثانية يحسب لي كل شيء. ما عمري حسبت سعراتي بهالسهولة', name: 'محمد', initial: 'م', result: '+8 كيلو عضل', period: '4 أشهر' },
              { text: 'جربت تطبيقات كثيرة بس هذا أول تطبيق يعطيني برنامج يتغير معي كل أسبوع. المجتمع والدعم شيء مختلف', name: 'نورة', initial: 'ن', result: '-7 كيلو', period: 'شهرين' },
              { text: 'أنا مبتدئ وكنت ضايع وين أبدأ. التطبيق صمم لي برنامج كامل من الصفر. الحين صار عندي روتين ثابت', name: 'عبدالله', initial: 'ع', result: 'من 0 لـ 5 أيام/أسبوع', period: '6 أسابيع' },
            ].map((t, i) => (
              <div key={i} className="bg-vp-beige/15 rounded-2xl p-6">
                {/* Result badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <div className="bg-green-500/10 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {t.result} في {t.period}
                  </div>
                </div>
                <p className="text-sm text-vp-navy/70 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vp-navy text-white flex items-center justify-center font-bold text-sm">
                    {t.initial}
                  </div>
                  <span className="text-sm font-semibold text-vp-navy/60">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 10: FAQ
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-14 pb-16">
          <h3 className="text-xl font-extrabold text-center mb-8">أسئلة شائعة</h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border-2 border-vp-navy/10 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="cursor-pointer w-full flex items-center justify-between p-5 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vp-navy focus-visible:ring-offset-2 min-h-[56px]"
                >
                  <span className="text-base font-semibold text-vp-navy/90 flex-1">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-5 h-5 text-vp-navy/40 flex-shrink-0 mr-3" />
                    : <ChevronDown className="w-5 h-5 text-vp-navy/40 flex-shrink-0 mr-3" />
                  }
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-5 pb-5 text-sm text-vp-navy/60 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 11: Final CTA — Last Push
        ═══════════════════════════════════════════════════════════════ */}
        <section className="py-12 text-center">
          <div className="bg-vp-navy rounded-3xl p-8 text-white">
            <h3 className="text-xl font-extrabold mb-2">جاهز تبدأ رحلتك؟</h3>
            <p className="text-white/60 text-sm mb-6">انضم لـ +28,900 شخص غيّروا حياتهم مع فيقا باور</p>
            <button
              onClick={() => document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="cursor-pointer w-full py-4 rounded-2xl bg-amber-500 text-vp-navy font-bold text-lg hover:bg-amber-400 transition-all duration-200 ease-out shadow-lg"
            >
              اشترك الآن - {finalPrice} ر.س/سنة
            </button>
            <p className="text-white/40 text-[11px] mt-3">دفعة واحدة &middot; بدون تجديد تلقائي &middot; دفع آمن ومشفر</p>
          </div>
        </section>

      </div>
    </div>
  )
}
