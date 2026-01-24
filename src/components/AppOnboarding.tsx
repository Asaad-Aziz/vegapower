'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Image from 'next/image'
import { initiateCheckout, addPaymentInfo } from '@/lib/meta-pixel'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15

interface UserData {
  gender: 'male' | 'female' | ''
  activityLevel: string
  height: number
  weight: number
  birthYear: number
  age: number
  fitnessGoal: string
  targetWeight: number
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
  quarterly: { price: 112, period: '3 أشهر', productId: 'moyasar_3months', savings: 'وفر 23 ريال', days: 90 },
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

export default function AppOnboarding() {
  const [step, setStep] = useState<Step>(0)
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly')
  const [showPayment, setShowPayment] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [completedChecks, setCompletedChecks] = useState<number[]>([])
  const [moyasarLoaded, setMoyasarLoaded] = useState(false)
  const [moyasarInitialized, setMoyasarInitialized] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ percent: number; label: string } | null>(null)
  const [discountError, setDiscountError] = useState('')

  const [userData, setUserData] = useState<UserData>({
    gender: '',
    activityLevel: '',
    height: 170,
    weight: 70,
    birthYear: 2000,
    age: new Date().getFullYear() - 2000,
    fitnessGoal: '',
    targetWeight: 65,
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

  const totalSteps = 17
  const progress = (step / (totalSteps - 1)) * 100

  const nextStep = () => {
    if (step < 16) setStep((step + 1) as Step)
  }

  const prevStep = () => {
    if (step > 0) setStep((step - 1) as Step)
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

    // Adjust based on goal and speed (1 kg/week ≈ 1100 kcal/day)
    const adjustment = targetSpeed * 1100

    const goalData = fitnessGoals.find(g => g.value === fitnessGoal)
    if (goalData?.id === 'loseWeight') {
      tdee -= adjustment
    } else if (goalData?.id === 'gainMuscle') {
      tdee += adjustment
    }

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

  // Calculate all values when reaching step 14 (Processing)
  useEffect(() => {
    if (step === 14) {
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

  // Initialize Moyasar
  useEffect(() => {
    if (showPayment && moyasarLoaded && window.Moyasar && !moyasarInitialized) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
      const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || ''
      const plan = plans[selectedPlan]
      
      // Calculate final price with any applied discount
      const finalPrice = appliedDiscount 
        ? Math.round(plan.price * (1 - appliedDiscount.percent / 100))
        : plan.price

      // Track AddPaymentInfo when payment form is shown
      addPaymentInfo({
        content_ids: [plan.productId],
        content_type: 'product',
        value: finalPrice,
        currency: 'SAR',
      })

      setTimeout(() => {
        const el = document.querySelector('.moyasar-form')
        if (el) el.innerHTML = ''

        window.Moyasar.init({
          element: '.moyasar-form',
          amount: finalPrice * 100,
          currency: 'SAR',
          description: `Vega Power App - ${selectedPlan === 'yearly' ? 'اشتراك سنوي' : selectedPlan === 'quarterly' ? 'اشتراك 3 أشهر' : 'اشتراك شهري'}${appliedDiscount ? ` (خصم ${appliedDiscount.label})` : ''}`,
          publishable_api_key: publishableKey,
          callback_url: `${appUrl}/app/success`,
          methods: ['creditcard', 'applepay'],
          apple_pay: {
            label: 'Vega Power App',
            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
            country: 'SA',
            supported_countries: ['SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'US', 'GB'],
          },
          supported_networks: ['mada', 'visa', 'mastercard'],
          metadata: {
            type: 'app_subscription',
            plan: selectedPlan,
            productId: plan.productId,
            discountCode: appliedDiscount ? discountCode : '',
            discountPercent: appliedDiscount ? String(appliedDiscount.percent) : '0',
            originalPrice: String(plan.price),
            finalPrice: String(finalPrice),
            gender: userData.gender,
            activityLevel: userData.activityLevel,
            height: String(userData.height),
            weight: String(userData.weight),
            birthYear: String(userData.birthYear),
            age: String(userData.age),
            fitnessGoal: userData.fitnessGoal,
            targetWeight: String(userData.targetWeight),
            targetSpeed: String(userData.targetSpeed),
            challenges: JSON.stringify(userData.challenges),
            accomplishments: JSON.stringify(userData.accomplishments),
            email: userData.email,
            calculatedCalories: String(userData.calculatedCalories),
            proteinGrams: String(userData.proteinGrams),
            carbsGrams: String(userData.carbsGrams),
            fatGrams: String(userData.fatGrams),
            proteinPercentage: String(userData.proteinPercentage),
            carbsPercentage: String(userData.carbsPercentage),
            fatPercentage: String(userData.fatPercentage),
            programName: userData.programName,
          },
        })
        setMoyasarInitialized(true)
      }, 100)
    }
  }, [showPayment, moyasarLoaded, moyasarInitialized, selectedPlan, userData, appliedDiscount, discountCode])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Apply discount code
  const applyDiscountCode = () => {
    const code = discountCode.toUpperCase().trim()
    if (discountCodes[code]) {
      setAppliedDiscount(discountCodes[code])
      setDiscountError('')
    } else {
      setAppliedDiscount(null)
      setDiscountError('كود الخصم غير صالح')
    }
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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" dir="rtl">
      {/* Progress Bar */}
      {step > 0 && step < 15 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="w-[200px] h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-neutral-500 to-neutral-700 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Back Button */}
      {step > 0 && step < 14 && !showPayment && (
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
            <p className="text-neutral-500 dark:text-neutral-400 mb-12 leading-relaxed">
              دعنا نخصص لك خطة تدريبية وغذائية تناسب احتياجات جسمك 100%
            </p>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg shadow-lg">
              ابدأ الآن
            </button>
          </div>
        )}

        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو جنسك؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">سنستخدم هذا لضبط حساب السعرات الحرارية.</p>
            </div>
            <div className="flex-1 flex flex-col gap-4 justify-center">
              {[
                { id: 'male', emoji: '👨', label: 'ذكر' },
                { id: 'female', emoji: '👩', label: 'أنثى' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setUserData({ ...userData, gender: g.id as 'male' | 'female' })
                    nextStep()
                  }}
                  className={`p-6 rounded-2xl text-center transition-all ${
                    userData.gender === g.id
                      ? 'bg-neutral-500/20 border-2 border-neutral-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
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
              <p className="text-neutral-500 dark:text-neutral-400">يساعدنا هذا في تحديد مستوى نشاطك الحالي.</p>
            </div>
            <div className="flex-1 space-y-3">
              {activityLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    setUserData({ ...userData, activityLevel: level.value })
                    nextStep()
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.activityLevel === level.value
                      ? 'bg-neutral-500/20 border-2 border-neutral-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-2xl">
                    {level.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{level.title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{level.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Height & Weight */}
        {step === 3 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">الطول والوزن</h2>
              <p className="text-neutral-500 dark:text-neutral-400">بيانات أساسية لحساب مؤشر كتلة الجسم (BMI).</p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-2">الطول (سم)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="250"
                    value={userData.height}
                    onChange={(e) => setUserData({ ...userData, height: Number(e.target.value) })}
                    className="flex-1 accent-neutral-500"
                  />
                  <span className="text-2xl font-bold w-16 text-center">{userData.height}</span>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-2">الوزن (كجم)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={userData.weight}
                    onChange={(e) => setUserData({ ...userData, weight: Number(e.target.value) })}
                    className="flex-1 accent-neutral-500"
                  />
                  <span className="text-2xl font-bold w-16 text-center">{userData.weight}</span>
                </div>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 4: Birth Year */}
        {step === 4 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">متى ولدت؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">يؤثر العمر على معدل الأيض واحتياجات الطاقة.</p>
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
                  className="w-full accent-neutral-500"
                />
                <p className="text-neutral-500 dark:text-neutral-400 mt-4">العمر: {userData.age} سنة</p>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 5: Fitness Goal */}
        {step === 5 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو هدفك؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">اختر الهدف الرئيسي لنبني الخطة عليه.</p>
            </div>
            <div className="flex-1 space-y-3">
              {fitnessGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    setUserData({ ...userData, fitnessGoal: goal.value, targetWeight: userData.weight })
                    nextStep()
                  }}
                  className={`w-full p-5 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.fitnessGoal === goal.value
                      ? 'bg-neutral-500/20 border-2 border-neutral-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-2xl">
                    {goal.emoji}
                  </div>
                  <h3 className="font-semibold text-lg">{goal.title}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Target Weight */}
        {step === 6 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو وزنك المثالي؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">الهدف الذي تسعى للوصول إليه.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-8 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <span className="text-6xl font-bold block mb-2">{userData.targetWeight}</span>
                <span className="text-neutral-500 dark:text-neutral-400">كجم</span>
                <input
                  type="range"
                  min="30"
                  max="200"
                  value={userData.targetWeight}
                  onChange={(e) => setUserData({ ...userData, targetWeight: Number(e.target.value) })}
                  className="w-full accent-neutral-500 mt-6"
                />
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 7: Speed */}
        {step === 7 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما مدى سرعة تحقيق هدفك؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">تحكم في وتيرة خسارة أو زيادة الوزن أسبوعياً.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <div className="flex justify-center gap-4 mb-4">
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed < 0.5 ? 'opacity-100' : 'opacity-30'}`}>🐢</span>
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed >= 0.5 && userData.targetSpeed < 1 ? 'opacity-100' : 'opacity-30'}`}>🐰</span>
                  <span className={`text-3xl transition-opacity ${userData.targetSpeed >= 1 ? 'opacity-100' : 'opacity-30'}`}>🔥</span>
                </div>
                <span className="text-4xl font-bold block mb-2">{userData.targetSpeed.toFixed(1)}</span>
                <span className="text-neutral-500 dark:text-neutral-400">كجم في الأسبوع</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={userData.targetSpeed}
                  onChange={(e) => setUserData({ ...userData, targetSpeed: Number(e.target.value) })}
                  className="w-full accent-neutral-500 mt-6"
                />
                <button
                  onClick={() => setUserData({ ...userData, targetSpeed: 0.5 })}
                  className="mt-4 px-4 py-2 rounded-full bg-neutral-500/20 text-neutral-600 dark:text-neutral-400 text-sm"
                >
                  السرعة المستحسنة (0.5 كجم)
                </button>
              </div>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 8: Challenges */}
        {step === 8 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي يمنعك من الوصول لهدفك؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">سنساعدك في التغلب على هذه التحديات.</p>
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
                      ? 'bg-neutral-500/20 border-2 border-neutral-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {ch.emoji}
                  </div>
                  <span className="font-medium">{ch.title}</span>
                  {userData.challenges.includes(ch.id) && (
                    <svg className="w-5 h-5 text-neutral-500 mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 9: Accomplishments */}
        {step === 9 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما الذي تود تحقيقه؟</h2>
              <p className="text-neutral-500 dark:text-neutral-400">سنخصص الخطة لتشمل هذه الجوانب أيضاً.</p>
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
                      ? 'bg-neutral-500/20 border-2 border-neutral-500'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl">
                    {acc.emoji}
                  </div>
                  <span className="font-medium">{acc.title}</span>
                  {userData.accomplishments.includes(acc.id) && (
                    <svg className="w-5 h-5 text-neutral-500 mr-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 10: Nutrition Tracking Question */}
        {step === 10 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-5xl">📸</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">هل تتمنى أن يكون تتبع الغذاء أسهل؟</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              كثير من الناس يتركون الدايت لأن حساب السعرات صعب ومُتعب...
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-right">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">😫</span>
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">الطريقة القديمة</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">البحث عن كل صنف وإدخاله يدوياً</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-right">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤩</span>
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">مع Vega Power</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">صوّر أكلك والذكاء الاصطناعي يحسب كل شيء!</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-lg shadow-lg">
              أريد هذه الميزة! ✨
            </button>
          </div>
        )}

        {/* Step 11: Investment Commitment Question */}
        {step === 11 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <span className="text-5xl">💎</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">هل أنت مستعد للاستثمار في صحتك؟</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              صحتك هي أغلى ما تملك. الاستثمار فيها اليوم يعني حياة أفضل غداً.
            </p>
            
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-3xl">☕</span>
                <span className="text-xl">=</span>
                <span className="text-3xl">💪</span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                بسعر كوب قهوة يومياً، تحصل على مدرب شخصي وأخصائي تغذية في جيبك!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <p className="text-2xl font-bold text-green-500">94%</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">شافوا نتائج</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <p className="text-2xl font-bold text-blue-500">+50K</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">مستخدم</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-center">
                <p className="text-2xl font-bold text-purple-500">4.9⭐</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">تقييم</p>
              </div>
            </div>

            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-lg shadow-lg">
              نعم، أنا مستعد! 🚀
            </button>
          </div>
        )}

        {/* Step 12: Our Story - Why We Built This */}
        {step === 12 && (
          <div className="flex-1 flex flex-col animate-fade-in overflow-auto -my-4 py-4">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <span className="text-4xl">💜</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">قصتنا معك</h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">لماذا بنينا Vega Power</p>
            </div>

            {/* Story Content */}
            <div className="space-y-4 mb-6 text-right">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">😤</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">المشكلة اللي واجهناها</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      جربنا تطبيقات كثيرة، لكن كلها كانت معقدة أو بالإنجليزي أو ما تفهم أكلنا العربي. حسينا إن محتاج يكون في حل أفضل.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">💡</span>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-600 dark:text-purple-400 mb-1">الحل اللي صنعناه</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      تطبيق عربي 100%، يفهم أكلك ويحسب سعراتك بصورة وحدة! مع برامج تمارين مصممة لك شخصياً.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-1">هدفنا</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      نبي نساعدك تشوف نتائج حقيقية وتستمر عليها. مش مجرد تطبيق، إحنا شركاء في رحلتك.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-6">
              <p className="font-semibold mb-3 text-center">كيف نساعدك تنجح؟</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span>📸</span>
                  </div>
                  <p className="text-sm">صوّر وجبتك والذكاء الاصطناعي يحسب السعرات فوراً</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span>🏋️</span>
                  </div>
                  <p className="text-sm">برامج تمارين مخصصة حسب هدفك ومستواك</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span>📊</span>
                  </div>
                  <p className="text-sm">تتبع تقدمك يومياً وشوف نتائجك تتحسن</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <span>👥</span>
                  </div>
                  <p className="text-sm">انضم لمجتمع من الناس اللي مثلك يسعون للأفضل</p>
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-800 to-neutral-900 text-white mb-6">
              <p className="text-center text-sm mb-3 opacity-80">انضم لعائلة Vega Power</p>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold">+50,000</p>
                  <p className="text-xs opacity-70">مستخدم سعودي</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">+2M</p>
                  <p className="text-xs opacity-70">وجبة تم تتبعها</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">+100K</p>
                  <p className="text-xs opacity-70">كيلو تم خسارته</p>
                </div>
              </div>
            </div>

            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg shadow-lg">
              أريد أن أكون جزءاً من هذا! 🌟
            </button>
          </div>
        )}

        {/* Step 13: Motivation */}
        {step === 13 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-500/20 flex items-center justify-center">
              <span className="text-4xl">💪</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {isLosingWeight ? 'خسارة' : 'اكتساب'} {weightDiff} كجم هو هدف واقعي جداً!
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8">ليس صعباً على الإطلاق!</p>
            <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
              90% من المستخدمين يقولون أن التغيير واضح جداً بعد استخدام Vega Power...
            </p>
            <div className="p-4 rounded-2xl bg-neutral-500/10 border border-neutral-500/20">
              <p className="text-sm">📈 يعزز الثقة: أنا أستطيع فعلها</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">يقلل من خطر الاستسلام</p>
            </div>
            <button onClick={nextStep} className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg mt-8">
              التالي
            </button>
          </div>
        )}

        {/* Step 14: Processing */}
        {step === 14 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in text-center">
            <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {processingProgress}%
            </div>
            <h2 className="text-xl font-semibold mb-8">نقوم بتجهيز كل شيء لك</h2>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-8">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-full"
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
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedChecks.includes(i) ? 'bg-neutral-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
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

        {/* Step 15: Payment - Full Featured */}
        {step === 15 && (
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
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">التطبيق الوحيد اللي تحتاجه لتحقيق أهدافك 💪</p>
            </div>

            {/* Encouraging Message */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-4 text-center">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
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
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">- {review.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Program Summary */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-800 via-neutral-900 to-black text-white mb-4 overflow-hidden">
              {/* Header with program name and stats */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
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
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center animate-pulse">
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
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="البريد الإلكتروني"
                dir="ltr"
                className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-400 outline-none text-sm"
              />
            </div>

            {/* New Year Special Offer Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white mb-3 text-center relative overflow-hidden">
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
                { key: 'monthly' as PlanType, label: 'شهر', price: plans.monthly.price, days: plans.monthly.days, savings: null, gradient: 'from-slate-500 to-slate-600' },
                { key: 'quarterly' as PlanType, label: '3 أشهر', price: plans.quarterly.price, days: plans.quarterly.days, savings: plans.quarterly.savings, gradient: 'from-blue-500 to-blue-600' },
                { key: 'yearly' as PlanType, label: 'سنة', price: plans.yearly.price, days: plans.yearly.days, savings: plans.yearly.savings, gradient: 'from-red-500 to-pink-500' },
              ].map((plan) => {
                const finalPrice = getFinalPrice(plan.price)
                const dailyCost = getDailyCost(finalPrice, plan.days)
                return (
                  <button
                    key={plan.key}
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`flex-1 p-3 rounded-xl text-center transition-all relative overflow-hidden ${
                      selectedPlan === plan.key
                        ? `bg-gradient-to-br ${plan.gradient} text-white scale-[1.02] shadow-lg`
                        : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                    }`}
                  >
                    {plan.savings && (
                      <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                        selectedPlan === plan.key ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {plan.savings}
                      </div>
                    )}
                    <div className={`text-[10px] mb-0.5 mt-2 ${selectedPlan === plan.key ? 'opacity-80' : 'text-neutral-500 dark:text-neutral-400'}`}>{plan.label}</div>
                    {appliedDiscount && finalPrice !== plan.price ? (
                      <>
                        <div className="text-sm line-through opacity-50">{plan.price}</div>
                        <div className="text-xl font-bold">{finalPrice}</div>
                      </>
                    ) : (
                      <div className="text-xl font-bold">{plan.price}</div>
                    )}
                    <div className={`text-[10px] ${selectedPlan === plan.key ? 'opacity-80' : 'text-neutral-500 dark:text-neutral-400'}`}>ريال</div>
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
                  className="flex-1 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-400 outline-none text-sm text-center"
                  dir="ltr"
                />
                <button
                  onClick={applyDiscountCode}
                  disabled={!discountCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  تطبيق
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
                    className="text-neutral-500 hover:text-red-500 mr-auto"
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
              <span className="text-xs text-green-700 dark:text-green-400">بدون تجديد تلقائي - ادفع مرة واحدة فقط</span>
            </div>

            {/* Payment Button or Form */}
            {!showPayment ? (
              <button
                onClick={() => {
                  const finalPrice = getFinalPrice(plans[selectedPlan].price)
                  // Track InitiateCheckout event for Meta Pixel
                  initiateCheckout({
                    content_ids: [plans[selectedPlan].productId],
                    content_type: 'product',
                    value: finalPrice,
                    currency: 'SAR',
                    num_items: 1,
                  })
                  setShowPayment(true)
                }}
                disabled={!validateEmail(userData.email)}
                className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-700 to-neutral-900 text-white font-semibold text-lg disabled:opacity-50 shadow-lg"
              >
                {appliedDiscount ? (
                  <>🚀 ابدأ الآن - <span className="line-through opacity-60 mx-1">{plans[selectedPlan].price}</span> {getFinalPrice(plans[selectedPlan].price)} ريال</>
                ) : (
                  <>🚀 ابدأ الآن - {plans[selectedPlan].price} ريال</>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                {/* Order Summary */}
                <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500 dark:text-neutral-400">الخطة</span>
                    <span>{selectedPlan === 'yearly' ? 'سنوية' : selectedPlan === 'quarterly' ? '3 أشهر' : 'شهرية'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500 dark:text-neutral-400">البريد</span>
                    <span dir="ltr" className="text-sm">{userData.email}</span>
                  </div>
                  {appliedDiscount && (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-500 dark:text-neutral-400">السعر الأصلي</span>
                        <span className="line-through">{plans[selectedPlan].price} ريال</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2 text-green-600">
                        <span>الخصم ({appliedDiscount.label})</span>
                        <span>- {plans[selectedPlan].price - getFinalPrice(plans[selectedPlan].price)} ريال</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <span>الإجمالي</span>
                    <span className={appliedDiscount ? 'text-green-600' : ''}>{getFinalPrice(plans[selectedPlan].price)} ريال</span>
                  </div>
                </div>

                {/* Moyasar Payment Form */}
                <div className="moyasar-form"></div>

                <Script
                  src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.5/dist/moyasar.umd.min.js"
                  onLoad={() => setMoyasarLoaded(true)}
                />

                <button
                  onClick={() => { setShowPayment(false); setMoyasarInitialized(false) }}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
                >
                  ← تغيير الخطة
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-3 text-center">
              <p className="text-[10px] text-neutral-400">🔒 دفع آمن ومشفر عبر Moyasar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
