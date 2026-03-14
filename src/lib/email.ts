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
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">🔥</span>
                </div>
                <h1 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 8px 0;">لا تفوّت الفرصة!</h1>
                <p style="color: #737373; font-size: 15px; margin: 0;">لاحظنا إنك ما كمّلت اشتراكك</p>
              </div>

              <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center; border: 2px dashed #f59e0b;">
                <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: 500;">كود الخصم الخاص بك</p>
                <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 32px; font-weight: 700; font-family: monospace; letter-spacing: 4px;" dir="ltr">${discountCode}</p>
                <p style="margin: 0; color: #b45309; font-size: 14px; font-weight: 600;">خصم ${discountPercent}% على ${planName}</p>
              </div>

              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="color: #737373; font-size: 14px;">${planName}</span>
                  <span style="color: #9ca3af; font-size: 14px; text-decoration: line-through;">${originalPrice} ر.س</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: #059669; font-size: 16px; font-weight: 600;">السعر بعد الخصم</span>
                  <span style="color: #059669; font-size: 20px; font-weight: 700;">${discountedPrice} ر.س</span>
                </div>
              </div>

              <a href="${baseUrl}/app?discount=${encodeURIComponent(discountCode)}" style="display: block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
                أكمل اشتراكك الآن بخصم ${discountPercent}%
              </a>

              <p style="color: #9ca3af; font-size: 13px; line-height: 1.8; margin: 0; text-align: center;">
                هذا العرض محدود - استخدم الكود عند الدفع للحصول على الخصم
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
