-- Affiliate Program Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- AFFILIATE CODES TABLE
-- ============================================
CREATE TABLE affiliate_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  affiliate_name TEXT NOT NULL,
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10,
  access_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  streampay_coupon_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, add the column:
-- ALTER TABLE affiliate_codes ADD COLUMN IF NOT EXISTS streampay_coupon_id TEXT;

-- ============================================
-- AFFILIATE PAYOUTS TABLE
-- ============================================
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_code_id UUID NOT NULL REFERENCES affiliate_codes(id) ON DELETE CASCADE,
  amount_sar DECIMAL(10, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD DISCOUNT CODE TRACKING TO ORDERS
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX idx_affiliate_codes_token ON affiliate_codes(access_token);
CREATE INDEX idx_affiliate_codes_active ON affiliate_codes(is_active);
CREATE INDEX idx_affiliate_payouts_code_id ON affiliate_payouts(affiliate_code_id);
CREATE INDEX idx_orders_discount_code ON orders(discount_code);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE TRIGGER affiliate_codes_updated_at
  BEFORE UPDATE ON affiliate_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE affiliate_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to affiliate_codes" ON affiliate_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to affiliate_payouts" ON affiliate_payouts
  FOR ALL USING (auth.role() = 'service_role');

-- Public read access to active affiliate codes (for validation during checkout)
CREATE POLICY "Public can read active affiliate codes" ON affiliate_codes
  FOR SELECT USING (is_active = true);
