import { createServerClient } from '@/lib/supabase'
import StoreWrapper from '@/components/StoreWrapper'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getData() {
  try {
    const supabase = createServerClient()
    
    const [productsResult, storeSettingsResult] = await Promise.all([
      supabase.from('product').select('*'),
      supabase.from('store_settings').select('*').limit(1).single(),
    ])

    return {
      products: productsResult.data || [],
      storeSettings: storeSettingsResult.data || null,
    }
  } catch (error) {
    console.error('Database connection error:', error)
    return { products: [], storeSettings: null }
  }
}

export default async function Home() {
  const { products, storeSettings } = await getData()

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Store Not Configured</h1>
          <p className="text-muted">Please set up your database and add a product.</p>
        </div>
      </div>
    )
  }

  return <StoreWrapper products={products} storeSettings={storeSettings} />
}
