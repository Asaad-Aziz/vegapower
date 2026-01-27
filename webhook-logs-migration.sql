-- Create webhook_logs table for debugging and monitoring
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'streampay',
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'received',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at ON webhook_logs(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);

-- Comment for documentation
COMMENT ON TABLE webhook_logs IS 'Logs all incoming webhook events for debugging and monitoring';

-- Example query to see recent webhooks:
-- SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 20;

-- Example query to see failed/specific events:
-- SELECT * FROM webhook_logs WHERE event_type LIKE '%failed%' ORDER BY processed_at DESC;
