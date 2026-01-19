-- Migration: Add goal field to product table for fitness program categorization
-- Run this in your Supabase SQL Editor

-- Add goal column to product table
ALTER TABLE product 
ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'all';

-- Create an index for faster filtering by goal
CREATE INDEX IF NOT EXISTS idx_product_goal ON product(goal);

-- Optional: Update existing products with a default goal
-- UPDATE product SET goal = 'fat_loss' WHERE id = 'your-product-id';
-- UPDATE product SET goal = 'muscle_gain' WHERE id = 'another-product-id';
-- UPDATE product SET goal = 'body_toning' WHERE id = 'third-product-id';

-- Valid goal values:
-- 'all' - Shows in all categories
-- 'fat_loss' - خسارة دهون
-- 'muscle_gain' - زيادة عضل  
-- 'body_toning' - شد الجسم
