import { createServerClient } from '@/lib/supabase'
import StoreWrapper from '@/components/StoreWrapper'

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

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

  return <StoreWrapper products={products} storeSettings={storeSettings} />
}
