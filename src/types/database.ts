// Fitness goal categories
export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'body_toning' | 'all'

// Store settings (universal across all products)
export interface StoreSettings {
  id: string
  brand_name: string
  bio: string
  profile_image_url: string | null
  testimonials: Testimonial[]
  faqs: FAQ[]
  social_links: SocialLink[]
  updated_at: string
}

// Product data shape
export interface Product {
  id: string
  title: string
  description: string
  price_sar: number
  before_price_sar: number | null
  delivery_url: string
  product_image_url: string | null
  goal?: FitnessGoal // Fitness goal category
  times_bought: number // Number of times this program has been purchased
  custom_blocks: string | null
  updated_at: string
  // Legacy fields (kept for backward compatibility during migration)
  profile_image_url?: string | null
  brand_name?: string
  bio?: string
  testimonials?: Testimonial[]
  faqs?: FAQ[]
  social_links?: SocialLink[]
}

export interface Testimonial {
  id: string
  name: string
  text: string
  avatar?: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface SocialLink {
  id: string
  platform: string
  url: string
}

// Order data shape
export interface Order {
  id: string
  buyer_email: string
  amount_sar: number
  status: 'paid' | 'failed' | 'pending'
  moyasar_payment_id: string
  tamara_order_id?: string
  tamara_checkout_id?: string
  order_reference_id?: string
  created_at: string
}

// Analytics event data shape
export interface AnalyticsEvent {
  id: string
  type: 'page_view' | 'buy_click' | 'purchase'
  session_id: string
  created_at: string
}
