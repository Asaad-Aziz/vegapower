-- Fix Security Definer View issue
-- Run this in Supabase SQL Editor

-- Option 1: Drop the view if you don't need it
DROP VIEW IF EXISTS public.order_analytics;

-- OR Option 2: If you need the view, recreate it with SECURITY INVOKER
-- First check what the view does:
-- SELECT pg_get_viewdef('public.order_analytics', true);

-- Then recreate it without SECURITY DEFINER (uses SECURITY INVOKER by default)
-- Example:
-- CREATE OR REPLACE VIEW public.order_analytics AS
--   SELECT ... (your query here)
-- ;
