-- Supabase Schema for Single-Tenant Digital Product Store
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Product table (single row)
CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'My Digital Product',
  description TEXT NOT NULL DEFAULT 'Product description goes here...',
  price_sar DECIMAL(10, 2) NOT NULL DEFAULT 99.00,
  delivery_url TEXT NOT NULL DEFAULT '',
  profile_image_url TEXT,
  product_image_url TEXT,
  brand_name TEXT NOT NULL DEFAULT 'Your Brand',
  bio TEXT NOT NULL DEFAULT 'Your bio goes here...',
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_blocks TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_email TEXT NOT NULL,
  amount_sar DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending')),
  moyasar_payment_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('page_view', 'buy_click', 'purchase')),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial product row
INSERT INTO product (
  title,
  description,
  price_sar,
  delivery_url,
  brand_name,
  bio,
  testimonials,
  faqs,
  social_links
) VALUES (
  'Premium Digital Guide',
  '## What You''ll Get\n\nThis comprehensive guide includes:\n\n- **Step-by-step tutorials**\n- **Exclusive templates**\n- **Bonus resources**\n\nPerfect for beginners and professionals alike.',
  149.00,
  '',
  'Digital Creator',
  'Helping you achieve your goals with premium digital resources.',
  '[{"id": "1", "name": "Ahmed K.", "text": "This product exceeded my expectations. Highly recommended!"}, {"id": "2", "name": "Sara M.", "text": "Worth every riyal. The quality is outstanding."}]'::jsonb,
  '[{"id": "1", "question": "How do I access my purchase?", "answer": "After payment, you''ll receive instant access via the success page and email."}, {"id": "2", "question": "Is there a refund policy?", "answer": "Due to the digital nature of this product, all sales are final."}]'::jsonb,
  '[{"id": "1", "platform": "twitter", "url": "https://twitter.com"}, {"id": "2", "platform": "instagram", "url": "https://instagram.com"}]'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_email ON orders(buyer_email);
CREATE INDEX idx_orders_payment_id ON orders(moyasar_payment_id);
CREATE INDEX idx_analytics_type ON analytics_events(type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
CREATE TRIGGER product_updated_at
  BEFORE UPDATE ON product
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read access to product
CREATE POLICY "Public can read product" ON product
  FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access to product" ON product
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to analytics" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

-- Allow anonymous insert for analytics (page views, clicks)
CREATE POLICY "Anonymous can insert analytics" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET FOR IMAGE UPLOADS
-- ============================================
-- Run this in a separate SQL query after creating the tables

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow service role to upload images
CREATE POLICY "Service role can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Allow service role to update images
CREATE POLICY "Service role can update images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

-- Allow service role to delete images
CREATE POLICY "Service role can delete images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
