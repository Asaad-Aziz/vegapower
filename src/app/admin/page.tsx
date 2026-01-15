import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'
import AdminDashboard from '@/components/admin/AdminDashboard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const supabase = createServerClient()

    const [productResult, ordersResult, analyticsResult] = await Promise.all([
      supabase.from('product').select('*').single(),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('analytics_events').select('*'),
    ])

    return {
      product: productResult.data,
      orders: ordersResult.data || [],
      analytics: analyticsResult.data || [],
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    return { product: null, orders: [], analytics: [] }
  }
}

export default async function AdminPage() {
  const isAuthenticated = await isAdminAuthenticated()

  if (!isAuthenticated) {
    redirect('/admin/login')
  }

  const { product, orders, analytics } = await getData()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Product not found. Please run the database schema.</p>
      </div>
    )
  }

  return <AdminDashboard product={product} orders={orders} analytics={analytics} />
}
