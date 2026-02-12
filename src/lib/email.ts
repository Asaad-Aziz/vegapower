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
