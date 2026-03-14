-- Abandoned Checkouts table for email recovery automation
-- Run this migration in Supabase SQL editor

CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'monthly',
  amount DECIMAL(10, 2),
  session_id TEXT,
  consumer_id TEXT,
  converted BOOLEAN DEFAULT false,
  recovery_email_sent BOOLEAN DEFAULT false,
  recovery_email_sent_at TIMESTAMP WITH TIME ZONE,
  discount_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_email ON abandoned_checkouts (email);
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_converted ON abandoned_checkouts (converted);
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_recovery_sent ON abandoned_checkouts (recovery_email_sent);
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_created_at ON abandoned_checkouts (created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_session_id ON abandoned_checkouts (session_id);

-- Composite index for the cron query (unconverted + not emailed + older than 15 min)
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_pending
  ON abandoned_checkouts (converted, recovery_email_sent, created_at)
  WHERE converted = false AND recovery_email_sent = false;
