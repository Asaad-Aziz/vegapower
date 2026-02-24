'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { purchase } from '@/lib/meta-pixel'
import { snapPurchase } from '@/lib/snapchat-pixel'

function AppSuccessInner() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [hasTrackedPurchase, setHasTrackedPurchase] = useState(false)
  const [userAuthMethod, setUserAuthMethod] = useState<string>('email')
  const hasCalledApi = useRef(false) // Prevent double API calls

  useEffect(() => {
    const processPayment = async () => {
      // Prevent double calls (React Strict Mode or re-renders)
      if (hasCalledApi.current) {
        console.log('API already called, skipping duplicate')
        return
      }
      hasCalledApi.current = true

      const source = searchParams.get('source')
      
      // StreamPay flow - call verification endpoint to create account
      if (source === 'streampay') {
        const emailParam = searchParams.get('email')
        const plan = searchParams.get('plan') || 'monthly'
        const amount = searchParams.get('amount')
        const sessionId = searchParams.get('session')
        const userDataFromUrl = searchParams.get('userData')
        let userDataParam = userDataFromUrl
        // Prefer sessionStorage (URL may be truncated by StreamPay's 2000 char limit)
        if (!userDataParam) {
          try {
            const stored = sessionStorage.getItem('sp_userData')
            if (stored) {
              userDataParam = stored
              sessionStorage.removeItem('sp_userData')
            }
          } catch {}
        }
        const discountCode = searchParams.get('discountCode')
        const authMethodParam = searchParams.get('authMethod') || 'email'
        const appleFirebaseUid = searchParams.get('appleFirebaseUid')
        // StreamPay IDs for subscription management
        const streampayConsumerId = searchParams.get('streampayConsumerId')
        const streampayProductId = searchParams.get('streampayProductId')
        // Note: subscriptionId is created automatically by StreamPay and received via webhook
        
        if (!emailParam) {
          setStatus('error')
          setError('معلومات الدفع غير مكتملة')
          return
        }

        try {
          // Call verification endpoint to create Firebase user and send email
          const response = await fetch('/api/streampay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              email: emailParam,
              plan,
              amount,
              authMethod: authMethodParam,
              appleFirebaseUid: authMethodParam === 'apple' ? appleFirebaseUid : undefined,
              userData: userDataParam
                ? (userDataFromUrl ? decodeURIComponent(userDataParam) : userDataParam)
                : null,
              discountCode,
              streampayConsumerId,
              streampayProductId,
              // subscriptionId will be updated via webhook when StreamPay sends subscription_activated
            }),
          })

          const data = await response.json()

          if (data.success) {
            setEmail(emailParam)
            setUserAuthMethod(data.authMethod || authMethodParam || 'email')
            setStatus('success')
            
            // Track purchase with Meta Pixel + Snapchat Pixel
            if (!hasTrackedPurchase && !data.alreadyProcessed) {
              const productId = `streampay_${plan === 'yearly' ? 'yearly' : plan === 'quarterly' ? '3months' : 'monthly'}`
              const purchaseValue = amount ? parseFloat(amount) : 155
              
              purchase({
                content_name: `Vega Power App - ${plan === 'yearly' ? 'سنوي' : plan === 'quarterly' ? '3 أشهر' : 'شهري'}`,
                content_ids: [productId],
                content_type: 'product',
                value: purchaseValue,
                currency: 'SAR',
                num_items: 1,
              })
              snapPurchase({
                price: purchaseValue,
                currency: 'SAR',
                item_ids: [productId],
                transaction_id: sessionId || undefined,
              })
              setHasTrackedPurchase(true)
              console.log('StreamPay purchase tracking:', { productId, amount, plan })
            }
          } else {
            setStatus('error')
            setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
          }
        } catch {
          setStatus('error')
          setError('حدث خطأ في الاتصال')
        }
        return
      }

      // Tamara flow - call verification endpoint to create account
      if (source === 'tamara') {
        const emailParam = searchParams.get('email')
        const plan = searchParams.get('plan') || 'yearly'
        const amount = searchParams.get('amount')
        const orderRef = searchParams.get('order_ref')
        const discountCode = searchParams.get('discountCode')
        const authMethodParam = searchParams.get('authMethod') || 'email'
        const appleFirebaseUid = searchParams.get('appleFirebaseUid')

        let userDataParam: string | null = null
        try {
          const stored = sessionStorage.getItem('tamara_userData')
          if (stored) {
            userDataParam = stored
            sessionStorage.removeItem('tamara_userData')
          }
        } catch {}

        if (!emailParam || !orderRef) {
          setStatus('error')
          setError('معلومات الدفع غير مكتملة')
          return
        }

        try {
          const response = await fetch('/api/tamara/verify-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderReferenceId: orderRef,
              email: emailParam,
              plan,
              amount,
              authMethod: authMethodParam,
              appleFirebaseUid: authMethodParam === 'apple' ? appleFirebaseUid : undefined,
              userData: userDataParam || null,
              discountCode,
            }),
          })

          const data = await response.json()

          if (data.success) {
            setEmail(emailParam)
            setUserAuthMethod(data.authMethod || authMethodParam || 'email')
            setStatus('success')

            if (!hasTrackedPurchase && !data.alreadyProcessed) {
              const purchaseValue = amount ? parseFloat(amount) : 187
              purchase({
                content_name: 'Vega Power App - سنوي (تمارا)',
                content_ids: ['tamara_yearly'],
                content_type: 'product',
                value: purchaseValue,
                currency: 'SAR',
                num_items: 1,
              })
              snapPurchase({
                price: purchaseValue,
                currency: 'SAR',
                item_ids: ['tamara_yearly'],
                transaction_id: orderRef,
              })
              setHasTrackedPurchase(true)
            }
          } else {
            setStatus('error')
            setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
          }
        } catch {
          setStatus('error')
          setError('حدث خطأ في الاتصال')
        }
        return
      }
      
      // Legacy Moyasar flow
      const paymentId = searchParams.get('id')

      if (!paymentId) {
        // No payment ID and not from StreamPay - might be direct success page visit
        setStatus('error')
        setError('معرف الدفع غير موجود')
        return
      }

      try {
        const response = await fetch('/api/app/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setEmail(data.email)
          
          // Track purchase with Meta Pixel + Snapchat Pixel (only once)
          if (!hasTrackedPurchase && !data.alreadyProcessed) {
            const productId = data.plan ? `moyasar_${data.plan === 'yearly' ? 'yearly' : data.plan === 'quarterly' ? '3months' : 'monthly'}` : 'vega_app_subscription'
            const purchaseValue = data.amount || 155
            
            purchase({
              content_name: `Vega Power App - ${data.plan === 'yearly' ? 'سنوي' : data.plan === 'quarterly' ? '3 أشهر' : 'شهري'}`,
              content_ids: [productId],
              content_type: 'product',
              value: purchaseValue,
              currency: 'SAR',
              num_items: 1,
            })
            snapPurchase({
              price: purchaseValue,
              currency: 'SAR',
              item_ids: [productId],
              transaction_id: paymentId || undefined,
            })
            setHasTrackedPurchase(true)
            console.log('Moyasar purchase tracking:', { productId, amount: data.amount, plan: data.plan })
          }
        } else {
          setStatus('error')
          setError(data.error || 'حدث خطأ أثناء معالجة الطلب')
        }
      } catch {
        setStatus('error')
        setError('حدث خطأ في الاتصال')
      }
    }

    processPayment()
  }, [searchParams, hasTrackedPurchase])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <h2 className="text-xl font-semibold mb-2">جاري إنشاء حسابك...</h2>
          <p className="text-neutral-400">يرجى الانتظار</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          
          {/* Help message for users who completed payment */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 text-right">
            <p className="text-amber-400 text-sm mb-2 font-medium">💡 هل أتممت الدفع؟</p>
            <p className="text-neutral-400 text-xs leading-relaxed">
              إذا أتممت عملية الدفع بنجاح، سيتم إرسال بيانات تسجيل الدخول إلى بريدك الإلكتروني خلال دقائق. 
              تحقق من صندوق الوارد ومجلد البريد المزعج (Spam).
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <a
              href="/app"
              className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              المحاولة مرة أخرى
            </a>
            <a
              href="mailto:support@vegapowerstore.com"
              className="inline-block px-6 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors text-sm"
            >
              تواصل مع الدعم
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-bounce">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-2">مبروك! 🎉</h1>
        <p className="text-neutral-400 mb-8">تم إنشاء حسابك بنجاح</p>

        {/* Instructions Card */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-right mb-6">
          <h3 className="font-semibold mb-4 text-center">خطوات تسجيل الدخول:</h3>
          
          {userAuthMethod === 'apple' ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">حمّل التطبيق</p>
                  <p className="text-sm text-neutral-400">من App Store أو Google Play</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">افتح التطبيق</p>
                  <p className="text-sm text-neutral-400">اضغط على &quot;متابعة مع Apple&quot;</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">سجّل دخولك بحساب Apple</p>
                  <p className="text-sm text-neutral-400">استخدم نفس حساب Apple الذي سجلت به</p>
                  <p className="text-sm text-green-500 mt-1" dir="ltr">{email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">حمّل التطبيق</p>
                  <p className="text-sm text-neutral-400">من App Store أو Google Play</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">تحقق من بريدك</p>
                  <p className="text-sm text-neutral-400">أرسلنا كلمة المرور المؤقتة إلى:</p>
                  <p className="text-sm text-green-500 mt-1" dir="ltr">{email}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">سجّل دخولك</p>
                  <p className="text-sm text-neutral-400">استخدم البريد وكلمة المرور المؤقتة</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Store Buttons */}
        <div className="flex gap-3 justify-center mb-6">
          <a
            href="https://apps.apple.com/sa/app/vega-power/id6740749036"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-right">
              <div className="text-[10px] text-neutral-400">Download on the</div>
              <div className="text-sm font-semibold">App Store</div>
            </div>
          </a>
          
          <a
            href="https://play.google.com/store/apps/details?id=com.vegapower.vegapowerandroid"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
            </svg>
            <div className="text-right">
              <div className="text-[10px] text-neutral-400">GET IT ON</div>
              <div className="text-sm font-semibold">Google Play</div>
            </div>
          </a>
        </div>

        <p className="text-xs text-neutral-500">
          لم تستلم الإيميل؟ تحقق من مجلد السبام أو تواصل معنا
        </p>
      </div>
    </div>
  )
}

export default function AppSuccessContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AppSuccessInner />
    </Suspense>
  )
}
