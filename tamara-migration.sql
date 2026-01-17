-- Migration: Add Tamara payment support to orders table
-- Run this in your Supabase SQL Editor

-- Add new columns for Tamara orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tamara_order_id TEXT,
ADD COLUMN IF NOT EXISTS tamara_checkout_id TEXT,
ADD COLUMN IF NOT EXISTS order_reference_id TEXT;

-- Create index for faster Tamara order lookups
CREATE INDEX IF NOT EXISTS idx_orders_tamara_order_id ON orders(tamara_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference_id ON orders(order_reference_id);

-- Add unique constraint on order_reference_id (optional, prevents duplicates)
-- ALTER TABLE orders ADD CONSTRAINT unique_order_reference_id UNIQUE (order_reference_id);
