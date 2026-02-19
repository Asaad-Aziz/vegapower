'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { initiateCheckout } from '@/lib/meta-pixel'
import { signInWithApple, checkAppleSignInRedirect } from '@/lib/firebase-client'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21

interface UserData {
  gender: 'male' | 'female' | ''
  activityLevel: string
  fitnessLevel: string
  workoutLocation: string
  height: number
  weight: number
  birthYear: number
  age: number
  fitnessGoal: string
  targetWeight: number
  daysPerWeek: string
  splitPreference: string
  trainingStyle: string
  priorityMuscles: string[]
  injuries: string[]
  cardioPreference: string
  targetSpeed: number
  challenges: string[]
  accomplishments: string[]
  email: string
  // Calculated values
  calculatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  proteinPercentage: number
  carbsPercentage: number
  fatPercentage: number
  programName: string
}

const plans = {
  monthly: { price: 45, period: 'شهر', productId: 'moyasar_monthly', savings: null, days: 30 },
  quarterly: { price: 92, period: '3 أشهر', productId: 'moyasar_3months', savings: 'وفر 23 ريال', days: 90 },
  yearly: { price: 155, period: 'سنة', productId: 'moyasar_yearly', savings: 'وفر 293 ريال', days: 365 }, // Special New Year offer - was 448
}

// Discount codes configuration
const discountCodes: Record<string, { percent: number; label: string }> = {
  'VEGA10': { percent: 10, label: '10%' },
  'VEGA20': { percent: 20, label: '20%' },
  'NEWYEAR': { percent: 15, label: '15%' },
  'FITNESS': { percent: 10, label: '10%' },
}

type PlanType = 'monthly' | 'quarterly' | 'yearly'

// Activity level mappings
const activityLevels = [
  { id: 'lightlyActive', emoji: '🐢', title: '0-2 تمارين', subtitle: 'نشاط خفيف أو خامل', value: 'نشاط خفيف (تمرين خفيف 1-3 أيام/أسبوع)', multiplier: 1.375 },
  { id: 'moderatelyActive', emoji: '🚶', title: '3-5 تمارين', subtitle: 'نشاط متوسط', value: 'نشط إلى حد ما (تمرين معتدل 3-5 أيام في الأسبوع)', multiplier: 1.55 },
  { id: 'veryActive', emoji: '🔥', title: '6+ تمارين', subtitle: 'نشاط عالي / رياضي', value: 'نشيط للغاية (ممارسة التمارين الرياضية الشاقة 6-7 أيام في الأسبوع)', multiplier: 1.725 },
]

// Fitness goals
const fitnessGoals = [
  { id: 'loseWeight', emoji: '⬇️', title: 'خسارة الوزن', value: 'Lose Fat (Cut)' },
  { id: 'maintainWeight', emoji: '⚖️', title: 'الحفاظ على الوزن', value: 'Body Recomposition' },
  { id: 'gainMuscle', emoji: '⬆️', title: 'زيادة الوزن / عضلات', value: 'Build Muscle (Bulk)' },
]

// Challenges
const challengeOptions = [
  { id: 'lack_consistency', emoji: '📊', title: 'عدم الاستمرار' },
  { id: 'unhealthy_habits', emoji: '🍴', title: 'عادات أكل غير صحية' },
  { id: 'lack_support', emoji: '👥', title: 'قلة الدعم والتشجيع' },
  { id: 'busy_schedule', emoji: '📅', title: 'جدول مزدحم' },
  { id: 'meal_inspiration', emoji: '💡', title: 'قلة الأفكار للوجبات' },
]

// Accomplishments
const accomplishmentOptions = [
  { id: 'healthier_lifestyle', emoji: '🍃', title: 'أكل وحياة صحية أكثر' },
  { id: 'boost_energy', emoji: '☀️', title: 'زيادة طاقتي ومزاجي' },
  { id: 'stay_motivated', emoji: '💪', title: 'البقاء متحفزاً ومستمراً' },
  { id: 'body_confidence', emoji: '🧍', title: 'الشعور بالرضا عن جسمي' },
]

// Fitness levels
const fitnessLevelOptions = [
  { id: 'Beginner', emoji: '🌱', title: 'مبتدئ', subtitle: 'جديد على التمارين أو عائد بعد انقطاع طويل' },
  { id: 'Intermediate', emoji: '💪', title: 'متوسط', subtitle: 'أتمرن بانتظام منذ فترة' },
  { id: 'Advanced', emoji: '🏆', title: 'متقدم', subtitle: 'خبرة طويلة ومستوى لياقة عالي' },
]

// Workout locations
const workoutLocationOptions = [
  { id: 'Gym', emoji: '🏋️', title: 'النادي الرياضي', subtitle: 'أتمرن في الجيم مع المعدات الكاملة' },
  { id: 'Home', emoji: '🏠', title: 'المنزل', subtitle: 'أتمرن في البيت بأدوات بسيطة أو بدون أدوات' },
]

// Days per week
const daysPerWeekOptions = [
  { id: '3', emoji: '3️⃣', title: '٣ أيام', subtitle: 'مثالي للمبتدئين' },
  { id: '5', emoji: '5️⃣', title: '٥ أيام', subtitle: 'الخيار الأكثر شيوعاً' },
  { id: '7', emoji: '7️⃣', title: '٧ أيام', subtitle: 'للرياضيين المتقدمين' },
]

// Split preference
const splitPreferenceOptions = [
  { id: 'full_body', emoji: '🏋️', title: 'جسم كامل', subtitle: 'تمرين جميع العضلات في كل جلسة' },
  { id: 'upper_lower', emoji: '🔄', title: 'علوي / سفلي', subtitle: 'تبديل بين الجزء العلوي والسفلي' },
  { id: 'push_pull_legs', emoji: '💪', title: 'دفع / سحب / أرجل', subtitle: 'فصل تمارين الدفع والسحب والأرجل' },
  { id: 'muscle_split', emoji: '🎯', title: 'تقسيم عضلي', subtitle: 'مجموعة عضلية واحدة في اليوم' },
  { id: 'ai_decide', emoji: '🤖', title: 'دع الذكاء الاصطناعي يقرر', subtitle: 'AI يختار أفضل تقسيم لك' },
]

// Training style
const trainingStyleOptions = [
  { id: 'strength', emoji: '🏋️', title: 'قوة وطاقة', subtitle: 'أوزان ثقيلة، تكرارات قليلة' },
  { id: 'hypertrophy', emoji: '💪', title: 'بناء العضلات', subtitle: 'أوزان متوسطة، تكرارات أكثر' },
  { id: 'functional', emoji: '🤸', title: 'لياقة وظيفية', subtitle: 'وزن الجسم، مرونة، حركات رياضية' },
  { id: 'mixed', emoji: '🔀', title: 'مزيج من كل شيء', subtitle: 'تنوع في جميع أنماط التمرين' },
]

// Priority muscles
const priorityMuscleOptions = [
  { id: 'chest', emoji: '🫁', title: 'الصدر' },
  { id: 'back', emoji: '🔙', title: 'الظهر' },
  { id: 'shoulders', emoji: '🤷', title: 'الأكتاف' },
  { id: 'arms', emoji: '💪', title: 'الذراعين' },
  { id: 'legs', emoji: '🦵', title: 'الأرجل' },
  { id: 'glutes', emoji: '🍑', title: 'المؤخرة' },
  { id: 'abs', emoji: '🎯', title: 'البطن' },
]

// Injuries
const injuryOptions = [
  { id: 'knee', emoji: '🦵', title: 'الركبة' },
  { id: 'shoulder', emoji: '🤷', title: 'الكتف' },
  { id: 'lower_back', emoji: '🔙', title: 'أسفل الظهر' },
  { id: 'wrist', emoji: '✋', title: 'المعصم' },
  { id: 'hip', emoji: '🦴', title: 'الورك' },
]

// Cardio preference
const cardioPreferenceOptions = [
  { id: 'every_session', emoji: '🏃', title: 'في كل جلسة تمرين', subtitle: '١٠-١٥ دقيقة كارديو بعد كل تمرين' },
  { id: '2_3_times', emoji: '📅', title: '٢-٣ مرات في الأسبوع', subtitle: 'كارديو مضاف لبعض أيام التمرين' },
  { id: 'separate_days', emoji: '🗓️', title: 'أيام كارديو منفصلة', subtitle: 'أيام مخصصة للكارديو فقط في الخطة' },
  { id: 'no_cardio', emoji: '🚫', title: 'بدون كارديو', subtitle: 'التركيز على الأوزان فقط' },
]

export default function AppOnboarding() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [step, setStep] = useState<Step>(0)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [completedChecks, setCompletedChecks] = useState<number[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; label: string } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [discountValidating, setDiscountValidating] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentRecoveryStatus, setPaymentRecoveryStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'apple' | ''>('')
  const [appleFirebaseUid, setAppleFirebaseUid] = useState('')
  const [appleSignInLoading, setAppleSignInLoading] = useState(false)
  const [appleSignInError, setAppleSignInError] = useState('')
  const [graphAnimated, setGraphAnimated] = useState(false)

  // Handle StreamPay false-negative: payment succeeded but redirected to failure URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const paymentId = searchParams.get('id')
    const paymentLinkId = searchParams.get('payment_link_id')
    
    // If we got redirected with payment=failed but have a payment ID, verify actual status
    if (paymentStatus === 'failed' && (paymentId || paymentLinkId)) {
      console.log('StreamPay reported failure, checking actual payment status...', { paymentId, paymentLinkId })
      setPaymentRecoveryStatus('checking')
      
      // Check with our backend if this payment actually succeeded
      fetch('/api/streampay/check-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, paymentLinkId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.paymentSucceeded) {
            console.log('Payment actually succeeded! Redirecting to success page...')
            setPaymentRecoveryStatus('success')
            setRecoveryEmail(data.email || '')
            
            // Build success URL and redirect
            const successUrl = new URL('/app/success', window.location.origin)
            successUrl.searchParams.set('source', 'streampay')
            successUrl.searchParams.set('email', data.email || '')
            successUrl.searchParams.set('plan', data.plan || 'yearly')
            successUrl.searchParams.set('amount', data.amount || '155')
            if (data.sessionId) successUrl.searchParams.set('session', data.sessionId)
            
            // Redirect to success page after a short delay
            setTimeout(() => {
              router.push(successUrl.toString())
            }, 2000)
          } else {
            // Payment actually failed
            setPaymentRecoveryStatus('failed')
            setPaymentError('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.')
          }
        })
        .catch(err => {
          console.error('Error checking payment status:', err)
          setPaymentRecoveryStatus('failed')
          setPaymentError('حدث خطأ في التحقق من حالة الدفع. إذا تم خصم المبلغ، يرجى التواصل مع الدعم.')
        })
    }
  }, [searchParams, router])

  // Check for Apple Sign-In redirect result (when returning from Apple's auth page)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await checkAppleSignInRedirect()
        if (result && result.email) {
          setUserData(prev => ({ ...prev, email: result.email! }))
          setAuthMethod('apple')
          setAppleFirebaseUid(result.uid)
          // Go to payment page
          setStep(21 as Step)
        }
      } catch (error) {
        console.error('Apple redirect check error:', error)
      }
    }
    checkRedirect()
  }, [])

  const [userData, setUserData] = useState<UserData>({
    gender: '',
    activityLevel: '',
    fitnessLevel: '',
    workoutLocation: '',
    height: 170,
    weight: 70,
    birthYear: 2000,
    age: new Date().getFullYear() - 2000,
    fitnessGoal: '',
    targetWeight: 65,
    daysPerWeek: '',
    splitPreference: '',
    trainingStyle: '',
    priorityMuscles: [],
    injuries: [],
    cardioPreference: '',
    targetSpeed: 0.5,
    challenges: [],
    accomplishments: [],
    email: '',
    calculatedCalories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    proteinPercentage: 0,
    carbsPercentage: 0,
    fatPercentage: 0,
    programName: '',
  })

  const totalSteps = 22
  const progress = (step / (totalSteps - 1)) * 100

  const nextStep = () => {
    if (step < 21) setStep((step + 1) as Step)
  }

  // Select and advance immediately
  const selectAndAdvance = (updateFn: () => void) => {
    updateFn()
    nextStep()
  }

  const prevStep = () => {
    if (step === 21) {
      // Skip processing step (20), go back to graph (19)
      setStep(19 as Step)
    } else if (step > 0) {
      setStep((step - 1) as Step)
    }
  }

  // Calculate calories using Mifflin-St Jeor
  const calculateCalories = () => {
    const { gender, weight, height, age, activityLevel, fitnessGoal, targetSpeed } = userData

    // BMR using Mifflin-St Jeor
    const s = gender === 'male' ? 5 : -161
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + s

    // Get activity multiplier
    const activityData = activityLevels.find(a => a.value === activityLevel)
    const multiplier = activityData?.multiplier || 1.55

    let tdee = bmr * multiplier

    const goalData = fitnessGoals.find(g => g.value === fitnessGoal)
    
    if (goalData?.id === 'loseWeight') {
      // For cutting: 1 kg/week ≈ 1100 kcal/day deficit (more aggressive is OK)
      const cuttingAdjustment = targetSpeed * 1100
      tdee -= cuttingAdjustment
    } else if (goalData?.id === 'gainMuscle') {
      // For bulking: Use moderate surplus (300-500 kcal) to minimize fat gain
      // Realistic muscle gain is 0.25-0.5 kg/week, so we use smaller multiplier
      // targetSpeed 0.5 = ~250 kcal surplus, targetSpeed 1.0 = ~500 kcal surplus
      const bulkingAdjustment = targetSpeed * 500
      tdee += bulkingAdjustment
    }
    // Maintain weight: no adjustment (tdee stays as is)

    // Safety minimum: never below 1200
    return Math.max(Math.round(tdee), 1200)
  }

  // Get macro percentages by goal
  const getMacroPercentages = () => {
    const goalData = fitnessGoals.find(g => g.value === userData.fitnessGoal)
    switch (goalData?.id) {
      case 'loseWeight':
        return { protein: 40, carbs: 35, fat: 25 }
      case 'gainMuscle':
        return { protein: 30, carbs: 50, fat: 20 }
      default: // maintainWeight
        return { protein: 30, carbs: 40, fat: 30 }
    }
  }

  // Get program name
  const getProgramName = () => {
    const goalData = fitnessGoals.find(g => g.value === userData.fitnessGoal)
    switch (goalData?.id) {
      case 'loseWeight': return 'Vega Shred 🔥'
      case 'gainMuscle': return 'Vega Gainz 💪'
      default: return 'Vega Balance ⚖️'
    }
  }

  // Calculate all values when reaching step 20 (Processing)
  useEffect(() => {
    if (step === 20) {
      const calories = calculateCalories()
      const macros = getMacroPercentages()
      const programName = getProgramName()

      const proteinGrams = Math.round((calories * macros.protein / 100) / 4)
      const carbsGrams = Math.round((calories * macros.carbs / 100) / 4)
      const fatGrams = Math.round((calories * macros.fat / 100) / 9)

      setUserData(prev => ({
        ...prev,
        calculatedCalories: calories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        proteinPercentage: macros.protein,
        carbsPercentage: macros.carbs,
        fatPercentage: macros.fat,
        programName,
      }))

      // Animate progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 2
        setProcessingProgress(progress)

        if (progress >= 20 && !completedChecks.includes(0)) {
          setCompletedChecks(prev => [...prev, 0])
        }
        if (progress >= 50 && !completedChecks.includes(1)) {
          setCompletedChecks(prev => [...prev, 1])
        }
        if (progress >= 75 && !completedChecks.includes(2)) {
          setCompletedChecks(prev => [...prev, 2])
        }
        if (progress >= 90 && !completedChecks.includes(3)) {
          setCompletedChecks(prev => [...prev, 3])
        }

        if (progress >= 100) {
          clearInterval(interval)
          setTimeout(() => nextStep(), 500)
        }
      }, 40)

      return () => clearInterval(interval)
    }
  }, [step])

  // Trigger graph animation when reaching step 19
  useEffect(() => {
    if (step === 19) {
      setGraphAnimated(false)
      const timer = setTimeout(() => setGraphAnimated(true), 300)
      return () => clearTimeout(timer)
    }
  }, [step])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Handle Apple Sign-In
  const handleAppleSignIn = async () => {
    setAppleSignInLoading(true)
    setAppleSignInError('')

    try {
      const result = await signInWithApple()
      
      if (result.email) {
        setUserData(prev => ({ ...prev, email: result.email! }))
        setAuthMethod('apple')
        setAppleFirebaseUid(result.uid)
        // Auto-advance to payment page after short delay
        setTimeout(() => {
          setStep(21 as Step)
        }, 800)
      } else {
        // Apple might hide the email (private relay)
        setAppleSignInError('لم نتمكن من الحصول على بريدك الإلكتروني من Apple. يرجى المحاولة مرة أخرى أو استخدم البريد الإلكتروني.')
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string }
      console.error('Apple Sign-In error:', firebaseError)
      
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        // User cancelled - no error needed
        setAppleSignInError('')
      } else if (firebaseError.code === 'auth/popup-blocked') {
        // Redirect fallback is happening automatically, show loading message
        setAppleSignInError('')
        setAppleSignInLoading(true) // Keep loading state while redirecting
        return // Don't set loading to false
      } else {
        setAppleSignInError('حدث خطأ أثناء تسجيل الدخول مع Apple. يرجى المحاولة مرة أخرى.')
      }
    } finally {
      setAppleSignInLoading(false)
    }
  }

  // Handle StreamPay payment
  const handlePayment = async () => {
    if (!validateEmail(userData.email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }

    setIsProcessingPayment(true)
    setPaymentError('')

    const finalPrice = getFinalPrice(plans[selectedPlan].price)

    // Track InitiateCheckout event for Meta Pixel
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
          email: userData.email,
          authMethod: authMethod,
          appleFirebaseUid: authMethod === 'apple' ? appleFirebaseUid : undefined,
          discountCode: appliedDiscount ? discountCode : null,
          discountPercent: appliedDiscount?.percent || 0,
          finalPrice,
          userData: {
            gender: userData.gender,
            activityLevel: userData.activityLevel,
            fitnessLevel: userData.fitnessLevel,
            workoutLocation: userData.workoutLocation,
            height: userData.height,
            weight: userData.weight,
            birthYear: userData.birthYear,
            age: userData.age,
            fitnessGoal: userData.fitnessGoal,
            targetWeight: userData.targetWeight,
            daysPerWeek: userData.daysPerWeek,
            splitPreference: userData.splitPreference,
            trainingStyle: userData.trainingStyle,
            priorityMuscles: userData.priorityMuscles,
            injuries: userData.injuries,
            cardioPreference: userData.cardioPreference,
            targetSpeed: userData.targetSpeed,
            challenges: userData.challenges,
            accomplishments: userData.accomplishments,
            calculatedCalories: userData.calculatedCalories,
            proteinGrams: userData.proteinGrams,
            carbsGrams: userData.carbsGrams,
            fatGrams: userData.fatGrams,
            proteinPercentage: userData.proteinPercentage,
            carbsPercentage: userData.carbsPercentage,
            fatPercentage: userData.fatPercentage,
            programName: userData.programName,
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.paymentUrl) {
        // Redirect to StreamPay checkout
        window.location.href = data.paymentUrl
      } else {
        setPaymentError(data.error || 'حدث خطأ في إنشاء رابط الدفع')
        setIsProcessingPayment(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
      setIsProcessingPayment(false)
    }
  }

  // Apply discount code
  const applyDiscountCode = async () => {
    const code = discountCode.toUpperCase().trim()
    if (discountCodes[code]) {
      setAppliedDiscount(discountCodes[code])
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
        setDiscountError('')
        return
      }
    } catch {
      // fall through to error
    } finally {
      setDiscountValidating(false)
    }
    setAppliedDiscount(null)
    setDiscountError('كود الخصم غير صالح')
  }

  // Calculate final price with discount
  const getFinalPrice = (basePrice: number) => {
    if (appliedDiscount) {
      return Math.round(basePrice * (1 - appliedDiscount.percent / 100))
    }
    return basePrice
  }

  // Calculate daily cost
  const getDailyCost = (price: number, days: number) => {
    return (price / days).toFixed(2)
  }

  const weightDiff = Math.abs(userData.weight - userData.targetWeight)
  const isLosingWeight = userData.targetWeight < userData.weight

  // Show recovery UI when checking payment status
  if (paymentRecoveryStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-vp-navy border-t-transparent animate-spin" />
          <h2 className="text-xl font-semibold mb-2">جاري التحقق من حالة الدفع...</h2>
          <p className="text-muted-foreground">يرجى الانتظار بينما نتحقق من عملية الدفع</p>
        </div>
      </div>
    )
  }

  if (paymentRecoveryStatus === 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-navy flex items-center justify-center text-white">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">تم الدفع بنجاح!</h2>
          <p className="text-muted-foreground mb-4">جاري تحويلك لصفحة النجاح...</p>
          {recoveryEmail && (
            <p className="text-sm text-vp-navy">سيتم إرسال بيانات الدخول إلى: {recoveryEmail}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Payment Error Banner - shows when StreamPay incorrectly reported failure */}
      {paymentRecoveryStatus === 'failed' && paymentError && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-red-500/90 text-white text-center">
          <p className="text-sm">{paymentError}</p>
          <p className="text-xs mt-1 opacity-80">إذا تم خصم المبلغ، يرجى التواصل معنا على support@vegapowerstore.com</p>
        </div>
      )}
      
      {/* Progress Bar */}
      {step > 0 && step < 21 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="w-[200px] h-1.5 bg-vp-beige/50 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-vp-navy transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Back Button */}
      {(step > 0 && step < 20 || step === 21) && (
        <button
          onClick={prevStep}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="max-w-md mx-auto px-6 py-16 min-h-screen flex flex-col">

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-28 h-28 mx-auto mb-8 rounded-3xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xl overflow-hidden">
              <Image
                src="/Vegapower Logo-05.jpg"
                alt="Vega Power"
                width={112}
                height={112}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold mb-4">أهلاً بك في Vega Power</h1>
            <p className="text-muted-foreground mb-12 leading-relaxed">
              دعنا نخصص لك خطة تدريبية وغذائية تناسب احتياجات جسمك 100%
            </p>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg shadow-lg">
              ابدأ الآن
            </button>
          </div>
        )}

        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو جنسك؟</h2>
              <p className="text-muted-foreground">سنستخدم هذا لضبط حساب السعرات الحرارية.</p>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {[
                { id: 'male', emoji: '👨', label: 'ذكر' },
                { id: 'female', emoji: '👩', label: 'أنثى' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, gender: g.id as 'male' | 'female' }))}
                  className={`p-6 rounded-2xl text-center transition-all duration-300 relative ${
                    userData.gender === g.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.03]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  {userData.gender === g.id && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-vp-navy flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                  <span className="text-4xl mb-2 block">{g.emoji}</span>
                  <span className="text-xl font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Activity Level */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">كم مرة تتمرن أسبوعياً؟</h2>
              <p className="text-muted-foreground">يساعدنا هذا في تحديد مستوى نشاطك الحالي.</p>
            </div>
            <div className="flex-1 space-y-3">
              {activityLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, activityLevel: level.value }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.activityLevel === level.value
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.activityLevel === level.value ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.activityLevel === level.value ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : level.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{level.title}</h3>
                    <p className="text-sm text-muted-foreground">{level.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Fitness Level */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو مستوى لياقتك الحالي؟</h2>
              <p className="text-muted-foreground">سيساعدنا هذا في تخصيص التمارين المناسبة لك.</p>
            </div>
            <div className="flex-1 space-y-3">
              {fitnessLevelOptions.map((level) => (
                <button
                  key={level.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, fitnessLevel: level.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.fitnessLevel === level.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.fitnessLevel === level.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.fitnessLevel === level.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : level.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{level.title}</h3>
                    <p className="text-sm text-muted-foreground">{level.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Workout Location */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">أين تفضل التمرين؟</h2>
              <p className="text-muted-foreground">سنخصص التمارين حسب المكان والأدوات المتاحة لديك.</p>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {workoutLocationOptions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, workoutLocation: location.id }))}
                  className={`w-full p-5 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.workoutLocation === location.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-colors duration-300 ${
                    userData.workoutLocation === location.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.workoutLocation === location.id ? (
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : location.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{location.title}</h3>
                    <p className="text-sm text-muted-foreground">{location.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Height & Weight */}
        {step === 5 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">الطول والوزن</h2>
              <p className="text-muted-foreground">بيانات أساسية لحساب مؤشر كتلة الجسم (BMI).</p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-muted-foreground mb-2">الطول (سم)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="250"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                    className="flex-1 accent-vp-navy"
                  />
                  <span className="text-2xl font-bold w-16 text-center">{userData.height}</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-muted-foreground mb-2">الوزن (كجم)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                    className="flex-1 accent-vp-navy"
                  />
                  <span className="text-2xl font-bold w-16 text-center">{userData.weight}</span>
                </div>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 6: Birth Year */}
        {step === 6 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">متى ولدت؟</h2>
              <p className="text-muted-foreground">يؤثر العمر على معدل الأيض واحتياجات الطاقة.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <span className="text-5xl font-bold block mb-4">{userData.birthYear}</span>
                <input
                  type="range"
                  min="1950"
                  max="2015"
                  value={userData.birthYear}
                  onChange={(e) => {
                    const year = Number(e.target.value)
                    setUserData({ ...userData, birthYear: year, age: new Date().getFullYear() - year })
                  }}
                  className="w-full accent-vp-navy"
                />
                <p className="text-muted-foreground mt-4">العمر: {userData.age} سنة</p>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 7: Fitness Goal */}
        {step === 7 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو هدفك؟</h2>
              <p className="text-muted-foreground">اختر الهدف الرئيسي لنبني الخطة عليه.</p>
            </div>
            <div className="flex-1 space-y-3">
              {fitnessGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, fitnessGoal: goal.value, targetWeight: userData.weight }))}
                  className={`w-full p-5 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.fitnessGoal === goal.value
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.fitnessGoal === goal.value ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.fitnessGoal === goal.value ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : goal.emoji}
                  </div>
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Target Weight */}
        {step === 8 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو وزنك المثالي؟</h2>
              <p className="text-muted-foreground">الهدف الذي تسعى للوصول إليه.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-8 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <span className="text-6xl font-bold block mb-2">{userData.targetWeight}</span>
                <span className="text-muted-foreground">كجم</span>
                <input
                  type="range"
                  min="30"
                  max="200"
                  value={userData.targetWeight}
                  onChange={(e) => setUserData({ ...userData, targetWeight: Number(e.target.value) })}
                  className="w-full accent-vp-navy mt-6"
                />
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 9: Days Per Week */}
        {step === 9 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">كم يوم تتمرن في الأسبوع؟</h2>
              <p className="text-muted-foreground">سنبني خطتك التدريبية بناءً على جدولك.</p>
            </div>
            <div className="flex-1 space-y-3">
              {daysPerWeekOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, daysPerWeek: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.daysPerWeek === option.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.daysPerWeek === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.daysPerWeek === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : option.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 10: Split Preference */}
        {step === 10 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">كيف تفضل تقسيم تمارينك؟</h2>
              <p className="text-muted-foreground">نظام التقسيم يحدد توزيع العضلات على الأيام.</p>
            </div>
            <div className="flex-1 space-y-3">
              {splitPreferenceOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, splitPreference: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.splitPreference === option.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.splitPreference === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.splitPreference === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : option.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 11: Training Style */}
        {step === 11 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما أسلوب التمرين المفضل؟</h2>
              <p className="text-muted-foreground">سنخصص نوع التمارين حسب أسلوبك.</p>
            </div>
            <div className="flex-1 space-y-3">
              {trainingStyleOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, trainingStyle: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.trainingStyle === option.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.trainingStyle === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.trainingStyle === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : option.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 12: Priority Muscles (multi-select, max 2) */}
        {step === 12 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">هل تريد التركيز على عضلات معينة؟</h2>
              <p className="text-muted-foreground">اختر حتى عضلتين لإعطائهما أولوية (اختياري).</p>
            </div>
            <div className="flex-1 space-y-3">
              {priorityMuscleOptions.map((muscle) => (
                <button
                  key={muscle.id}
                  onClick={() => {
                    const isSelected = userData.priorityMuscles.includes(muscle.id)
                    if (isSelected) {
                      setUserData({ ...userData, priorityMuscles: userData.priorityMuscles.filter(m => m !== muscle.id) })
                    } else if (userData.priorityMuscles.length < 2) {
                      setUserData({ ...userData, priorityMuscles: [...userData.priorityMuscles, muscle.id] })
                    }
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.priorityMuscles.includes(muscle.id)
                      ? 'bg-vp-navy/10 border-2 border-vp-navy'
                      : userData.priorityMuscles.length >= 2
                        ? 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent opacity-50'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {muscle.emoji}
                  </div>
                  <span className="font-medium">{muscle.title}</span>
                  {userData.priorityMuscles.includes(muscle.id) && (
                    <svg className="w-5 h-5 text-vp-navy mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {userData.priorityMuscles.length > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                تم اختيار {userData.priorityMuscles.length} من 2
              </p>
            )}
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              {userData.priorityMuscles.length === 0 ? 'تخطي' : 'التالي'}
            </button>
          </div>
        )}

        {/* Step 13: Injuries (multi-select with clear) */}
        {step === 13 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">هل لديك أي إصابات؟</h2>
              <p className="text-muted-foreground">سنتجنب التمارين التي قد تؤثر على الإصابة.</p>
            </div>
            <div className="flex-1 space-y-3">
              {injuryOptions.map((injury) => (
                <button
                  key={injury.id}
                  onClick={() => {
                    const injuries = userData.injuries.includes(injury.id)
                      ? userData.injuries.filter(i => i !== injury.id)
                      : [...userData.injuries, injury.id]
                    setUserData({ ...userData, injuries })
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.injuries.includes(injury.id)
                      ? 'bg-vp-navy/10 border-2 border-vp-navy'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {injury.emoji}
                  </div>
                  <span className="font-medium">{injury.title}</span>
                  {userData.injuries.includes(injury.id) && (
                    <svg className="w-5 h-5 text-vp-navy mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {userData.injuries.length > 0 && (
                <button
                  onClick={() => setUserData({ ...userData, injuries: [] })}
                  className="w-full py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium text-sm"
                >
                  لا إصابات (مسح الاختيار)
                </button>
              )}
              <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                {userData.injuries.length === 0 ? 'لا إصابات' : 'التالي'}
              </button>
            </div>
          </div>
        )}

        {/* Step 14: Cardio Preference */}
        {step === 14 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">هل تريد كارديو في خطتك؟</h2>
              <p className="text-muted-foreground">الكارديو يساعد في حرق الدهون وتحسين صحة القلب.</p>
            </div>
            <div className="flex-1 space-y-3">
              {cardioPreferenceOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => selectAndAdvance(() => setUserData({ ...userData, cardioPreference: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.cardioPreference === option.id
                      ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                    userData.cardioPreference === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.cardioPreference === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : option.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 15: Speed */}
        {step === 15 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما مدى سرعة تحقيق هدفك؟</h2>
              <p className="text-muted-foreground">تحكم في وتيرة خسارة أو زيادة الوزن أسبوعياً.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed < 0.5 ? 'opacity-100' : 'opacity-30'}`}>🐢</span>
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed >= 0.5 && userData.targetSpeed < 1 ? 'opacity-100' : 'opacity-30'}`}>🐰</span>
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed >= 1 ? 'opacity-100' : 'opacity-30'}`}>🔥</span>
                </div>
                <span className="text-4xl font-bold block mb-2">{userData.targetSpeed.toFixed(1)}</span>
                <span className="text-muted-foreground">كجم في الأسبوع</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={userData.targetSpeed}
                  onChange={(e) => setUserData({ ...userData, targetSpeed: Number(e.target.value) })}
                  className="w-full accent-vp-navy mt-6"
                />
                <button
                  onClick={() => setUserData({ ...userData, targetSpeed: 0.5 })}
                  className="mt-4 px-4 py-2 rounded-full bg-vp-navy/10 text-vp-navy font-medium text-sm"
                >
                  السرعة المستحسنة (0.5 كجم)
                </button>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 16: Challenges */}
        {step === 16 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي يمنعك من الوصول لهدفك؟</h2>
              <p className="text-muted-foreground">سنساعدك في التغلب على هذه التحديات.</p>
            </div>
            <div className="flex-1 space-y-3">
              {challengeOptions.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    const challenges = userData.challenges.includes(ch.id)
                      ? userData.challenges.filter(c => c !== ch.id)
                      : [...userData.challenges, ch.id]
                    setUserData({ ...userData, challenges })
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.challenges.includes(ch.id)
                      ? 'bg-vp-navy/10 border-2 border-vp-navy'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {ch.emoji}
                  </div>
                  <span className="font-medium">{ch.title}</span>
                  {userData.challenges.includes(ch.id) && (
                    <svg className="w-5 h-5 text-vp-navy mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 17: Accomplishments */}
        {step === 17 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي تود تحقيقه؟</h2>
              <p className="text-muted-foreground">سنخصص الخطة لتشمل هذه الجوانب أيضاً.</p>
            </div>
            <div className="flex-1 space-y-3">
              {accomplishmentOptions.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    const accomplishments = userData.accomplishments.includes(acc.id)
                      ? userData.accomplishments.filter(a => a !== acc.id)
                      : [...userData.accomplishments, acc.id]
                    setUserData({ ...userData, accomplishments })
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.accomplishments.includes(acc.id)
                      ? 'bg-vp-navy/10 border-2 border-vp-navy'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {acc.emoji}
                  </div>
                  <span className="font-medium">{acc.title}</span>
                  {userData.accomplishments.includes(acc.id) && (
                    <svg className="w-5 h-5 text-vp-navy mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 18: Motivation */}
        {step === 18 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-navy/10 flex items-center justify-center">
              <span className="text-4xl">💪</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isLosingWeight ? 'خسارة' : 'اكتساب'} {weightDiff} كجم هو هدف واقعي جداً!
            </h2>
            <p className="text-muted-foreground mb-8">ليس صعباً على الإطلاق!</p>
            <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
              90% من المستخدمين يقولون أن التغيير واضح جداً بعد استخدام Vega Power...
            </p>
            <div className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15">
              <p className="text-sm">📈 يعزز الثقة: أنا أستطيع فعلها</p>
              <p className="text-xs text-muted-foreground mt-1">يقلل من خطر الاستسلام</p>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-auto">
              التالي
            </button>
          </div>
        )}

        {/* Step 19: Progress Graph */}
        {step === 19 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">رحلتك مع Vega Power</h2>
              <p className="text-muted-foreground">شوف الفرق بين الاستمرار بدون خطة وبين استخدام التطبيق</p>
            </div>

            {/* Animated Graph */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-5 relative overflow-hidden">
                {/* Graph Legend */}
                <div className="flex justify-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-vp-navy" />
                    <span className="text-xs font-medium">مع Vega Power 🚀</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neutral-400" />
                    <span className="text-xs font-medium text-muted-foreground">بدون خطة</span>
                  </div>
                </div>

                {/* SVG Chart */}
                <div className="relative" style={{ height: 220 }}>
                  <svg viewBox="0 0 320 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      {/* Gradient for the success line area fill */}
                      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.02" />
                      </linearGradient>
                      {/* Glow filter for the success line */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line key={`grid-${i}`} x1="40" y1={20 + i * 40} x2="310" y2={20 + i * 40} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                    ))}

                    {/* Y-axis labels */}
                    <text x="32" y="24" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">هدفك</text>
                    <text x="32" y="104" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">الآن</text>
                    <text x="32" y="184" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">بداية</text>

                    {/* X-axis month labels */}
                    {['اليوم', 'شهر ١', 'شهر ٢', 'شهر ٣', 'شهر ٤', 'شهر ٦'].map((label, i) => (
                      <text key={`x-${i}`} x={40 + i * 54} y="198" textAnchor="middle" className="fill-current text-muted-foreground" fontSize="7" opacity="0.5">{label}</text>
                    ))}

                    {/* Area fill under success line */}
                    <path
                      d="M40,140 C94,135 148,110 202,70 S280,25 310,20 L310,180 L40,180 Z"
                      fill="url(#successGradient)"
                      opacity={graphAnimated ? 1 : 0}
                      style={{ transition: 'opacity 1s ease-out 0.5s' }}
                    />

                    {/* Flat "without" line — stays stagnant with slight wobble */}
                    <path
                      d="M40,140 C94,142 148,145 202,143 S280,146 310,144"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="400"
                      strokeDashoffset={graphAnimated ? 0 : 400}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out 0.3s' }}
                    />

                    {/* Success "with Vega Power" line — curves up to goal */}
                    <path
                      d="M40,140 C94,135 148,110 202,70 S280,25 310,20"
                      fill="none"
                      stroke="#1e3a5f"
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#glow)"
                      strokeDasharray="400"
                      strokeDashoffset={graphAnimated ? 0 : 400}
                      style={{ transition: 'stroke-dashoffset 2s ease-out 0.6s' }}
                    />

                    {/* Animated dot at end of success line */}
                    <circle
                      cx="310" cy="20" r="5"
                      fill="#1e3a5f"
                      opacity={graphAnimated ? 1 : 0}
                      style={{ transition: 'opacity 0.3s ease-out 2.4s' }}
                    />
                    <circle
                      cx="310" cy="20" r="8"
                      fill="#1e3a5f"
                      opacity={graphAnimated ? 0.2 : 0}
                      style={{ transition: 'opacity 0.3s ease-out 2.4s' }}
                    >
                      {graphAnimated && (
                        <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                      )}
                    </circle>

                    {/* Goal star at the top */}
                    <text
                      x="310" y="12"
                      textAnchor="middle"
                      fontSize="12"
                      opacity={graphAnimated ? 1 : 0}
                      style={{ transition: 'opacity 0.5s ease-out 2.6s' }}
                    >🎯</text>

                    {/* Stagnant dot at end of flat line */}
                    <circle
                      cx="310" cy="144" r="4"
                      fill="#9ca3af"
                      opacity={graphAnimated ? 1 : 0}
                      style={{ transition: 'opacity 0.3s ease-out 1.6s' }}
                    />
                  </svg>
                </div>
              </div>

              {/* Stats cards below graph */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div
                  className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center"
                  style={{
                    opacity: graphAnimated ? 1 : 0,
                    transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'all 0.5s ease-out 2s',
                  }}
                >
                  <p className="text-2xl font-bold text-vp-navy mb-1">3x</p>
                  <p className="text-xs text-muted-foreground">نتائج أسرع مع خطة مخصصة</p>
                </div>
                <div
                  className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center"
                  style={{
                    opacity: graphAnimated ? 1 : 0,
                    transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'all 0.5s ease-out 2.3s',
                  }}
                >
                  <p className="text-2xl font-bold text-vp-navy mb-1">91%</p>
                  <p className="text-xs text-muted-foreground">من المستخدمين حققوا أهدافهم</p>
                </div>
              </div>

              {/* Motivational text */}
              <div
                className="mt-4 p-3 rounded-xl bg-vp-navy text-white text-center"
                style={{
                  opacity: graphAnimated ? 1 : 0,
                  transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'all 0.5s ease-out 2.6s',
                }}
              >
                <p className="text-sm font-semibold">لا تضيع وقتك بدون خطة واضحة</p>
                <p className="text-xs opacity-80 mt-1">خلّ الذكاء الاصطناعي يبني لك الطريق 🚀</p>
              </div>
            </div>

            <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg mt-6">
              التالي
            </button>
          </div>
        )}

        {/* Step 20: Processing */}
        {step === 20 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="text-6xl font-bold mb-4 text-vp-navy">
              {processingProgress}%
            </div>
            <h2 className="text-xl font-semibold mb-8">نقوم بتجهيز كل شيء لك</h2>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-vp-beige/50 dark:bg-neutral-700 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-vp-navy transition-all duration-300 rounded-full"
                style={{ width: `${processingProgress}%` }}
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3 text-right">
              {[
                'حساب السعرات الحرارية',
                'توزيع الماكروز (بروتين، كارب، دهون)',
                'تقدير العمر الأيضي',
                'تحليل درجة الصحة',
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-3 transition-opacity ${completedChecks.includes(i) ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedChecks.includes(i) ? 'bg-vp-navy' : 'bg-vp-beige dark:bg-neutral-600'}`}>
                    {completedChecks.includes(i) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 21: Payment - Full Featured */}
        {step === 21 && (
          <div className="flex-1 flex flex-col animate-fade-in overflow-auto -my-8 py-8">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden">
                <Image
                  src="/Vegapower Logo-05.jpg"
                  alt="Vega Power"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold mb-1">اشترك في VegaPower</h2>
              <p className="text-muted-foreground text-sm">التطبيق الوحيد اللي تحتاجه لتحقيق أهدافك 💪</p>
            </div>

            {/* Encouraging Message */}
            <div className="p-3 rounded-xl bg-vp-navy/5 border border-vp-navy/15 mb-4 text-center">
              <p className="text-sm font-medium text-vp-navy dark:text-vp-beige">
                🏆 انضم لآلاف المستخدمين اللي شافوا نتائج حقيقية
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { emoji: '🏋️', text: 'برامج تدريب متكاملة', color: 'from-blue-500/20 to-blue-600/20' },
                { emoji: '📸', text: 'صوّر أكلك واعرف السعرات بالذكاء الاصطناعي', color: 'from-green-500/20 to-green-600/20' },
                { emoji: '📊', text: 'تتبع تقدمك يومياً', color: 'from-purple-500/20 to-purple-600/20' },
                { emoji: '🎯', text: 'أهداف واقعية ومحفزة', color: 'from-orange-500/20 to-orange-600/20' },
              ].map((feature, i) => (
                <div key={i} className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} flex items-center gap-2`}>
                  <span className="text-xl">{feature.emoji}</span>
                  <span className="text-xs font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Reviews */}
            <div className="mb-4 -mx-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 px-2" style={{ width: 'max-content' }}>
                {[
                  { name: 'سارة', text: 'خسرت 8 كيلو في شهرين! 🔥', rating: 5 },
                  { name: 'محمد', text: 'أفضل استثمار في صحتي 💪', rating: 5 },
                  { name: 'نورة', text: 'التطبيق غير حياتي! ⭐', rating: 5 },
                ].map((review, i) => (
                  <div key={i} className="w-[160px] p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(review.rating)].map((_, s) => (
                        <span key={s} className="text-[10px] text-amber-500">⭐</span>
                      ))}
                    </div>
                    <p className="text-xs mb-1">"{review.text}"</p>
                    <p className="text-[10px] text-muted-foreground">- {review.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Program Summary */}
            <div className="rounded-2xl bg-vp-navy text-white mb-4 overflow-hidden">
              {/* Header with program name and stats */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70">برنامجك جاهز! ✨</p>
                    <p className="font-bold text-lg">{userData.programName}</p>
                  </div>
                </div>
                <div className="flex justify-around text-center bg-white/5 rounded-xl p-3">
                  <div>
                    <p className="text-xl font-bold text-green-400">{userData.calculatedCalories}</p>
                    <p className="text-[10px] opacity-70">سعرة/يوم</p>
                  </div>
                  <div className="border-r border-white/10"></div>
                  <div>
                    <p className="text-xl font-bold text-blue-400">{userData.proteinGrams}g</p>
                    <p className="text-[10px] opacity-70">بروتين</p>
                  </div>
                  <div className="border-r border-white/10"></div>
                  <div>
                    <p className="text-xl font-bold text-purple-400">{userData.carbsGrams}g</p>
                    <p className="text-[10px] opacity-70">كارب</p>
                  </div>
                </div>
              </div>

              {/* Personalized message based on their goal */}
              <div className="p-4 border-b border-white/10">
                <p className="text-sm leading-relaxed">
                  {userData.fitnessGoal === 'Lose Fat (Cut)' && (
                    <>بناءً على بياناتك، صممنا لك خطة لـ<span className="text-green-400 font-semibold"> خسارة {Math.abs(userData.weight - userData.targetWeight)} كجم </span>بطريقة صحية ومستدامة.</>
                  )}
                  {userData.fitnessGoal === 'Build Muscle (Bulk)' && (
                    <>بناءً على بياناتك، صممنا لك خطة لـ<span className="text-blue-400 font-semibold"> بناء العضلات وزيادة {Math.abs(userData.weight - userData.targetWeight)} كجم </span>من الكتلة العضلية.</>
                  )}
                  {userData.fitnessGoal === 'Body Recomposition' && (
                    <>بناءً على بياناتك، صممنا لك خطة لـ<span className="text-purple-400 font-semibold"> تحسين تكوين جسمك </span>وزيادة العضلات مع حرق الدهون.</>
                  )}
                </p>
              </div>

              {/* How we'll help with their challenges */}
              {userData.challenges.length > 0 && (
                <div className="p-4 border-b border-white/10">
                  <p className="text-[10px] opacity-70 mb-2">سنساعدك في التغلب على:</p>
                  <div className="flex flex-wrap gap-2">
                    {userData.challenges.includes('lack_consistency') && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-[10px]">
                        <span>📊</span> تذكيرات يومية للاستمرار
                      </div>
                    )}
                    {userData.challenges.includes('unhealthy_habits') && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-[10px]">
                        <span>🍴</span> وجبات صحية بديلة
                      </div>
                    )}
                    {userData.challenges.includes('lack_support') && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                        <span>👥</span> مجتمع داعم ومحفز
                      </div>
                    )}
                    {userData.challenges.includes('busy_schedule') && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                        <span>📅</span> تمارين سريعة (15-30 دقيقة)
                      </div>
                    )}
                    {userData.challenges.includes('meal_inspiration') && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-[10px]">
                        <span>💡</span> +500 وصفة صحية
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* What they'll achieve */}
              {userData.accomplishments.length > 0 && (
                <div className="p-4 border-b border-white/10">
                  <p className="text-[10px] opacity-70 mb-2">ستحقق معنا:</p>
                  <div className="space-y-2">
                    {userData.accomplishments.includes('healthier_lifestyle') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400">✓</span> أكل وحياة صحية أكثر
                      </div>
                    )}
                    {userData.accomplishments.includes('boost_energy') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-400">✓</span> زيادة طاقتك ومزاجك
                      </div>
                    )}
                    {userData.accomplishments.includes('stay_motivated') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-400">✓</span> البقاء متحفزاً ومستمراً
                      </div>
                    )}
                    {userData.accomplishments.includes('body_confidence') && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-pink-400">✓</span> الشعور بالرضا عن جسمك
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Call to action */}
              <div className="p-4 bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">برنامجك جاهز وينتظرك!</p>
                    <p className="text-[10px] opacity-70">فقط فعّل اشتراكك وسجل دخولك للتطبيق</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1.5 text-center">البريد الإلكتروني — سنرسل لك بيانات الدخول</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="أدخل بريدك الإلكتروني"
                dir="ltr"
                className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-vp-navy/40 outline-none text-sm text-center"
              />
              {userData.email.trim() && !validateEmail(userData.email) && (
                <p className="text-xs text-red-500 text-center mt-1">أدخل بريداً إلكترونياً صحيحاً</p>
              )}
            </div>

            {/* New Year Special Offer Banner */}
            <div className="p-3 rounded-xl bg-vp-navy text-white mb-3 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50"></div>
              <div className="relative">
                <p className="text-xs font-bold mb-1">🎊 عرض السنة الجديدة 2026 🎊</p>
                <p className="text-lg font-black">سنة كاملة بـ <span className="line-through opacity-60">448</span> 155 ريال فقط!</p>
                <p className="text-[10px] opacity-80 mt-1">⏰ عرض محدود - لأول 100 مشترك فقط</p>
              </div>
            </div>

            {/* Plan Selection - Colorful Cards with Daily Cost */}
            <div className="flex gap-2 mb-3">
              {[
                { key: 'monthly' as PlanType, label: 'شهر', price: plans.monthly.price, days: plans.monthly.days, savings: null },
                { key: 'yearly' as PlanType, label: 'سنة', price: plans.yearly.price, days: plans.yearly.days, savings: plans.yearly.savings },
              ].map((plan) => {
                const finalPrice = getFinalPrice(plan.price)
                const dailyCost = getDailyCost(finalPrice, plan.days)
                return (
                  <button
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`flex-1 p-3 rounded-xl text-center transition-all relative overflow-hidden ${
                      selectedPlan === plan.key
                        ? 'bg-vp-navy text-white scale-[1.02] shadow-lg'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                    }`}
                  >
                    {plan.savings && (
                      <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                        selectedPlan === plan.key ? 'bg-white/30 text-white' : 'bg-vp-navy text-white'
                      }`}>
                        {plan.savings}
                      </div>
                    )}
                    <div className={`text-[10px] mb-0.5 mt-2 ${selectedPlan === plan.key ? 'opacity-80' : 'text-muted-foreground'}`}>{plan.label}</div>
                    {appliedDiscount && finalPrice !== plan.price ? (
                      <>
                        <div className="text-sm line-through opacity-50">{plan.price}</div>
                        <div className="text-xl font-bold">{finalPrice}</div>
                      </>
                    ) : (
                      <div className="text-xl font-bold">{plan.price}</div>
                    )}
                    <div className={`text-[10px] ${selectedPlan === plan.key ? 'opacity-80' : 'text-muted-foreground'}`}>ريال</div>
                    <div className={`text-[9px] mt-1 px-2 py-0.5 rounded-full ${
                      selectedPlan === plan.key ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}>
                      {dailyCost} ر.س/يوم
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Discount Code Input */}
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => {
                    setDiscountCode(e.target.value.toUpperCase())
                    setDiscountError('')
                  }}
                  placeholder="كود الخصم (اختياري)"
                  className="flex-1 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-vp-navy/40 outline-none text-sm text-center"
                  dir="ltr"
                />
                <button
                  onClick={applyDiscountCode}
                  disabled={!discountCode.trim() || discountValidating}
                  className="px-4 py-2.5 rounded-xl bg-vp-navy/10 text-vp-navy hover:bg-vp-navy/20 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {discountValidating ? '...' : 'تطبيق'}
                </button>
              </div>
              {discountError && (
                <p className="text-red-500 text-xs mt-1 text-center">{discountError}</p>
              )}
              {appliedDiscount && (
                <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-500/10 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-xs text-green-700 dark:text-green-400">
                    تم تطبيق خصم {appliedDiscount.label}! 🎉
                  </span>
                  <button
                    onClick={() => {
                      setAppliedDiscount(null)
                      setDiscountCode('')
                    }}
                    className="text-muted-foreground hover:text-red-500 mr-auto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* No Auto-Renewal */}
            <div className="flex items-center justify-center gap-2 p-2 bg-green-500/10 rounded-lg mb-3">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs text-green-700 dark:text-green-400">يمكنك إيقاف وإالغاء الإشتراك متى ما تشاء  بسهولة</span>
            </div>

            {/* Payment Error Message */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{paymentError}</p>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!validateEmail(userData.email) || isProcessingPayment}
              className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري التحويل للدفع...</span>
                </>
              ) : appliedDiscount ? (
                <>🚀 ابدأ الآن - <span className="line-through opacity-60 mx-1">{plans[selectedPlan].price}</span> {getFinalPrice(plans[selectedPlan].price)} ريال</>
              ) : (
                <>🚀 ابدأ الآن - {plans[selectedPlan].price} ريال</>
              )}
            </button>

            {/* Payment Methods */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>💳</span> Visa
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>💳</span> Mastercard
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>💳</span> مدى
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>🏦</span> تحويل بنكي
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 text-center">
              <p className="text-[10px] text-muted-foreground">🔒 دفع آمن ومشفر عبر StreamPay</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
