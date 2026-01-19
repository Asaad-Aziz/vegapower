-- Migration: Create app_subscriptions table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS app_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    goal TEXT,
    experience TEXT,
    schedule TEXT,
    plan TEXT NOT NULL, -- 'monthly' or 'yearly'
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_subscriptions_email ON app_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_app_subscriptions_payment_id ON app_subscriptions(payment_id);

-- Enable RLS
ALTER TABLE app_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for the API)
CREATE POLICY "Allow insert to app_subscriptions" ON app_subscriptions
    FOR INSERT WITH CHECK (true);

-- Allow public select for verification
CREATE POLICY "Allow select from app_subscriptions" ON app_subscriptions
    FOR SELECT USING (true);
