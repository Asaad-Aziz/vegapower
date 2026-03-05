'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import {
  Dumbbell, Flame, TrendingUp, Bot, Gift, User, Home,
  Sprout, Trophy, Sparkles, Target, RefreshCw, Cpu, Zap, Shuffle,
  BarChart3, UtensilsCrossed, Users, CalendarDays, Lightbulb, Leaf,
  Sun, Award, UserRound, Bone, Hand, CircleSlash, Calendar, CalendarRange,
  ChevronDown, ChevronUp, Scale, Footprints, CreditCard, Lock, Rocket,
  ArrowLeft, Heart
} from 'lucide-react'
import { initiateCheckout } from '@/lib/meta-pixel'
import { snapStartCheckout } from '@/lib/snapchat-pixel'
import { signInWithApple, checkAppleSignInRedirect } from '@/lib/firebase-client'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

const INSIGHT_BREAK_STEPS = new Set([3, 9, 10, 15, 19])
const INPUT_STEP_COUNT = 16

const getProgressIndex = (s: number): number => {
  if (s <= 2) return s
  if (s === 3) return 2       // IB1 stays at 2
  if (s >= 4 && s <= 8) return s - 1  // 4→3, 5→4, 6→5, 7→6, 8→7
  if (s === 9) return 7       // IB2 stays at 7
  if (s === 10) return 7      // AI scan screen stays at 7
  if (s >= 11 && s <= 14) return s - 3 // 11→8, 12→9, 13→10, 14→11
  if (s === 15) return 11     // IB3 stays at 11
  if (s >= 16 && s <= 18) return s - 4 // 16→12, 17→13, 18→14
  if (s === 19) return 14     // IB4 stays at 14
  return 15
}

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
  motivation: string
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
  monthly: { price: 45, period: 'شهر', productId: 'myfatoorah_monthly', savings: null, days: 30, label: 'شهري' },
  yearly: { price: 216, period: 'سنة', productId: 'myfatoorah_yearly', savings: null, days: 365, label: 'سنوي' },
}

// Discount codes configuration
const discountCodes: Record<string, { percent: number; label: string }> = {
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
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder="أدخل بريدك الإلكتروني"
        dir="ltr"
        className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-vp-navy/40 outline-none text-sm text-center"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((domain) => (
            <button
              key={domain}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              dir="ltr"
              onClick={() => {
                onChange(`${localPart}@${domain}`)
                setShowSuggestions(false)
              }}
            >
              <span className="text-muted-foreground">{localPart}@</span>
              <span className="font-medium">{domain}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type PlanType = 'monthly' | 'yearly'

// Activity level mappings
const activityLevels = [
  { id: 'lightlyActive', icon: Sprout, title: '0-2 تمارين', subtitle: 'نشاط خفيف أو خامل', value: 'نشاط خفيف (تمرين خفيف 1-3 أيام/أسبوع)', multiplier: 1.375 },
  { id: 'moderatelyActive', icon: Footprints, title: '3-5 تمارين', subtitle: 'نشاط متوسط', value: 'نشط إلى حد ما (تمرين معتدل 3-5 أيام في الأسبوع)', multiplier: 1.55 },
  { id: 'veryActive', icon: Flame, title: '6+ تمارين', subtitle: 'نشاط عالي / رياضي', value: 'نشيط للغاية (ممارسة التمارين الرياضية الشاقة 6-7 أيام في الأسبوع)', multiplier: 1.725 },
]

// Fitness goals
const fitnessGoals = [
  { id: 'loseWeight', icon: ChevronDown, title: 'خسارة الوزن', value: 'Lose Fat (Cut)' },
  { id: 'maintainWeight', icon: Scale, title: 'الحفاظ على الوزن', value: 'Body Recomposition' },
  { id: 'gainMuscle', icon: ChevronUp, title: 'زيادة الوزن / عضلات', value: 'Build Muscle (Bulk)' },
]

// Challenges
const challengeOptions = [
  { id: 'lack_consistency', icon: BarChart3, title: 'عدم الاستمرار' },
  { id: 'unhealthy_habits', icon: UtensilsCrossed, title: 'عادات أكل غير صحية' },
  { id: 'lack_support', icon: Users, title: 'قلة الدعم والتشجيع' },
  { id: 'busy_schedule', icon: CalendarDays, title: 'جدول مزدحم' },
  { id: 'meal_inspiration', icon: Lightbulb, title: 'قلة الأفكار للوجبات' },
]

// Motivation (single-select, replaces old accomplishments multi-select)
const motivationOptions = [
  { id: 'healthier_lifestyle', icon: Leaf, title: 'أكل وحياة صحية أكثر' },
  { id: 'boost_energy', icon: Sun, title: 'زيادة طاقتي ومزاجي' },
  { id: 'stay_motivated', icon: Sparkles, title: 'البقاء متحفزاً ومستمراً' },
  { id: 'body_confidence', icon: UserRound, title: 'الشعور بالرضا عن جسمي' },
]

// Day names for weekly calendar
const dayNamesAr = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع']

const getWeekSchedule = (split: string, days: number): (string | null)[] => {
  const labels: string[] = []
  for (let i = 0; i < days; i++) {
    switch (split) {
      case 'full_body': labels.push('كامل'); break
      case 'upper_lower': labels.push(i % 2 === 0 ? 'علوي' : 'سفلي'); break
      case 'push_pull_legs': labels.push(['دفع', 'سحب', 'أرجل'][i % 3]); break
      case 'muscle_split': labels.push(['صدر', 'ظهر', 'كتف', 'ذراع', 'رجل', 'بطن', 'مؤخرة'][i % 7]); break
      default: labels.push('AI'); break
    }
  }
  const week: (string | null)[] = Array(7).fill(null)
  if (days === 3) {
    [0, 2, 4].forEach((d, i) => week[d] = labels[i])
  } else if (days === 5) {
    [0, 1, 2, 3, 4].forEach((d, i) => week[d] = labels[i])
  } else if (days === 7) {
    labels.forEach((l, i) => week[i] = l)
  }
  return week
}

// Fitness levels
const fitnessLevelOptions = [
  { id: 'Beginner', icon: Sprout, title: 'مبتدئ', subtitle: 'جديد على التمارين أو عائد بعد انقطاع طويل' },
  { id: 'Intermediate', icon: Sparkles, title: 'متوسط', subtitle: 'أتمرن بانتظام منذ فترة' },
  { id: 'Advanced', icon: Trophy, title: 'متقدم', subtitle: 'خبرة طويلة ومستوى لياقة عالي' },
]

// Workout locations
const workoutLocationOptions = [
  { id: 'Gym', icon: Dumbbell, title: 'النادي الرياضي', subtitle: 'أتمرن في الجيم مع المعدات الكاملة' },
  { id: 'Home', icon: Home, title: 'المنزل', subtitle: 'أتمرن في البيت بأدوات بسيطة أو بدون أدوات' },
]

// Days per week
const daysPerWeekOptions = [
  { id: '3', label: '3', title: '٣ أيام', subtitle: 'مثالي للمبتدئين' },
  { id: '5', label: '5', title: '٥ أيام', subtitle: 'الخيار الأكثر شيوعاً' },
  { id: '7', label: '7', title: '٧ أيام', subtitle: 'للرياضيين المتقدمين' },
]

// Split preference
const splitPreferenceOptions = [
  { id: 'full_body', icon: Dumbbell, title: 'جسم كامل', subtitle: 'تمرين جميع العضلات في كل جلسة' },
  { id: 'upper_lower', icon: RefreshCw, title: 'علوي / سفلي', subtitle: 'تبديل بين الجزء العلوي والسفلي' },
  { id: 'push_pull_legs', icon: Sparkles, title: 'دفع / سحب / أرجل', subtitle: 'فصل تمارين الدفع والسحب والأرجل' },
  { id: 'muscle_split', icon: Target, title: 'تقسيم عضلي', subtitle: 'مجموعة عضلية واحدة في اليوم' },
  { id: 'ai_decide', icon: Cpu, title: 'دع الذكاء الاصطناعي يقرر', subtitle: 'AI يختار أفضل تقسيم لك' },
]

// Training style
const trainingStyleOptions = [
  { id: 'strength', icon: Dumbbell, title: 'قوة وطاقة', subtitle: 'أوزان ثقيلة، تكرارات قليلة' },
  { id: 'hypertrophy', icon: Sparkles, title: 'بناء العضلات', subtitle: 'أوزان متوسطة، تكرارات أكثر' },
  { id: 'functional', icon: Zap, title: 'لياقة وظيفية', subtitle: 'وزن الجسم، مرونة، حركات رياضية' },
  { id: 'mixed', icon: Shuffle, title: 'مزيج من كل شيء', subtitle: 'تنوع في جميع أنماط التمرين' },
]

// Priority muscles
const priorityMuscleOptions = [
  { id: 'chest', icon: Heart, title: 'الصدر' },
  { id: 'back', icon: ArrowLeft, title: 'الظهر' },
  { id: 'shoulders', icon: Award, title: 'الأكتاف' },
  { id: 'arms', icon: Dumbbell, title: 'الذراعين' },
  { id: 'legs', icon: Footprints, title: 'الأرجل' },
  { id: 'glutes', icon: Flame, title: 'المؤخرة' },
  { id: 'abs', icon: Target, title: 'البطن' },
]

// Injuries
const injuryOptions = [
  { id: 'knee', icon: Footprints, title: 'الركبة' },
  { id: 'shoulder', icon: Award, title: 'الكتف' },
  { id: 'lower_back', icon: ArrowLeft, title: 'أسفل الظهر' },
  { id: 'wrist', icon: Hand, title: 'المعصم' },
  { id: 'hip', icon: Bone, title: 'الورك' },
]

// Cardio preference
const cardioPreferenceOptions = [
  { id: 'every_session', icon: Flame, title: 'في كل جلسة تمرين', subtitle: '١٠-١٥ دقيقة كارديو بعد كل تمرين' },
  { id: '2_3_times', icon: Calendar, title: '٢-٣ مرات في الأسبوع', subtitle: 'كارديو مضاف لبعض أيام التمرين' },
  { id: 'separate_days', icon: CalendarRange, title: 'أيام كارديو منفصلة', subtitle: 'أيام مخصصة للكارديو فقط في الخطة' },
  { id: 'no_cardio', icon: CircleSlash, title: 'بدون كارديو', subtitle: 'التركيز على الأوزان فقط' },
]

export default function AppOnboarding() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [step, setStep] = useState<Step>(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [completedChecks, setCompletedChecks] = useState<number[]>([])
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
  const [paymentRecoveryStatus, setPaymentRecoveryStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [authMethod, setAuthMethod] = useState<'email' | 'apple' | ''>('')
  const [appleFirebaseUid, setAppleFirebaseUid] = useState('')
  const [appleSignInLoading, setAppleSignInLoading] = useState(false)
  const [appleSignInError, setAppleSignInError] = useState('')
  const [graphAnimated, setGraphAnimated] = useState(false)
  const [revealReady, setRevealReady] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'plan' | 'email' | 'pay'>('plan')
  const [streamPayLoading, setStreamPayLoading] = useState(false)

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
          setStep(20 as Step)
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
    motivation: '',
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

  const progress = (getProgressIndex(step) / (INPUT_STEP_COUNT - 1)) * 100

  const nextStep = () => {
    if (step < 20) setStep((step + 1) as Step)
  }

  // Select and advance immediately
  const selectAndAdvance = (updateFn: () => void) => {
    updateFn()
    nextStep()
  }

  const prevStep = () => {
    if (step === 20) {
      if (paymentStep === 'pay') { setPaymentStep('email'); return }
      if (paymentStep === 'email') { setPaymentStep('plan'); return }
    }
    if (step > 0) {
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
      case 'loseWeight': return 'Vega Shred'
      case 'gainMuscle': return 'Vega Gainz'
      default: return 'Vega Balance'
    }
  }

  // IB4 (step 19): Calculate all values and run processing animation, then reveal
  useEffect(() => {
    if (step === 19) {
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

      // Processing animation → reveal
      setRevealReady(false)
      setGraphAnimated(false)
      setProcessingProgress(0)
      setCompletedChecks([])
      let prog = 0
      const interval = setInterval(() => {
        prog += 2
        setProcessingProgress(prog)

        if (prog >= 20) setCompletedChecks(prev => prev.includes(0) ? prev : [...prev, 0])
        if (prog >= 50) setCompletedChecks(prev => prev.includes(1) ? prev : [...prev, 1])
        if (prog >= 75) setCompletedChecks(prev => prev.includes(2) ? prev : [...prev, 2])
        if (prog >= 90) setCompletedChecks(prev => prev.includes(3) ? prev : [...prev, 3])

        if (prog >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setRevealReady(true)
            setTimeout(() => setGraphAnimated(true), 300)
          }, 500)
        }
      }, 40)

      return () => clearInterval(interval)
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
          setStep(20 as Step)
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

  // Initialize MyFatoorah embedded payment form
  const initMyFatoorahPayment = async () => {
    if (!validateEmail(userData.email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    if (mfInitialized || mfSessionLoading) return

    setMfSessionLoading(true)
    setPaymentError('')

    const finalPrice = getFinalPrice(plans[selectedPlan].price)

    initiateCheckout({
      content_ids: [plans[selectedPlan].productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })
    snapStartCheckout({
      price: finalPrice,
      currency: 'SAR',
      item_ids: [plans[selectedPlan].productId],
    })

    try {
      const response = await fetch('/api/myfatoorah/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalPrice,
          email: userData.email,
          productId: `app_${selectedPlan}`,
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
          containerId: 'mf-app-form',
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
                const verifyRes = await fetch('/api/myfatoorah/verify-app', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentData: paymentResponse.paymentData,
                    encryptionKey: data.encryptionKey,
                    email: userData.email,
                    plan: selectedPlan,
                    amount: finalPrice,
                    discountCode: appliedDiscount ? discountCode : null,
                    authMethod: authMethod || 'email',
                    appleFirebaseUid: authMethod === 'apple' ? appleFirebaseUid : undefined,
                    userData: JSON.stringify({
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
                      motivation: userData.motivation,
                      accomplishments: [userData.motivation],
                      calculatedCalories: userData.calculatedCalories,
                      proteinGrams: userData.proteinGrams,
                      carbsGrams: userData.carbsGrams,
                      fatGrams: userData.fatGrams,
                      proteinPercentage: userData.proteinPercentage,
                      carbsPercentage: userData.carbsPercentage,
                      fatPercentage: userData.fatPercentage,
                      programName: userData.programName,
                    }),
                  }),
                })
                const result = await verifyRes.json()
                if (result.success) {
                  sessionStorage.setItem('mf_payment_result', JSON.stringify({
                    success: true, email: userData.email, plan: selectedPlan, amount: finalPrice,
                  }))
                  window.location.href = `/app/success?source=streampay&email=${encodeURIComponent(userData.email)}&plan=${selectedPlan}&amount=${finalPrice}&session=mf_${Date.now()}&authMethod=${authMethod || 'email'}${discountCode && appliedDiscount ? `&discountCode=${discountCode}` : ''}`
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

  const handleTamaraCheckout = async () => {
    if (!validateEmail(userData.email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    setTamaraLoading(true)
    setPaymentError('')

    const finalPrice = getFinalPrice(plans[selectedPlan].price)

    initiateCheckout({
      content_ids: [plans[selectedPlan].productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })
    snapStartCheckout({
      price: finalPrice,
      currency: 'SAR',
      item_ids: [plans[selectedPlan].productId],
    })

    try {
      sessionStorage.setItem('tamara_userData', JSON.stringify({
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
        motivation: userData.motivation,
        accomplishments: [userData.motivation],
        calculatedCalories: userData.calculatedCalories,
        proteinGrams: userData.proteinGrams,
        carbsGrams: userData.carbsGrams,
        fatGrams: userData.fatGrams,
        proteinPercentage: userData.proteinPercentage,
        carbsPercentage: userData.carbsPercentage,
        fatPercentage: userData.fatPercentage,
        programName: userData.programName,
      }))

      const response = await fetch('/api/tamara/app-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          amount: finalPrice,
          plan: selectedPlan,
          discountCode: appliedDiscount ? discountCode : null,
          authMethod: authMethod || 'email',
          appleFirebaseUid: authMethod === 'apple' ? appleFirebaseUid : undefined,
        }),
      })

      const data = await response.json()

      if (data.success && data.checkoutUrl) {
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

  // StreamPay checkout for monthly plan
  const handleStreamPayCheckout = async () => {
    if (!validateEmail(userData.email)) {
      setPaymentError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    setStreamPayLoading(true)
    setPaymentError('')

    const finalPrice = getFinalPrice(plans.monthly.price)

    initiateCheckout({
      content_ids: [plans.monthly.productId],
      content_type: 'product',
      value: finalPrice,
      currency: 'SAR',
      num_items: 1,
    })
    snapStartCheckout({
      price: finalPrice,
      currency: 'SAR',
      item_ids: [plans.monthly.productId],
    })

    try {
      const response = await fetch('/api/streampay/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'monthly',
          email: userData.email,
          authMethod: authMethod || 'email',
          discountCode: appliedDiscount ? discountCode : null,
          discountPercent: appliedDiscount?.percent || 0,
          streampayCouponId: appliedDiscount ? streampayCouponId : null,
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
            accomplishments: [userData.motivation],
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
        window.location.href = data.paymentUrl
      } else {
        setPaymentError(data.error || 'حدث خطأ في إنشاء رابط الدفع')
        setStreamPayLoading(false)
      }
    } catch {
      setPaymentError('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
      setStreamPayLoading(false)
    }
  }

  // Apply discount code
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
        return
      }
    } catch {
      // fall through to error
    } finally {
      setDiscountValidating(false)
    }
    setAppliedDiscount(null)
    setStreampayCouponId(null)
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

  // Memoized body stats for IB2 (step 9)
  const bodyStats = useMemo(() => {
    const s = userData.gender === 'male' ? 5 : -161
    const bmr = (10 * userData.weight) + (6.25 * userData.height) - (5 * userData.age) + s
    const activityData = activityLevels.find(a => a.value === userData.activityLevel)
    const multiplier = activityData?.multiplier || 1.55
    const tdee = Math.round(bmr * multiplier)
    const bmi = (userData.weight / ((userData.height / 100) ** 2)).toFixed(1)
    const bmiNum = parseFloat(bmi)
    const bmiCategory = bmiNum < 18.5 ? 'نحيف' : bmiNum < 25 ? 'طبيعي' : bmiNum < 30 ? 'وزن زائد' : 'سمنة'
    const fitnessLabel = fitnessLevelOptions.find(f => f.id === userData.fitnessLevel)?.title || ''
    return { tdee, bmi, bmiCategory, fitnessLabel }
  }, [userData.gender, userData.weight, userData.height, userData.age, userData.activityLevel, userData.fitnessLevel])

  // Memoized week schedule for IB3 (step 14)
  const weekSchedule = useMemo(() => {
    const daysNum = Number(userData.daysPerWeek) || 3
    return { schedule: getWeekSchedule(userData.splitPreference || 'ai_decide', daysNum), daysNum }
  }, [userData.daysPerWeek, userData.splitPreference])

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
      {step > 0 && step < 20 && (
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
      {step > 0 && (
        <button
          onClick={prevStep}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="max-w-md mx-auto px-6 h-[100dvh] flex flex-col">

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pt-16 pb-4 scrollbar-hide">

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center pt-6 mb-5">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden">
                <Image src="/Vegapower Logo-05.jpg" alt="Vega Power" width={80} height={80} className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-black text-vp-navy mb-1.5">هدفك أقرب مما تتخيل</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">كل اللي تحتاجه في مكان واحد — تمارين، تغذية، ومتابعة</p>
            </div>
            <div className="space-y-2.5 mb-5">
              <p className="text-xs font-semibold text-vp-navy text-center mb-1">خلال دقيقتين بنجهز لك:</p>
              {[
                { Icon: Dumbbell, text: 'جدول تمارين مصمم لهدفك بالذكاء الاصطناعي', highlight: true },
                { Icon: Flame, text: 'حساب سعراتك وماكروز بدقة حسب جسمك', highlight: true },
                { Icon: TrendingUp, text: 'خطة واضحة توصلك لهدفك بأسرع طريقة', highlight: false },
                
              ].map((item) => (
                <div key={item.text} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${item.highlight ? 'bg-vp-navy/5 border border-vp-navy/10' : 'bg-neutral-50 dark:bg-neutral-800/50'}`}>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-vp-navy/10 flex items-center justify-center"><item.Icon className="size-5 text-vp-navy" /></div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {['س', 'م', 'ن', 'ع'].map((letter, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-vp-navy/10 border-2 border-white dark:border-neutral-900 flex items-center justify-center text-[10px] font-bold text-vp-navy">{letter}</div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mr-1"><span className="font-bold text-vp-navy">+28,900</span> شخص بدأوا رحلتهم معنا</p>
            </div>
            <div className="bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl p-3.5 mb-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Gift className="size-5 text-amber-700 dark:text-amber-300" />
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">عرض خاص ينتظرك في النهاية</p>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">أكمل الأسئلة واحصل على خصم حصري على الاشتراك السنوي</p>
            </div>
          </div>
        )}

        {/* Step 1: Fitness Goal (auto-advance) */}
        {step === 1 && (
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
                    userData.fitnessGoal === goal.value ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    userData.fitnessGoal === goal.value ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.fitnessGoal === goal.value ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : <goal.icon className="size-6" />}
                  </div>
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Days Per Week (auto-advance) */}
        {step === 2 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">كم يوم تتمرن في الأسبوع؟</h2>
              <p className="text-muted-foreground">سنبني خطتك التدريبية بناءً على جدولك.</p>
            </div>
            <div className="flex-1 space-y-3">
              {daysPerWeekOptions.map((option) => (
                <button key={option.id} onClick={() => selectAndAdvance(() => setUserData({ ...userData, daysPerWeek: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.daysPerWeek === option.id ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold transition-colors duration-300 ${
                    userData.daysPerWeek === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.daysPerWeek === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : option.label}
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

        {/* Step 3: IB1 — App Value Prop (tailored to chosen goal) */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-navy/10 flex items-center justify-center">
              <Sparkles className="size-10 text-vp-navy" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {userData.fitnessGoal === 'Lose Fat (Cut)' && 'بنساعدك تخسر الوزن بطريقة صحية'}
              {userData.fitnessGoal === 'Build Muscle (Bulk)' && 'بنساعدك تبني عضلات بشكل فعّال'}
              {userData.fitnessGoal === 'Body Recomposition' && 'بنساعدك تحسّن جسمك بالكامل'}
            </h2>
            <p className="text-muted-foreground mb-6">هذا اللي بيسويه التطبيق لك:</p>
            <div className="space-y-3 text-right">
              {userData.fitnessGoal === 'Lose Fat (Cut)' && [
                { Icon: Flame, text: 'حساب عجز السعرات المثالي لحرق الدهون بدون خسارة عضلات' },
                { Icon: Dumbbell, text: 'جدول تمارين مصمم بالذكاء الاصطناعي يحافظ على كتلتك العضلية' },
                { Icon: TrendingUp, text: 'متابعة أسبوعية — التطبيق يعدّل خطتك تلقائياً حسب تقدمك' },
                
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-vp-navy/5 border border-vp-navy/10">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-vp-navy/10 flex items-center justify-center"><item.Icon className="size-5 text-vp-navy" /></div>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
              {userData.fitnessGoal === 'Build Muscle (Bulk)' && [
                { Icon: Dumbbell, text: 'برنامج تضخيم مصمم بالذكاء الاصطناعي يزيد قوتك وحجمك' },
                { Icon: Flame, text: 'حساب فائض السعرات والماكروز المثالي لبناء العضلات' },
                { Icon: TrendingUp, text: 'تطور تدريجي — التطبيق يرفع الأوزان والتكرارات تلقائياً' },
                
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-vp-navy/5 border border-vp-navy/10">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-vp-navy/10 flex items-center justify-center"><item.Icon className="size-5 text-vp-navy" /></div>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
              {userData.fitnessGoal === 'Body Recomposition' && [
                { Icon: Dumbbell, text: 'خطة متوازنة تحرق الدهون وتبني العضلات في نفس الوقت' },
                { Icon: Flame, text: 'حساب دقيق للسعرات والماكروز يناسب هدف إعادة التكوين' },
                { Icon: TrendingUp, text: 'متابعة ذكية — التطبيق يعدّل بين أيام التمرين والراحة' },
                
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 p-3 rounded-xl bg-vp-navy/5 border border-vp-navy/10">
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-vp-navy/10 flex items-center justify-center"><item.Icon className="size-5 text-vp-navy" /></div>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Gender (auto-advance) */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو جنسك؟</h2>
              <p className="text-muted-foreground">سنستخدم هذا لضبط حساب السعرات الحرارية.</p>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {[
                { id: 'male', label: 'ذكر' },
                { id: 'female', label: 'أنثى' },
              ].map((g) => (
                <button key={g.id} onClick={() => selectAndAdvance(() => setUserData({ ...userData, gender: g.id as 'male' | 'female' }))}
                  className={`p-6 rounded-2xl text-center transition-all duration-300 relative ${
                    userData.gender === g.id ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.03]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  {userData.gender === g.id && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-vp-navy flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                  <div className="flex justify-center mb-2"><User className="size-10 text-vp-navy" /></div>
                  <span className="text-xl font-semibold">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Birth Year (button advance) */}
        {step === 5 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">متى ولدت؟</h2>
              <p className="text-muted-foreground">يؤثر العمر على معدل الأيض واحتياجات الطاقة.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <span className="text-5xl font-bold block mb-4">{userData.birthYear}</span>
                <input type="range" min="1950" max="2015" value={userData.birthYear} onChange={(e) => { const year = Number(e.target.value); setUserData({ ...userData, birthYear: year, age: new Date().getFullYear() - year }) }} className="w-full accent-vp-navy" />
                <p className="text-muted-foreground mt-4">العمر: {userData.age} سنة</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Height & Weight (button advance) */}
        {step === 6 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">الطول والوزن</h2>
              <p className="text-muted-foreground">بيانات أساسية لحساب مؤشر كتلة الجسم (BMI).</p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-muted-foreground mb-2">الطول (سم)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="100" max="250" value={userData.height} onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })} className="flex-1 accent-vp-navy" />
                  <span className="text-2xl font-bold w-16 text-center">{userData.height}</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-muted-foreground mb-2">الوزن (كجم)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="30" max="200" value={userData.weight} onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })} className="flex-1 accent-vp-navy" />
                  <span className="text-2xl font-bold w-16 text-center">{userData.weight}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Target Weight + Speed (button advance) */}
        {step === 7 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو وزنك المثالي؟</h2>
              <p className="text-muted-foreground">الهدف الذي تسعى للوصول إليه.</p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <span className="text-5xl font-bold block mb-2">{userData.targetWeight}</span>
                <span className="text-muted-foreground">كجم</span>
                <input type="range" min="30" max="200" value={userData.targetWeight} onChange={(e) => setUserData({ ...userData, targetWeight: Number(e.target.value) })} className="w-full accent-vp-navy mt-4" />
              </div>
              {userData.fitnessGoal !== 'Body Recomposition' && (
                <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                  <label className="block text-sm text-muted-foreground mb-3">سرعة التغيير أسبوعياً</label>
                  <div className="flex justify-center gap-6 mb-3">
                    <div className={`flex flex-col items-center gap-1 transition-opacity ${userData.targetSpeed < 0.5 ? 'opacity-100' : 'opacity-30'}`}>
                      <Sprout className="size-6" /><span className="text-[10px] font-medium">بطيء</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 transition-opacity ${userData.targetSpeed >= 0.5 && userData.targetSpeed < 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <Zap className="size-6" /><span className="text-[10px] font-medium">متوسط</span>
                    </div>
                    <div className={`flex flex-col items-center gap-1 transition-opacity ${userData.targetSpeed >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                      <Flame className="size-6" /><span className="text-[10px] font-medium">سريع</span>
                    </div>
                  </div>
                  <span className="text-3xl font-bold block mb-1">{userData.targetSpeed.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">كجم/أسبوع</span>
                  <input type="range" min="0.1" max="1.5" step="0.1" value={userData.targetSpeed} onChange={(e) => setUserData({ ...userData, targetSpeed: Number(e.target.value) })} className="w-full accent-vp-navy mt-4" />
                  <button onClick={() => setUserData({ ...userData, targetSpeed: 0.5 })} className="mt-3 px-4 py-2 rounded-full bg-vp-navy/10 text-vp-navy font-medium text-sm">السرعة المستحسنة (0.5 كجم)</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 8: Activity Level + Fitness Level (MERGED) — button advance, disabled until both selected */}
        {step === 8 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">مستوى النشاط واللياقة</h2>
              <p className="text-muted-foreground">سنستخدم هذه البيانات لحساب احتياجاتك.</p>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto">
              {/* Activity Level */}
              <div>
                <h3 className="text-sm font-semibold text-vp-navy mb-2">كم مرة تتمرن أسبوعياً؟</h3>
                <div className="space-y-2">
                  {activityLevels.map((level) => (
                    <button key={level.id} onClick={() => setUserData({ ...userData, activityLevel: level.value })}
                      className={`w-full p-3 rounded-2xl text-right flex items-center gap-3 transition-all duration-300 ${
                        userData.activityLevel === level.value ? 'bg-vp-navy/10 border-2 border-vp-navy' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        userData.activityLevel === level.value ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        {userData.activityLevel === level.value ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : <level.icon className="size-5" />}
                      </div>
                      <div><h4 className="font-semibold">{level.title}</h4><p className="text-xs text-muted-foreground">{level.subtitle}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Fitness Level */}
              <div>
                <h3 className="text-sm font-semibold text-vp-navy mb-2">ما مستوى لياقتك الحالي؟</h3>
                <div className="space-y-2">
                  {fitnessLevelOptions.map((level) => (
                    <button key={level.id} onClick={() => setUserData({ ...userData, fitnessLevel: level.id })}
                      className={`w-full p-3 rounded-2xl text-right flex items-center gap-3 transition-all duration-300 ${
                        userData.fitnessLevel === level.id ? 'bg-vp-navy/10 border-2 border-vp-navy' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        userData.fitnessLevel === level.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        {userData.fitnessLevel === level.id ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : <level.icon className="size-5" />}
                      </div>
                      <div><h4 className="font-semibold">{level.title}</h4><p className="text-xs text-muted-foreground">{level.subtitle}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: IB2 — Body Stats (TDEE / BMI card) */}
        {step === 9 && (
            <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-navy/10 flex items-center justify-center">
                <Flame className="size-10 text-vp-navy" />
              </div>
              <h2 className="text-2xl font-bold mb-2">إحصائيات جسمك</h2>
              <p className="text-muted-foreground mb-6">احتياجك اليومي من الطاقة ~{bodyStats.tdee} سعرة</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center">
                  <p className="text-2xl font-bold text-vp-navy">{bodyStats.tdee}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">TDEE سعرة/يوم</p>
                </div>
                <div className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center">
                  <p className="text-2xl font-bold text-vp-navy">{bodyStats.bmi}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">BMI — {bodyStats.bmiCategory}</p>
                </div>
                <div className="p-4 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center">
                  <p className="text-2xl font-bold text-vp-navy">{bodyStats.fitnessLabel}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">مستوى اللياقة</p>
                </div>
              </div>

              {/* Feature Peek: Nutrition */}
              <div className="rounded-2xl border border-vp-navy/10 bg-gradient-to-b from-vp-navy/5 to-transparent p-4 animate-fade-in animate-delay-200">
                <p className="text-sm font-semibold text-vp-navy mb-2">🍽️ نظام غذائي مبني على أرقامك</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  احصل على سعرات وبروتين وماكروز مضبوطة على جسمك — جاهزة داخل التطبيق لتتبعها يومياً
                </p>
                <div className="rounded-xl overflow-hidden border border-vp-navy/10">
                  <Image src="/6.png" alt="تتبع التغذية" width={600} height={300} className="w-full h-auto" />
                </div>
              </div>
            </div>
        )}

        {/* Step 10: AI Food Scanning Feature Peek */}
        {step === 10 && (
            <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
                <span className="text-4xl">📸</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">صوّر أكلك وخلّي الذكاء الاصطناعي يحسبلك</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed px-2">
                بس صوّر طبقك أو أي أكل قدامك — والتطبيق يحسب السعرات والبروتين والماكروز تلقائياً. ما تحتاج تدوّر أو تدخل شي يدوي.
              </p>

              <div className="space-y-3 text-right px-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/15">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="text-sm font-semibold">تعرف على أي وجبة</p>
                    <p className="text-xs text-muted-foreground">من مطاعم، بيتي، أو حتى سناكات</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-sm font-semibold">نتائج فورية ودقيقة</p>
                    <p className="text-xs text-muted-foreground">سعرات، بروتين، كارب، ودهون في ثانية</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm font-semibold">تتبع مستمر بدون تعب</p>
                    <p className="text-xs text-muted-foreground">كل شي ينضاف لسجلك اليومي تلقائي</p>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Step 11: Workout Location (auto-advance) */}
        {step === 11 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">أين تفضل التمرين؟</h2>
              <p className="text-muted-foreground">سنخصص التمارين حسب المكان والأدوات المتاحة لديك.</p>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {workoutLocationOptions.map((location) => (
                <button key={location.id} onClick={() => selectAndAdvance(() => setUserData({ ...userData, workoutLocation: location.id }))}
                  className={`w-full p-5 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.workoutLocation === location.id ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    userData.workoutLocation === location.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.workoutLocation === location.id ? (
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : <location.icon className="size-7" />}
                  </div>
                  <div><h3 className="font-semibold text-lg">{location.title}</h3><p className="text-sm text-muted-foreground">{location.subtitle}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 12: Split + Training Style (MERGED) — button advance, disabled until both selected */}
        {step === 12 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">تقسيم التمارين وأسلوبك</h2>
              <p className="text-muted-foreground">اختر نظام التقسيم وأسلوب التمرين.</p>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto">
              {/* Split Preference */}
              <div>
                <h3 className="text-sm font-semibold text-vp-navy mb-2">كيف تفضل تقسيم تمارينك؟</h3>
                <div className="space-y-2">
                  {splitPreferenceOptions.map((option) => (
                    <button key={option.id} onClick={() => setUserData({ ...userData, splitPreference: option.id })}
                      className={`w-full p-3 rounded-2xl text-right flex items-center gap-3 transition-all duration-300 ${
                        userData.splitPreference === option.id ? 'bg-vp-navy/10 border-2 border-vp-navy' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        userData.splitPreference === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        {userData.splitPreference === option.id ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : <option.icon className="size-5" />}
                      </div>
                      <div><h4 className="font-semibold">{option.title}</h4><p className="text-xs text-muted-foreground">{option.subtitle}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Training Style */}
              <div>
                <h3 className="text-sm font-semibold text-vp-navy mb-2">ما أسلوب التمرين المفضل؟</h3>
                <div className="space-y-2">
                  {trainingStyleOptions.map((option) => (
                    <button key={option.id} onClick={() => setUserData({ ...userData, trainingStyle: option.id })}
                      className={`w-full p-3 rounded-2xl text-right flex items-center gap-3 transition-all duration-300 ${
                        userData.trainingStyle === option.id ? 'bg-vp-navy/10 border-2 border-vp-navy' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                        userData.trainingStyle === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}>
                        {userData.trainingStyle === option.id ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        ) : <option.icon className="size-5" />}
                      </div>
                      <div><h4 className="font-semibold">{option.title}</h4><p className="text-xs text-muted-foreground">{option.subtitle}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 13: Priority Muscles (multi-select, max 2) */}
        {step === 13 && (
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
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <muscle.icon className="size-5" />
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
          </div>
        )}

        {/* Step 14: Injuries (multi-select with clear) */}
        {step === 14 && (
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
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <injury.icon className="size-5" />
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
          </div>
        )}

        {/* Step 15: IB3 — Training Preview */}
        {step === 15 && (
            <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-navy/10 flex items-center justify-center">
                <Dumbbell className="size-10 text-vp-navy" />
              </div>
              <h2 className="text-2xl font-bold mb-2">خطة تمرينك الأسبوعية</h2>
              <p className="text-muted-foreground mb-6">{weekSchedule.daysNum} أيام/أسبوع — {splitPreferenceOptions.find(s => s.id === userData.splitPreference)?.title || 'AI يختار'}</p>
              {/* Weekly calendar */}
              <div className="flex justify-center gap-2 mb-6">
                {weekSchedule.schedule.map((label, i) => (
                  <div key={i} className={`flex flex-col items-center gap-1 ${label ? '' : 'opacity-30'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      label ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}>
                      {label || 'راحة'}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{dayNamesAr[i]}</span>
                  </div>
                ))}
              </div>
              {/* Priority muscles + injuries */}
              {(userData.priorityMuscles.length > 0 || userData.injuries.length > 0) && (
                <div className="space-y-2">
                  {userData.priorityMuscles.length > 0 && (
                    <div className="p-3 rounded-xl bg-vp-navy/5 border border-vp-navy/15">
                      <p className="text-xs"><Target className="size-3 inline text-vp-navy ml-1" /> تركيز إضافي على: {userData.priorityMuscles.map(m => priorityMuscleOptions.find(p => p.id === m)?.title).join('، ')}</p>
                    </div>
                  )}
                  {userData.injuries.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                      <p className="text-xs text-amber-700 dark:text-amber-400">تم مراعاة إصاباتك: {userData.injuries.map(inj => injuryOptions.find(io => io.id === inj)?.title).join('، ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feature Peek: Workouts */}
              <div className="rounded-2xl border border-vp-navy/10 bg-gradient-to-b from-vp-navy/5 to-transparent p-4 mt-6 animate-fade-in animate-delay-200">
                <p className="text-sm font-semibold text-vp-navy mb-2">🏋️ تمارين بفيديو HD ومتابعة لحظية</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  كل تمرين معاه فيديو توضيحي عالي الجودة وعداد تكرارات مباشر — مثل مدرب شخصي في جيبك
                </p>
                <div className="rounded-xl overflow-hidden border border-vp-navy/10">
                  <Image src="/4.png" alt="تمارين بفيديو" width={600} height={300} className="w-full h-auto" />
                </div>
              </div>
            </div>
        )}

        {/* Step 16: Cardio Preference (auto-advance) */}
        {step === 16 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">هل تريد كارديو في خطتك؟</h2>
              <p className="text-muted-foreground">الكارديو يساعد في حرق الدهون وتحسين صحة القلب.</p>
            </div>
            <div className="flex-1 space-y-3">
              {cardioPreferenceOptions.map((option) => (
                <button key={option.id} onClick={() => selectAndAdvance(() => setUserData({ ...userData, cardioPreference: option.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.cardioPreference === option.id ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    userData.cardioPreference === option.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.cardioPreference === option.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : <option.icon className="size-6" />}
                  </div>
                  <div><h3 className="font-semibold text-lg">{option.title}</h3><p className="text-sm text-muted-foreground">{option.subtitle}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 17: Challenges (button advance) */}
        {step === 17 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي يمنعك من الوصول لهدفك؟</h2>
              <p className="text-muted-foreground">سنساعدك في التغلب على هذه التحديات.</p>
            </div>
            <div className="flex-1 space-y-3">
              {challengeOptions.map((ch) => (
                <button key={ch.id} onClick={() => {
                  const challenges = userData.challenges.includes(ch.id) ? userData.challenges.filter(c => c !== ch.id) : [...userData.challenges, ch.id]
                  setUserData({ ...userData, challenges })
                }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.challenges.includes(ch.id) ? 'bg-vp-navy/10 border-2 border-vp-navy' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center"><ch.icon className="size-5" /></div>
                  <span className="font-medium">{ch.title}</span>
                  {userData.challenges.includes(ch.id) && (
                    <svg className="w-5 h-5 text-vp-navy mr-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 18: Motivation (single-select, auto-advance) */}
        {step === 18 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي يحفزك أكثر؟</h2>
              <p className="text-muted-foreground">سنخصص تجربتك بناءً على دافعك.</p>
            </div>
            <div className="flex-1 space-y-3">
              {motivationOptions.map((opt) => (
                <button key={opt.id} onClick={() => selectAndAdvance(() => setUserData({ ...userData, motivation: opt.id }))}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all duration-300 ${
                    userData.motivation === opt.id ? 'bg-vp-navy/10 border-2 border-vp-navy scale-[1.02]' : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    userData.motivation === opt.id ? 'bg-vp-navy text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {userData.motivation === opt.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    ) : <opt.icon className="size-6" />}
                  </div>
                  <span className="font-medium">{opt.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 18: IB4 — Full Reveal (processing → graph + plan + social proof) */}
        {step === 19 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            {!revealReady ? (
              /* Processing Animation */
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className="text-6xl font-bold mb-4 text-vp-navy">{processingProgress}%</div>
                <h2 className="text-xl font-semibold mb-8">نقوم بتجهيز كل شيء لك</h2>
                <div className="w-full h-3 bg-vp-beige/50 dark:bg-neutral-700 rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-vp-navy transition-all duration-300 rounded-full" style={{ width: `${processingProgress}%` }} />
                </div>
                <div className="space-y-3 text-right">
                  {['حساب السعرات الحرارية', 'توزيع الماكروز (بروتين، كارب، دهون)', 'تقدير العمر الأيضي', 'تحليل درجة الصحة'].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 transition-opacity ${completedChecks.includes(i) ? 'opacity-100' : 'opacity-30'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedChecks.includes(i) ? 'bg-vp-navy' : 'bg-vp-beige dark:bg-neutral-600'}`}>
                        {completedChecks.includes(i) && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Full Reveal Content */
              <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="text-center mb-4 pt-4">
                  <h2 className="text-2xl font-bold mb-1">رحلتك مع Vega Power</h2>
                  <p className="text-muted-foreground text-sm">شوف الفرق بين الاستمرار بدون خطة وبين استخدام التطبيق</p>
                </div>

                {/* Animated Graph */}
                <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 p-5 relative overflow-hidden">
                  <div className="flex justify-center gap-6 mb-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-vp-navy" /><span className="text-xs font-medium">مع Vega Power</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-400" /><span className="text-xs font-medium text-muted-foreground">بدون خطة</span></div>
                  </div>
                  <div className="relative" style={{ height: 220 }}>
                    <svg viewBox="0 0 320 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.02" />
                        </linearGradient>
                        <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      {[0, 1, 2, 3, 4].map((i) => (<line key={`grid-${i}`} x1="40" y1={20 + i * 40} x2="310" y2={20 + i * 40} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />))}
                      <text x="32" y="24" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">هدفك</text>
                      <text x="32" y="104" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">الآن</text>
                      <text x="32" y="184" textAnchor="end" className="fill-current text-muted-foreground" fontSize="8" opacity="0.5">بداية</text>
                      {['اليوم', 'شهر ١', 'شهر ٢', 'شهر ٣', 'شهر ٤', 'شهر ٦'].map((label, i) => (
                        <text key={`x-${i}`} x={40 + i * 54} y="198" textAnchor="middle" className="fill-current text-muted-foreground" fontSize="7" opacity="0.5">{label}</text>
                      ))}
                      <path d="M40,140 C94,135 148,110 202,70 S280,25 310,20 L310,180 L40,180 Z" fill="url(#successGradient)" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 1s ease-out 0.5s' }} />
                      <path d="M40,140 C94,142 148,145 202,143 S280,146 310,144" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={graphAnimated ? 0 : 400} style={{ transition: 'stroke-dashoffset 1.5s ease-out 0.3s' }} />
                      <path d="M40,140 C94,135 148,110 202,70 S280,25 310,20" fill="none" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" strokeDasharray="400" strokeDashoffset={graphAnimated ? 0 : 400} style={{ transition: 'stroke-dashoffset 2s ease-out 0.6s' }} />
                      <circle cx="310" cy="20" r="5" fill="#1e3a5f" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.3s ease-out 2.4s' }} />
                      <circle cx="310" cy="20" r="8" fill="#1e3a5f" opacity={graphAnimated ? 0.2 : 0} style={{ transition: 'opacity 0.3s ease-out 2.4s' }}>{graphAnimated && <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />}</circle>
                      <text x="310" y="12" textAnchor="middle" fontSize="12" fill="#1e3a5f" fontWeight="bold" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.5s ease-out 2.6s' }}>&#x2605;</text>
                      <circle cx="310" cy="144" r="4" fill="#9ca3af" opacity={graphAnimated ? 1 : 0} style={{ transition: 'opacity 0.3s ease-out 1.6s' }} />
                    </svg>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-3 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease-out 2s' }}>
                    <p className="text-xl font-bold text-vp-navy mb-1">3x</p>
                    <p className="text-[10px] text-muted-foreground">نتائج أسرع</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease-out 2.2s' }}>
                    <p className="text-xl font-bold text-vp-navy mb-1">91%</p>
                    <p className="text-[10px] text-muted-foreground">حققوا أهدافهم</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-vp-navy/5 border border-vp-navy/15 text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease-out 2.4s' }}>
                    <p className="text-xl font-bold text-vp-navy mb-1">12%</p>
                    <p className="text-[10px] text-muted-foreground">أعلى فعالية</p>
                  </div>
                </div>

                {/* Program Summary Card */}
                <div className="rounded-2xl bg-vp-navy text-white mt-4 p-4" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease-out 2.6s' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Sparkles className="size-5" /></div>
                    <div><p className="text-[10px] opacity-70">برنامجك</p><p className="font-bold">{userData.programName}</p></div>
                  </div>
                  <div className="flex justify-around text-center bg-white/5 rounded-xl p-3 mb-3">
                    <div><p className="text-lg font-bold text-green-400">{userData.calculatedCalories}</p><p className="text-[9px] opacity-70">سعرة/يوم</p></div>
                    <div className="border-r border-white/10"></div>
                    <div><p className="text-lg font-bold text-blue-400">{userData.proteinGrams}g</p><p className="text-[9px] opacity-70">بروتين</p></div>
                    <div className="border-r border-white/10"></div>
                    <div><p className="text-lg font-bold text-purple-400">{userData.carbsGrams}g</p><p className="text-[9px] opacity-70">كارب</p></div>
                  </div>
                  <div className="flex justify-between text-xs opacity-80">
                    <span>{userData.daysPerWeek} أيام/أسبوع</span>
                    <span>{splitPreferenceOptions.find(s => s.id === userData.splitPreference)?.title || 'AI'}</span>
                    {userData.fitnessGoal !== 'Body Recomposition' && (
                      <span>~{Math.max(1, Math.round(weightDiff / userData.targetSpeed))} أسبوع للهدف</span>
                    )}
                  </div>
                </div>

                {/* Social proof */}
                <div className="mt-4 p-3 rounded-xl bg-vp-navy text-white text-center" style={{ opacity: graphAnimated ? 1 : 0, transform: graphAnimated ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.5s ease-out 2.8s' }}>
                  <p className="text-sm font-semibold">من أعلى 12% الأكثر فعالية لملفك الشخصي</p>
                  <p className="text-xs opacity-80 mt-1">لا تضيع وقتك بدون خطة واضحة</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 20: Payment Flow (3 sub-steps) */}
        {step === 20 && (
          <div className="flex-1 flex flex-col animate-fade-in overflow-auto -my-8 py-8">

            {/* Sub-step 20a: Plan Selection */}
            {paymentStep === 'plan' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-1">اختر الخطة المناسبة لك</h2>
                  <p className="text-muted-foreground text-sm">برنامجك جاهز — فقط اختر خطتك وابدأ</p>
                </div>

                {/* Yearly Card (highlighted) */}
                <button
                  onClick={() => { setSelectedPlan('yearly'); setMfInitialized(false) }}
                  className={`relative w-full rounded-2xl p-5 text-right transition-all duration-200 border-2 mb-3 ${selectedPlan === 'yearly' ? 'bg-vp-navy text-white border-vp-navy shadow-lg shadow-vp-navy/20' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-vp-navy/30'}`}
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-[10px] font-bold px-3 py-0.5 rounded-full text-amber-900 whitespace-nowrap flex items-center gap-1">
                    ⭐ الأوفر · عرض محدود
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${selectedPlan === 'yearly' ? 'text-white' : ''}`}>سنوي</p>
                      <p className={`text-[11px] ${selectedPlan === 'yearly' ? 'text-white/70' : 'text-muted-foreground'}`}>دفعة واحدة · بدون تجديد تلقائي</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-2xl font-black ${selectedPlan === 'yearly' ? 'text-white' : ''}`}>{getFinalPrice(plans.yearly.price)}<span className="text-sm font-medium mr-1">ر.س</span></p>
                      <p className={`text-[11px] ${selectedPlan === 'yearly' ? 'text-white/70' : 'text-muted-foreground'}`}>فقط {Math.round(getFinalPrice(plans.yearly.price) / 12)} ر.س/شهر</p>
                    </div>
                  </div>
                  <div className={`mt-3 pt-3 border-t flex items-center justify-between ${selectedPlan === 'yearly' ? 'border-white/20' : 'border-neutral-100 dark:border-neutral-700'}`}>
                    <span className={`text-xs line-through ${selectedPlan === 'yearly' ? 'text-white/40' : 'text-neutral-400'}`}>540 ر.س</span>
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">خصم 60%</span>
                  </div>
                </button>

                {/* Monthly Card */}
                <button
                  onClick={() => { setSelectedPlan('monthly'); setMfInitialized(false) }}
                  className={`relative w-full rounded-2xl p-5 text-right transition-all duration-200 border-2 mb-4 ${selectedPlan === 'monthly' ? 'bg-vp-navy text-white border-vp-navy shadow-lg shadow-vp-navy/20' : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-vp-navy/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold mb-0.5 ${selectedPlan === 'monthly' ? 'text-white' : ''}`}>شهري</p>
                      <p className={`text-[11px] ${selectedPlan === 'monthly' ? 'text-white/70' : 'text-muted-foreground'}`}>يتجدد تلقائياً · إلغاء في أي وقت من التطبيق</p>
                    </div>
                    <div className="text-left">
                      <p className={`text-2xl font-black ${selectedPlan === 'monthly' ? 'text-white' : ''}`}>{getFinalPrice(plans.monthly.price)}<span className="text-sm font-medium mr-1">ر.س</span></p>
                      <p className={`text-[11px] ${selectedPlan === 'monthly' ? 'text-white/70' : 'text-muted-foreground'}`}>/شهر</p>
                    </div>
                  </div>
                </button>

                {/* Discount Code */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <input type="text" value={discountCode} onChange={(e) => { setDiscountCode(e.target.value.toUpperCase()); setDiscountError('') }} placeholder="كود الخصم (اختياري)" className="flex-1 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-vp-navy/40 outline-none text-sm text-center" dir="ltr" />
                    <button onClick={applyDiscountCode} disabled={!discountCode.trim() || discountValidating} className="px-4 py-2.5 rounded-xl bg-vp-navy/10 text-vp-navy hover:bg-vp-navy/20 disabled:opacity-50 text-sm font-medium transition-colors">{discountValidating ? '...' : 'تطبيق'}</button>
                  </div>
                  {discountError && (<p className="text-red-500 text-xs mt-1 text-center">{discountError}</p>)}
                  {appliedDiscount && (
                    <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-500/10 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      <span className="text-xs text-green-700 dark:text-green-400">تم تطبيق خصم {appliedDiscount.label}!</span>
                      <button onClick={() => { setAppliedDiscount(null); setDiscountCode('') }} className="text-muted-foreground hover:text-red-500 mr-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => setPaymentStep('email')}
                  className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg shadow-lg"
                >
                  التالي
                </button>
              </>
            )}

            {/* Sub-step 20b: Email Capture */}
            {paymentStep === 'email' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">وين نرسل لك بيانات الدخول؟</h2>
                  <p className="text-muted-foreground text-sm">ستستخدم هذا الإيميل لتسجيل الدخول في التطبيق</p>
                </div>

                <div className="mb-6">
                  <EmailInput value={userData.email} onChange={(val) => setUserData({ ...userData, email: val })} />
                  {userData.email.trim() && !validateEmail(userData.email) && (
                    <p className="text-xs text-red-500 text-center mt-1">أدخل بريداً إلكترونياً صحيحاً</p>
                  )}
                </div>

                {/* Continue Button */}
                <button
                  onClick={() => { setPaymentError(''); setPaymentStep('pay') }}
                  disabled={!validateEmail(userData.email)}
                  className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg shadow-lg disabled:opacity-50"
                >
                  التالي
                </button>
              </>
            )}

            {/* Sub-step 20c: Payment */}
            {paymentStep === 'pay' && (
              <>
                {/* Compact summary card */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 mb-4">
                  <div>
                    <p className="text-sm font-semibold">{selectedPlan === 'yearly' ? 'سنوي' : 'شهري'} — {getFinalPrice(plans[selectedPlan].price)} ر.س</p>
                    <p className="text-[11px] text-muted-foreground">{userData.email}</p>
                  </div>
                  <button onClick={() => { setPaymentStep('plan'); setMfInitialized(false); setPaymentError('') }} className="text-xs text-vp-navy font-medium hover:underline">[تغيير الخطة]</button>
                </div>

                {/* Payment Error */}
                {paymentError && (<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-3"><p className="text-sm text-red-600 dark:text-red-400 text-center">{paymentError}</p></div>)}

                {/* Yearly: MyFatoorah + Tamara */}
                {selectedPlan === 'yearly' && (
                  <>
                    {!mfInitialized && !isProcessingPayment && (
                      <button onClick={initMyFatoorahPayment} disabled={mfSessionLoading}
                        className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 mb-3">
                        {mfSessionLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>جاري تحميل نموذج الدفع...</span></>) :
                          appliedDiscount ? (<>ادفع الآن - <span className="line-through opacity-60 mx-1">{plans.yearly.price}</span> {getFinalPrice(plans.yearly.price)} ريال</>) :
                          (<>ادفع الآن - {getFinalPrice(plans.yearly.price)} ريال</>)}
                      </button>
                    )}

                    {isProcessingPayment && (
                      <div className="flex items-center justify-center gap-2 py-4 mb-3">
                        <div className="w-5 h-5 border-2 border-vp-navy/30 border-t-vp-navy rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">جاري التحقق من الدفع...</span>
                      </div>
                    )}

                    <div id="mf-app-form" ref={mfContainerRef} className={mfInitialized ? 'mb-4' : 'hidden'}></div>
                    <Script src={process.env.NEXT_PUBLIC_MYFATOORAH_JS_URL || 'https://sa.myfatoorah.com/sessions/v1/session.js'} onLoad={() => setMfScriptLoaded(true)} />

                    {/* Divider */}
                    {!isProcessingPayment && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
                        <span className="text-[11px] text-muted-foreground">أو</span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
                      </div>
                    )}

                    {/* Tamara */}
                    {!isProcessingPayment && (
                      <button onClick={handleTamaraCheckout} disabled={tamaraLoading}
                        className="w-full p-3.5 bg-gradient-to-r from-[#FFB88C]/10 via-[#DE6FA1]/10 to-[#8B5CF6]/10 border-2 border-[#DE6FA1]/30 rounded-2xl hover:shadow-lg hover:border-[#DE6FA1]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Image src="/tamara.png" alt="Tamara" width={70} height={24} className="h-6 w-auto object-contain" />
                            <div className="text-right">
                              <p className="text-sm font-semibold">قسّمها على 4 دفعات</p>
                              <p className="text-[11px] text-muted-foreground">{Math.ceil(getFinalPrice(plans.yearly.price) / 4)} ر.س × 4 دفعات بدون فوائد</p>
                            </div>
                          </div>
                          {tamaraLoading ? (
                            <div className="w-5 h-5 border-2 border-[#DE6FA1]/50 border-t-[#DE6FA1] rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5 text-[#DE6FA1] rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          )}
                        </div>
                      </button>
                    )}
                  </>
                )}

                {/* Monthly: StreamPay */}
                {selectedPlan === 'monthly' && (
                  <>
                    <button onClick={handleStreamPayCheckout} disabled={streamPayLoading}
                      className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 mb-3">
                      {streamPayLoading ? (<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>جاري تحويلك للدفع...</span></>) :
                        appliedDiscount ? (<>ادفع الآن - <span className="line-through opacity-60 mx-1">{plans.monthly.price}</span> {getFinalPrice(plans.monthly.price)} ر.س/شهر</>) :
                        (<>ادفع الآن - {getFinalPrice(plans.monthly.price)} ر.س/شهر</>)}
                    </button>
                  </>
                )}

                {/* Payment Methods */}
                <div className="mt-2 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><CreditCard className="size-3" /> Visa</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><CreditCard className="size-3" /> Mastercard</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><CreditCard className="size-3" /> مدى</div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">Apple Pay</div>
                  {selectedPlan === 'yearly' && <Image src="/tamara.png" alt="Tamara" width={36} height={14} className="h-3.5 w-auto object-contain opacity-60" />}
                </div>

                {/* Footer */}
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><Lock className="size-3" /> دفع آمن ومشفر {selectedPlan === 'yearly' ? '• دفعة واحدة بدون تجديد تلقائي' : '• إلغاء في أي وقت'}</p>
                </div>
              </>
            )}

          </div>
        )}

        </div>{/* end scrollable content area */}

        {/* Fixed bottom button bar */}
        {[0, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 19].includes(step) && (
          <div className="shrink-0 pb-6 pt-3 bg-background">
            {step === 0 && (
              <>
                <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-bold text-lg shadow-xl shadow-vp-navy/25 active:scale-[0.98] transition-transform">
                  يلا نبدأ
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">يأخذ أقل من دقيقتين • بدون التزام</p>
              </>
            )}
            {/* Simple next buttons for sliders and insight breaks */}
            {(step === 3 || step === 5 || step === 6 || step === 7 || step === 9 || step === 10 || step === 15) && (
              <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                التالي
              </button>
            )}
            {/* Merged screens: disabled until both selected */}
            {step === 8 && (
              <button onClick={nextStep} disabled={!userData.activityLevel || !userData.fitnessLevel} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg disabled:opacity-50">
                التالي
              </button>
            )}
            {step === 12 && (
              <button onClick={nextStep} disabled={!userData.splitPreference || !userData.trainingStyle} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg disabled:opacity-50">
                التالي
              </button>
            )}
            {step === 13 && (
              <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                {userData.priorityMuscles.length === 0 ? 'تخطي' : 'التالي'}
              </button>
            )}
            {step === 14 && (
              <div className="space-y-3">
                {userData.injuries.length > 0 && (
                  <button onClick={() => setUserData({ ...userData, injuries: [] })} className="w-full py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-muted-foreground font-medium text-sm">
                    لا إصابات (مسح الاختيار)
                  </button>
                )}
                <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                  {userData.injuries.length === 0 ? 'لا إصابات' : 'التالي'}
                </button>
              </div>
            )}
            {step === 17 && (
              <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                التالي
              </button>
            )}
            {/* IB4: only show button after reveal */}
            {step === 19 && revealReady && (
              <button onClick={nextStep} className="w-full py-4 rounded-2xl bg-vp-navy text-white font-semibold text-lg">
                التالي
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
