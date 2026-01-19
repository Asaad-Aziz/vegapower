'use client'

import { useState } from 'react'
import type { Product } from '@/types/database'
import ProductCatalog from './ProductCatalog'
import StorePage from './StorePage'

interface StoreWrapperProps {
  products: Product[]
}

export default function StoreWrapper({ products }: StoreWrapperProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Get brand info from first product (assuming same brand for all)
  const brandName = products[0]?.brand_name || 'المتجر'
  const bio = products[0]?.bio || ''
  const profileImageUrl = products[0]?.profile_image_url || null

  // If only one product, show it directly
  if (products.length === 1) {
    return <StorePage product={products[0]} />
  }

  // If a product is selected, show its detail page
  if (selectedProduct) {
    return (
      <div>
        {/* Back Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium hover:bg-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          جميع البرامج
        </button>
        <StorePage product={selectedProduct} />
      </div>
    )
  }

  // Show product catalog
  return (
    <ProductCatalog
      products={products}
      onSelectProduct={setSelectedProduct}
      brandName={brandName}
      bio={bio}
      profileImageUrl={profileImageUrl}
    />
  )
}
