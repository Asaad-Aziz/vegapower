-- Migration: Add product image, before price, and storage bucket
-- Run this if you already have the tables created

-- Add product_image_url column to product table (if it doesn't exist)
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Add before_price_sar column for showing offers/discounts
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS before_price_sar DECIMAL(10, 2);

-- ============================================
-- STORAGE BUCKET FOR IMAGE UPLOADS
-- ============================================

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

