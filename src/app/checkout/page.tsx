import { createServerClient } from '@/lib/supabase'
import CheckoutForm from '@/components/CheckoutForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getProduct() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('product')
      .select('id, title, price_sar')
      .single()

    if (error) {
      console.error('Failed to fetch product:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Database connection error:', error)
    return null
  }
}

export default async function CheckoutPage() {
  const product = await getProduct()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
          <p className="text-muted">Unable to load product details.</p>
        </div>
      </div>
    )
  }

  return <CheckoutForm product={product} />
}
