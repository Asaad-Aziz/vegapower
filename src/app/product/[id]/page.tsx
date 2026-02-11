import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProductPageClient from './ProductPageClient'

export const dynamic = 'force-dynamic'

async function getData(id: string) {
  const supabase = createServerClient()
  const [productResult, storeSettingsResult] = await Promise.all([
    supabase.from('product').select('*').eq('id', id).single(),
    supabase.from('store_settings').select('*').limit(1).single(),
  ])
  return {
    product: productResult.data,
    storeSettings: storeSettingsResult.data ?? null,
    error: productResult.error,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { product, storeSettings, error } = await getData(id)

  if (error || !product) {
    notFound()
  }

  return (
    <ProductPageClient
      product={product}
      storeSettings={storeSettings}
    />
  )
}
