import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const supabase = createServerClient()

    const [productsResult, storeSettingsResult, ordersResult, analyticsResult, affiliatesResult, affiliatePayoutsResult, affiliateOrdersResult] = await Promise.all([
      supabase.from('product').select('*'),
      supabase.from('store_settings').select('*').limit(1).single(),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('analytics_events').select('*'),
      supabase.from('affiliate_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('affiliate_payouts').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('discount_code, amount_sar, status').eq('status', 'paid'),
    ])

    return {
      products: productsResult.data || [],
      storeSettings: storeSettingsResult.data || null,
      orders: ordersResult.data || [],
      analytics: analyticsResult.data || [],
      affiliates: affiliatesResult.data || [],
      affiliatePayouts: affiliatePayoutsResult.data || [],
      affiliateOrders: affiliateOrdersResult.data || [],
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    return { products: [], storeSettings: null, orders: [], analytics: [], affiliates: [], affiliatePayouts: [], affiliateOrders: [] }
  }
}

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  const { products, storeSettings, orders, analytics, affiliates, affiliatePayouts, affiliateOrders } = await getData()

  return (
    <AdminDashboard
      products={products}
      storeSettings={storeSettings}
      orders={orders}
      analytics={analytics}
      affiliates={affiliates}
      affiliatePayouts={affiliatePayouts}
      affiliateOrders={affiliateOrders}
    />
  )
}
