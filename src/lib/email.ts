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
    
    const { error } = await resend.emails.send({
      from: 'Digital Store <noreply@yourdomain.com>',
      to: [to],
      subject: 'Your purchase is ready',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa; margin: 0; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid rgba(0,0,0,0.06);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: #262626; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px;">✓</span>
                </div>
                <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin: 0;">Thank you for your purchase!</h1>
              </div>
              
              <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #737373; font-size: 14px;">Product</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">${productTitle}</p>
                <p style="margin: 16px 0 0; color: #737373; font-size: 14px;">Amount paid</p>
                <p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 500;">SAR ${amount.toFixed(2)}</p>
              </div>
              
              <a href="${deliveryUrl}" style="display: block; background: #262626; color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; text-align: center; font-weight: 500; font-size: 16px; margin-bottom: 24px;">
                Access Your Product
              </a>
              
              <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                If you have any questions or need support, simply reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
    })

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
