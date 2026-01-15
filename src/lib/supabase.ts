import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization for client-side
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Server-side client with service role for admin operations
export function createServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Supabase server credentials not configured')
  }
  
  return createClient(url, serviceKey)
}
