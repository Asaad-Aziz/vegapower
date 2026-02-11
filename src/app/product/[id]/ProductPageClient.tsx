'use client'

import type { Product, StoreSettings } from '@/types/database'
import SiteHeader from '@/components/SiteHeader'
import StorePage from '@/components/StorePage'

interface ProductPageClientProps {
  product: Product
  storeSettings: StoreSettings | null
}

export default function ProductPageClient({ product, storeSettings }: ProductPageClientProps) {
  const brandName = storeSettings?.brand_name || product.brand_name || 'Vega Power'
  const profileImageUrl = storeSettings?.profile_image_url || product.profile_image_url || null

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <SiteHeader
        brandName={brandName}
        profileImageUrl={profileImageUrl}
        backHref="/"
      />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <StorePage product={product} storeSettings={storeSettings} />
      </main>
    </div>
  )
}
