'use client'

import { useState } from 'react'
import type { Product, StoreSettings } from '@/types/database'
import LandingPage from './LandingPage'
import StorePage from './StorePage'

interface StoreWrapperProps {
  products: Product[]
  storeSettings?: StoreSettings | null
}

export default function StoreWrapper({ products, storeSettings }: StoreWrapperProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // If a product is selected from the landing, show its detail page
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-vp-cream">
        <button
          onClick={() => setSelectedProduct(null)}
          className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-vp-navy hover:bg-white border border-vp-navy/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          الرئيسية
        </button>
        <StorePage product={selectedProduct} storeSettings={storeSettings} />
      </div>
    )
  }

  // Default: show landing page (hero, programs, app CTA, compact products)
  return (
    <LandingPage
      products={products}
      storeSettings={storeSettings}
      onSelectProduct={setSelectedProduct}
    />
  )
}
