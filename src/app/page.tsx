import { createServerClient } from '@/lib/supabase'
import StoreWrapper from '@/components/StoreWrapper'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getProducts() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('product')
      .select('*')

    if (error) {
      console.error('Failed to fetch products:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Database connection error:', error)
    return []
  }
}

export default async function Home() {
  const products = await getProducts()

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

  return <StoreWrapper products={products} />
}
