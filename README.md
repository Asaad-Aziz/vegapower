# Digital Product Store

A clean, Stan.stores-style single-page store for selling ONE digital product.

## Features

- **Public Store Page**: Mobile-first, clean design with product details, testimonials, FAQ
- **Secure Payments**: Moyasar integration (SAR currency)
- **Instant Delivery**: Immediate access after payment verification
- **Email Delivery**: Automatic email with access link (via Resend)
- **Admin Dashboard**: Edit product, view orders, track analytics

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Payments**: Moyasar
- **Email**: Resend

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and keys from Settings > API

**Important: Storage Setup for Image Uploads**

The SQL schema includes storage bucket creation, but you may also need to:
1. Go to Storage in your Supabase dashboard
2. Verify the "images" bucket exists and is set to **Public**
3. If not created automatically, create it manually with public access

### 3. Set Up Moyasar

1. Create an account at [moyasar.com](https://moyasar.com)
2. Get your API keys from the dashboard
3. Set your callback URLs in Moyasar dashboard:
   - Success: `https://yourdomain.com/success`
   - Failure: `https://yourdomain.com/cancel`

### 4. Set Up Resend

1. Create an account at [resend.com](https://resend.com)
2. Verify your domain
3. Get your API key
4. Update the "from" email in `src/lib/email.ts`

### 5. Configure Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Moyasar
MOYASAR_API_KEY=sk_test_xxx (or sk_live_xxx)
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_xxx (or pk_live_xxx)

# Resend
RESEND_API_KEY=re_xxx

# Admin Password (choose a strong password)
ADMIN_PASSWORD=your-secure-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Public store page |
| `/checkout` | Payment page |
| `/success` | Post-payment success |
| `/cancel` | Payment cancelled |
| `/admin` | Admin dashboard |
| `/admin/login` | Admin login |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/payments/verify` | GET | Verify Moyasar payment |
| `/api/moyasar/webhook` | POST | Moyasar webhook backup |
| `/api/analytics` | POST | Track events |
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/product` | PUT | Update product |

## Payment Flow

1. Buyer enters email on checkout page
2. Moyasar payment form loads
3. Payment processed by Moyasar
4. Redirect to `/success?id=payment_id`
5. Server verifies payment with Moyasar API
6. If valid: order created, email sent, delivery URL shown
7. If invalid: error shown

## Admin Dashboard

Access at `/admin` (requires password set in `.env.local`)

Features:
- **Upload images** for profile and product (stored in Supabase Storage)
- Edit product details (title, description, price, delivery URL)
- Manage testimonials and FAQ
- View all orders
- Export buyers to CSV
- View analytics (page views, clicks, conversions)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the production version:

```bash
npm run build
npm start
```

## Security Notes

- Payment verification always happens server-side
- Payment IDs are checked for uniqueness (prevents replay attacks)
- Admin routes are protected by session cookie
- Service role key is never exposed to client

## Customization

### Update Email Template

Edit `src/lib/email.ts` to customize the purchase confirmation email.

### Update Store Design

- Global styles: `src/app/globals.css`
- Store layout: `src/components/StorePage.tsx`

### Update Moyasar Payment Methods

Edit `src/components/CheckoutForm.tsx` - modify the `methods` array in Moyasar config.

## License

MIT
