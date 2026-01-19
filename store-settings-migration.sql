-- Migration: Create store_settings table and add times_bought to product
-- Run this in Supabase SQL Editor

-- Create store_settings table for universal store data
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_name TEXT NOT NULL DEFAULT 'Vega Power',
    bio TEXT DEFAULT '',
    profile_image_url TEXT,
    testimonials JSONB DEFAULT '[]'::jsonb,
    faqs JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default store settings row if not exists
INSERT INTO store_settings (brand_name, bio)
SELECT 'Vega Power', 'مدرب لياقة معتمد'
WHERE NOT EXISTS (SELECT 1 FROM store_settings);

-- Add times_bought column to product table
ALTER TABLE product ADD COLUMN IF NOT EXISTS times_bought INTEGER DEFAULT 0;

-- Optional: Migrate existing data from first product to store_settings
-- Uncomment and run if you want to migrate existing profile data
/*
UPDATE store_settings SET
    brand_name = p.brand_name,
    bio = p.bio,
    profile_image_url = p.profile_image_url,
    testimonials = p.testimonials,
    faqs = p.faqs,
    social_links = p.social_links
FROM (SELECT * FROM product LIMIT 1) p
WHERE store_settings.id IS NOT NULL;
*/

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to store_settings
CREATE POLICY "Allow public read access to store_settings" ON store_settings
    FOR SELECT USING (true);

-- Allow authenticated users to update store_settings (for admin)
CREATE POLICY "Allow authenticated update to store_settings" ON store_settings
    FOR UPDATE USING (true);
