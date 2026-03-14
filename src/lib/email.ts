import { Resend } from 'resend'

// Lazy initialization to avoid build-time errors
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

interface SendPurchaseEmailParams {
  to: string
  productTitle: string
  deliveryUrl: string
  amount: number
}

interface SendAbandonedCartEmailParams {
  to: string
  plan: string
  discountCode: string
  discountPercent: number
  originalPrice: number
  discountedPrice: number
}

export async function sendPurchaseEmail({
  to,
  productTitle,
  deliveryUrl,
  amount,
}: SendPurchaseEmailParams): Promise<boolean> {
  try {
    const resend = getResend()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Vega Power <noreply@vegapowerstore.com>'
    
    console.log('Sending email to:', to, 'from:', fromEmail)
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'طلبك جاهز للتحميل - Vega Power',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px; direction: rtl;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.06);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #262626 0%, #404040 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">✓</span>
                </div>
                <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0;">شكراً لك على الشراء! 🎉</h1>
              </div>
              
              <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #737373; font-size: 14px;">المنتج</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${productTitle}</p>
                <p style="margin: 16px 0 0; color: #737373; font-size: 14px;">المبلغ المدفوع</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${amount.toFixed(2)} ر.س</p>
              </div>
              
              <a href="${deliveryUrl}" style="display: block; background: linear-gradient(135deg, #262626 0%, #404040 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: 500; font-size: 16px; margin-bottom: 24px;">
                ⬇️ تحميل المنتج
              </a>
              
              <p style="color: #737373; font-size: 14px; line-height: 1.8; margin: 0; text-align: center;">
                إذا واجهت أي مشكلة أو لديك استفسار، يمكنك الرد على هذه الرسالة.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Vega Power Store
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('Email send result:', { data, error })

    if (error) {
      console.error('Failed to send email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendAbandonedCartEmail({
  to,
  plan,
  discountCode,
  discountPercent,
  originalPrice,
  discountedPrice,
}: SendAbandonedCartEmailParams): Promise<boolean> {
  try {
    const resend = getResend()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Vega Power <noreply@vegapowerstore.com>'
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vegapowerstore.com').replace(/\/+$/, '')

    const planNames: Record<string, string> = {
      monthly: 'الاشتراك الشهري',
      quarterly: 'اشتراك 3 أشهر',
      yearly: 'الاشتراك السنوي',
    }
    const planName = planNames[plan] || planNames.monthly

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `خصم ${discountPercent}% بانتظارك - أكمل اشتراكك في Vega Power`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px; direction: rtl;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.06);">

              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #262626 0%, #404040 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">%</span>
                </div>
                <h1 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 8px 0;">عرض خاص لك!</h1>
                <p style="color: #737373; font-size: 15px; margin: 0;">لاحظنا إنك ما كمّلت اشتراكك، جهزنا لك خصم حصري</p>
              </div>

              <div style="background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center; border: 2px dashed #22c55e;">
                <p style="margin: 0 0 8px; color: #166534; font-size: 13px; font-weight: 500;">كود الخصم الخاص بك</p>
                <div style="background: #fff; border-radius: 8px; padding: 12px 20px; display: inline-block; margin-bottom: 8px;">
                  <p style="margin: 0; color: #1a1a1a; font-size: 36px; font-weight: 700; font-family: monospace; letter-spacing: 6px;" dir="ltr">${discountCode}</p>
                </div>
                <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: 600;">خصم ${discountPercent}% على ${planName}</p>
              </div>

              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 14px; font-weight: 600; text-align: center;">الشهري</p>
                <div style="text-align: center; margin-bottom: 4px;">
                  <span style="color: #9ca3af; font-size: 15px; text-decoration: line-through;">${originalPrice} ر.س</span>
                </div>
                <div style="text-align: center;">
                  <span style="color: #059669; font-size: 26px; font-weight: 700;">${discountedPrice} ر.س</span>
                  <span style="color: #059669; font-size: 13px; font-weight: 500;"> / شهر</span>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #f59e0b;">
                <p style="margin: 0 0 4px; color: #92400e; font-size: 14px; font-weight: 600; text-align: center;">السنوي - أفضل قيمة</p>
                <p style="margin: 0 0 8px; color: #b45309; font-size: 12px; text-align: center;">خصم 60% + كود ${discountCode} = وفّر أكثر!</p>
                <div style="text-align: center; margin-bottom: 4px;">
                  <span style="color: #9ca3af; font-size: 15px; text-decoration: line-through;">540 ر.س</span>
                  <span style="color: #9ca3af; font-size: 13px;"> ← </span>
                  <span style="color: #b45309; font-size: 15px; text-decoration: line-through;">216 ر.س</span>
                </div>
                <div style="text-align: center;">
                  <span style="color: #d97706; font-size: 30px; font-weight: 700;">173 ر.س</span>
                  <span style="color: #d97706; font-size: 13px; font-weight: 500;"> / سنة</span>
                </div>
                <p style="margin: 8px 0 0; color: #92400e; font-size: 12px; text-align: center;">يعني أقل من 15 ر.س بالشهر!</p>
              </div>

              <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 12px; color: #374151; font-size: 15px; font-weight: 600;">كيف تستخدم الكود؟</p>
                <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px; line-height: 1.8;">١. افتح تطبيق Vega Power</p>
                <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px; line-height: 1.8;">٢. أكمل خطوات التسجيل</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.8;">٣. أدخل الكود <strong dir="ltr" style="color: #1a1a1a;">${discountCode}</strong> عند الدفع</p>
              </div>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.8; margin: 0; text-align: center;">
                هذا العرض محدود - لا تفوّت الفرصة
              </p>

              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Vega Power Store
              </p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Failed to send abandoned cart email:', error)
      return false
    }

    console.log('Abandoned cart email sent to:', to, 'result:', data)
    return true
  } catch (error) {
    console.error('Abandoned cart email error:', error)
    return false
  }
}
