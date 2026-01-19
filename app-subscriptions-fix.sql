-- Fix app_subscriptions table - make old columns nullable
-- Run this in Supabase SQL Editor

-- Make name nullable (was required in old schema)
ALTER TABLE app_subscriptions ALTER COLUMN name DROP NOT NULL;

-- Make phone nullable
ALTER TABLE app_subscriptions ALTER COLUMN phone DROP NOT NULL;

-- Make goal nullable
ALTER TABLE app_subscriptions ALTER COLUMN goal DROP NOT NULL;

-- Make experience nullable  
ALTER TABLE app_subscriptions ALTER COLUMN experience DROP NOT NULL;

-- Make schedule nullable
ALTER TABLE app_subscriptions ALTER COLUMN schedule DROP NOT NULL;
