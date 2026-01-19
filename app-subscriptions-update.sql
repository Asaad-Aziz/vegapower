-- Run this to add missing columns to the existing app_subscriptions table

-- Add firebase_uid column
ALTER TABLE app_subscriptions ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- Add user_data JSONB column if it doesn't exist
ALTER TABLE app_subscriptions ADD COLUMN IF NOT EXISTS user_data JSONB;

-- Create index for firebase_uid
CREATE INDEX IF NOT EXISTS idx_app_subscriptions_firebase_uid ON app_subscriptions(firebase_uid);

-- If you have old columns that are no longer needed, you can drop them:
-- ALTER TABLE app_subscriptions DROP COLUMN IF EXISTS name;
-- ALTER TABLE app_subscriptions DROP COLUMN IF EXISTS phone;
-- ALTER TABLE app_subscriptions DROP COLUMN IF EXISTS goal;
-- ALTER TABLE app_subscriptions DROP COLUMN IF EXISTS experience;
-- ALTER TABLE app_subscriptions DROP COLUMN IF EXISTS schedule;
