'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import Image from 'next/image'

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

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
  monthly: { price: 10, period: 'شهر', productId: 'moyasar_monthly', savings: null }, // TODO: Change back to 45 SAR after testing
  quarterly: { price: 112, period: '3 أشهر', productId: 'moyasar_3months', savings: 'وفر 23 ريال' },
  yearly: { price: 255, period: 'سنة', productId: 'moyasar_yearly', savings: 'وفر 285 ريال' },
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

  const totalSteps = 14
  const progress = (step / (totalSteps - 1)) * 100

  const nextStep = () => {
    if (step < 13) setStep((step + 1) as Step)
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

  // Calculate all values when reaching step 12
  useEffect(() => {
    if (step === 11) {
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

      setTimeout(() => {
        const el = document.querySelector('.moyasar-form')
        if (el) el.innerHTML = ''

        window.Moyasar.init({
          element: '.moyasar-form',
          amount: plan.price * 100,
          currency: 'SAR',
          description: `Vega Power App - ${selectedPlan === 'yearly' ? 'اشتراك سنوي' : selectedPlan === 'quarterly' ? 'اشتراك 3 أشهر' : 'اشتراك شهري'}`,
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
  }, [showPayment, moyasarLoaded, moyasarInitialized, selectedPlan, userData])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const weightDiff = Math.abs(userData.weight - userData.targetWeight)
  const isLosingWeight = userData.targetWeight < userData.weight

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" dir="rtl">
      {/* Progress Bar */}
      {step > 0 && step < 12 && (
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
      {step > 0 && step < 11 && !showPayment && (
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

        {/* Step 10: Motivation */}
        {step === 10 && (
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

        {/* Step 11: Processing */}
        {step === 11 && (
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

        {/* Step 12: Payment - Consistent Design */}
        {step === 12 && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg overflow-hidden">
                <Image
                  src="/Vegapower Logo-05.jpg"
                  alt="Vega Power"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold mb-1">اشترك في VegaPower</h2>
              <p className="text-neutral-500 dark:text-neutral-400">احصل على جميع المميزات</p>
            </div>

            {/* Program Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-700 to-neutral-900 text-white text-center mb-4">
              <p className="text-sm opacity-80 mb-1">برنامجك</p>
              <h3 className="text-xl font-bold">{userData.programName}</h3>
              <div className="flex justify-center gap-6 mt-3">
                <div>
                  <div className="text-lg font-bold">{userData.calculatedCalories}</div>
                  <div className="text-xs opacity-70">سعرة/يوم</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{userData.proteinGrams}g</div>
                  <div className="text-xs opacity-70">بروتين</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{userData.carbsGrams}g</div>
                  <div className="text-xs opacity-70">كارب</div>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm text-neutral-500 dark:text-neutral-400 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="you@example.com"
                dir="ltr"
                className="w-full p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-neutral-500 outline-none"
              />
            </div>

            {/* Plan Selection - 3 Horizontal Cards */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'monthly' as PlanType, label: 'شهر', price: plans.monthly.price, savings: null },
                { key: 'quarterly' as PlanType, label: '3 أشهر', price: plans.quarterly.price, savings: plans.quarterly.savings },
                { key: 'yearly' as PlanType, label: 'سنة', price: plans.yearly.price, savings: plans.yearly.savings },
              ].map((plan) => (
                <button
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`flex-1 p-3 rounded-xl text-center transition-all relative ${
                    selectedPlan === plan.key
                      ? 'bg-neutral-500/20 border-2 border-neutral-500 scale-[1.02]'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent'
                  }`}
                >
                  {plan.savings && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-neutral-700 text-white rounded-full text-[10px] font-medium whitespace-nowrap">
                      {plan.savings}
                    </div>
                  )}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 mt-1">{plan.label}</div>
                  <div className="text-lg font-bold">{plan.price}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">ريال</div>
                </button>
              ))}
            </div>

            {/* No Auto-Renewal Badge */}
            <div className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-4">
              <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">بدون تجديد تلقائي</span>
            </div>

            {/* Payment Button or Form */}
            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                disabled={!validateEmail(userData.email)}
                className="w-full py-4 rounded-[30px] bg-gradient-to-r from-neutral-600 to-neutral-800 text-white font-semibold text-lg disabled:opacity-50 shadow-lg"
              >
                💳 الدفع - {plans[selectedPlan].price} ريال
              </button>
            ) : (
              <div className="space-y-4">
                {/* Order Summary */}
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500 dark:text-neutral-400">الخطة</span>
                    <span>{selectedPlan === 'yearly' ? 'سنوية' : selectedPlan === 'quarterly' ? '3 أشهر' : 'شهرية'}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-500 dark:text-neutral-400">البريد</span>
                    <span dir="ltr" className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <span>الإجمالي</span>
                    <span>{plans[selectedPlan].price} ريال</span>
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
                  className="w-full py-3 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors text-sm"
                >
                  ← تغيير الخطة
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-neutral-400">🔒 دفع آمن ومشفر عبر Moyasar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
