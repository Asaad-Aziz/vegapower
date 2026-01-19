import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const supabase = createServerClient()

    const [productsResult, storeSettingsResult, ordersResult, analyticsResult] = await Promise.all([
      supabase.from('product').select('*'),
      supabase.from('store_settings').select('*').limit(1).single(),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('analytics_events').select('*'),
    ])

    return {
      products: productsResult.data || [],
      storeSettings: storeSettingsResult.data || null,
      orders: ordersResult.data || [],
      analytics: analyticsResult.data || [],
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    return { products: [], storeSettings: null, orders: [], analytics: [] }
  }
}

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  const { products, storeSettings, orders, analytics } = await getData()

  return <AdminDashboard products={products} storeSettings={storeSettings} orders={orders} analytics={analytics} />
}
