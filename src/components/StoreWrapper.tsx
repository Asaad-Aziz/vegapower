'use client'

import type { Product, StoreSettings } from '@/types/database'
import LandingPage from './LandingPage'

interface StoreWrapperProps {
  products: Product[]
  storeSettings?: StoreSettings | null
}

export default function StoreWrapper({ products, storeSettings }: StoreWrapperProps) {
  return (
    <LandingPage
      products={products}
      storeSettings={storeSettings}
    />
  )
}
