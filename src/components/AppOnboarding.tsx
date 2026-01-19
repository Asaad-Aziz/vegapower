'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Script from 'next/script'

type Step = 'welcome' | 'goal' | 'experience' | 'schedule' | 'info' | 'plan' | 'payment'

interface UserData {
  goal: string
  experience: string
  schedule: string
  name: string
  email: string
  phone: string
  plan: 'monthly' | 'yearly'
}

const plans = {
  monthly: { price: 49, period: 'شهرياً', savings: null },
  yearly: { price: 299, period: 'سنوياً', savings: '50%' },
}

export default function AppOnboarding() {
  const [step, setStep] = useState<Step>('welcome')
  const [userData, setUserData] = useState<UserData>({
    goal: '',
    experience: '',
    schedule: '',
    name: '',
    email: '',
    phone: '',
    plan: 'yearly',
  })
  const [moyasarLoaded, setMoyasarLoaded] = useState(false)
  const [moyasarInitialized, setMoyasarInitialized] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const steps: Step[] = ['welcome', 'goal', 'experience', 'schedule', 'info', 'plan', 'payment']
  const currentStepIndex = steps.indexOf(step)
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex])
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex])
    }
  }

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

  // Initialize Moyasar when on payment step
  useEffect(() => {
    if (step === 'payment' && moyasarLoaded && window.Moyasar && !moyasarInitialized) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '')
      const publishableKey = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || ''
      const selectedPlan = plans[userData.plan]

      setTimeout(() => {
        const moyasarElement = document.querySelector('.moyasar-form')
        if (moyasarElement) {
          moyasarElement.innerHTML = ''
        }

        window.Moyasar.init({
          element: '.moyasar-form',
          amount: selectedPlan.price * 100,
          currency: 'SAR',
          description: `Vega Power App - ${userData.plan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}`,
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
            user_name: userData.name,
            user_email: userData.email,
            user_phone: userData.phone,
            goal: userData.goal,
            experience: userData.experience,
            schedule: userData.schedule,
            plan: userData.plan,
            type: 'app_subscription',
          },
        })

        setMoyasarInitialized(true)
      }, 100)
    }
  }, [step, moyasarLoaded, moyasarInitialized, userData])

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string) => /^05\d{8}$/.test(phone)

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white">
      {/* Progress Bar */}
      {step !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-neutral-800">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Back Button */}
      {step !== 'welcome' && step !== 'payment' && (
        <button
          onClick={prevStep}
          className="fixed top-6 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="max-w-md mx-auto px-6 py-12 min-h-screen flex flex-col">
        {/* Welcome Step */}
        {step === 'welcome' && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
                <span className="text-4xl">💪</span>
              </div>
              <h1 className="text-3xl font-bold mb-3">Vega Power</h1>
              <p className="text-neutral-400">تطبيقك الشخصي للياقة البدنية</p>
            </div>

            <div className="space-y-4 mb-12">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="font-semibold">برامج مخصصة</h3>
                  <p className="text-sm text-neutral-400">تمارين تناسب أهدافك</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div>
                  <h3 className="font-semibold">أنظمة غذائية</h3>
                  <p className="text-sm text-neutral-400">وجبات محسوبة السعرات</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold">تتبع تقدمك</h3>
                  <p className="text-sm text-neutral-400">إحصائيات ونتائج مرئية</p>
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              ابدأ الآن
            </button>
          </div>
        )}

        {/* Goal Step */}
        {step === 'goal' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو هدفك؟</h2>
              <p className="text-neutral-400">اختر الهدف الرئيسي من التدريب</p>
            </div>

            <div className="flex-1 space-y-3">
              {[
                { id: 'fat_loss', emoji: '🔥', label: 'خسارة الدهون', desc: 'حرق الدهون وإنقاص الوزن' },
                { id: 'muscle_gain', emoji: '💪', label: 'بناء العضلات', desc: 'زيادة الكتلة العضلية' },
                { id: 'body_toning', emoji: '✨', label: 'شد الجسم', desc: 'تحسين شكل الجسم' },
                { id: 'fitness', emoji: '🏃', label: 'لياقة عامة', desc: 'تحسين الصحة واللياقة' },
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => {
                    setUserData({ ...userData, goal: goal.id })
                    nextStep()
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.goal === goal.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {goal.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{goal.label}</h3>
                    <p className="text-sm text-neutral-400">{goal.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Experience Step */}
        {step === 'experience' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">ما هو مستواك؟</h2>
              <p className="text-neutral-400">حدد خبرتك في التمارين الرياضية</p>
            </div>

            <div className="flex-1 space-y-3">
              {[
                { id: 'beginner', emoji: '🌱', label: 'مبتدئ', desc: 'جديد على الرياضة' },
                { id: 'intermediate', emoji: '🌿', label: 'متوسط', desc: '6 أشهر - سنتين خبرة' },
                { id: 'advanced', emoji: '🌳', label: 'متقدم', desc: 'أكثر من سنتين خبرة' },
              ].map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    setUserData({ ...userData, experience: exp.id })
                    nextStep()
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.experience === exp.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {exp.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{exp.label}</h3>
                    <p className="text-sm text-neutral-400">{exp.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Step */}
        {step === 'schedule' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">كم مرة تتمرن؟</h2>
              <p className="text-neutral-400">حدد عدد أيام التمرين في الأسبوع</p>
            </div>

            <div className="flex-1 space-y-3">
              {[
                { id: '3', emoji: '3️⃣', label: '3 أيام', desc: 'مثالي للمبتدئين' },
                { id: '4', emoji: '4️⃣', label: '4 أيام', desc: 'توازن مثالي' },
                { id: '5', emoji: '5️⃣', label: '5 أيام', desc: 'نتائج أسرع' },
                { id: '6', emoji: '6️⃣', label: '6 أيام', desc: 'للجادين فقط' },
              ].map((sched) => (
                <button
                  key={sched.id}
                  onClick={() => {
                    setUserData({ ...userData, schedule: sched.id })
                    nextStep()
                  }}
                  className={`w-full p-4 rounded-2xl text-right flex items-center gap-4 transition-all ${
                    userData.schedule === sched.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                    {sched.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{sched.label}</h3>
                    <p className="text-sm text-neutral-400">{sched.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info Step */}
        {step === 'info' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">معلوماتك</h2>
              <p className="text-neutral-400">أدخل بياناتك لإنشاء حسابك</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  placeholder="محمد أحمد"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  placeholder="you@example.com"
                  dir="ltr"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">رقم الجوال</label>
                <input
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={!userData.name || !validateEmail(userData.email) || !validatePhone(userData.phone)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-lg shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              التالي
            </button>
          </div>
        )}

        {/* Plan Step */}
        {step === 'plan' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-8 pt-8">
              <h2 className="text-2xl font-bold mb-2">اختر خطتك</h2>
              <p className="text-neutral-400">اختر الاشتراك المناسب لك</p>
            </div>

            <div className="flex-1 space-y-4">
              {/* Yearly Plan - Recommended */}
              <button
                onClick={() => setUserData({ ...userData, plan: 'yearly' })}
                className={`w-full p-5 rounded-2xl text-right relative transition-all ${
                  userData.plan === 'yearly'
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Badge */}
                <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-xs font-semibold">
                  وفّر 50%
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-1">الاشتراك السنوي</h3>
                    <p className="text-sm text-neutral-400">الأفضل قيمة</p>
                  </div>
                  <div className="text-left">
                    <div className="text-3xl font-bold">{plans.yearly.price}</div>
                    <div className="text-sm text-neutral-400">ر.س / سنة</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 text-sm text-neutral-400">
                  ≈ {Math.round(plans.yearly.price / 12)} ر.س شهرياً
                </div>
              </button>

              {/* Monthly Plan */}
              <button
                onClick={() => setUserData({ ...userData, plan: 'monthly' })}
                className={`w-full p-5 rounded-2xl text-right transition-all ${
                  userData.plan === 'monthly'
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-1">الاشتراك الشهري</h3>
                    <p className="text-sm text-neutral-400">مرونة أكثر</p>
                  </div>
                  <div className="text-left">
                    <div className="text-3xl font-bold">{plans.monthly.price}</div>
                    <div className="text-sm text-neutral-400">ر.س / شهر</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Features */}
            <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="font-semibold mb-3">يشمل الاشتراك:</h4>
              <div className="space-y-2 text-sm">
                {[
                  'برامج تدريبية مخصصة',
                  'أنظمة غذائية متنوعة',
                  'فيديوهات شرح التمارين',
                  'تتبع التقدم والإنجازات',
                  'دعم فني متواصل',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-neutral-300">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={nextStep}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 font-semibold text-lg shadow-lg shadow-green-500/30 mt-6"
            >
              اشترك الآن - {plans[userData.plan].price} ر.س
            </button>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="text-center mb-6 pt-8">
              <h2 className="text-2xl font-bold mb-2">إتمام الدفع</h2>
              <p className="text-neutral-400">
                {userData.plan === 'yearly' ? 'الاشتراك السنوي' : 'الاشتراك الشهري'} - {plans[userData.plan].price} ر.س
              </p>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-neutral-400">الاسم</span>
                <span>{userData.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-neutral-400">البريد</span>
                <span dir="ltr">{userData.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">الجوال</span>
                <span dir="ltr">{userData.phone}</span>
              </div>
            </div>

            {/* Moyasar Payment Form */}
            <div className="moyasar-form mb-6 [&_.moyasar-apple-pay-button]:!rounded-xl [&_input]:!rounded-xl [&_button]:!rounded-xl"></div>

            <Script
              src="https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.5/dist/moyasar.umd.min.js"
              onLoad={() => setMoyasarLoaded(true)}
            />

            {/* Back Button */}
            <button
              onClick={prevStep}
              className="w-full py-3 text-neutral-400 hover:text-white transition-colors"
            >
              ← تغيير الخطة
            </button>

            <p className="text-center text-xs text-neutral-500 mt-4">
              🔒 دفع آمن ومشفر عبر Moyasar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
