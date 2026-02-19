'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, Order, AnalyticsEvent, StoreSettings, FitnessGoal, AffiliateCode, AffiliatePayout } from '@/types/database'
import ProductEditor from './ProductEditor'
import StoreSettingsEditor from './StoreSettingsEditor'
import OrdersTable from './OrdersTable'
import AnalyticsPanel from './AnalyticsPanel'
import AffiliatesPanel from './AffiliatesPanel'

interface AdminDashboardProps {
  products: Product[]
  storeSettings: StoreSettings | null
  orders: Order[]
  analytics: AnalyticsEvent[]
  affiliates: AffiliateCode[]
  affiliatePayouts: AffiliatePayout[]
  affiliateOrders: { discount_code: string | null; amount_sar: number; status: string }[]
}

type Tab = 'products' | 'store' | 'orders' | 'analytics' | 'affiliates'

const goalLabels: Record<FitnessGoal, string> = {
  fat_loss: 'خسارة دهون',
  muscle_gain: 'زيادة عضل',
  body_toning: 'شد الجسم',
  all: 'الكل',
}

export default function AdminDashboard({ products, storeSettings, orders, analytics, affiliates, affiliatePayouts, affiliateOrders }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsCreatingNew(false)
  }

  const handleCreateNew = () => {
    setEditingProduct(null)
    setIsCreatingNew(true)
  }

  const handleBack = () => {
    setEditingProduct(null)
    setIsCreatingNew(false)
    router.refresh()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'products', label: 'Products' },
    { id: 'store', label: 'Store Settings' },
    { id: 'orders', label: 'Orders' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'affiliates', label: 'Affiliates' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              View Store →
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setEditingProduct(null)
                  setIsCreatingNew(false)
                }}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'products' && !editingProduct && !isCreatingNew && (
          <div className="space-y-6">
            {/* Add New Product Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">All Products ({products.length})</h2>
              <button onClick={handleCreateNew} className="btn-primary">
                + Add New Product
              </button>
            </div>

            {/* Products List */}
            {products.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p className="text-neutral-500 mb-4">No products yet. Create your first product!</p>
                <button onClick={handleCreateNew} className="btn-primary">
                  + Add New Product
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="glass-card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {product.product_image_url && (
                        <img
                          src={product.product_image_url}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{product.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                          <span>{product.price_sar} ر.س</span>
                          {product.goal && (
                            <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-xs">
                              {goalLabels[product.goal]}
                            </span>
                          )}
                          {product.times_bought > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                              {product.times_bought} مبيعات
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (editingProduct || isCreatingNew) && (
          <div>
            <button
              onClick={handleBack}
              className="mb-4 text-sm text-neutral-500 hover:text-foreground transition-colors flex items-center gap-1"
            >
              ← Back to Products
            </button>
            <ProductEditor
              product={editingProduct}
              isNew={isCreatingNew}
              onSaved={handleBack}
            />
          </div>
        )}

        {activeTab === 'store' && <StoreSettingsEditor settings={storeSettings} />}
        {activeTab === 'orders' && <OrdersTable orders={orders} />}
        {activeTab === 'analytics' && <AnalyticsPanel events={analytics} />}
        {activeTab === 'affiliates' && (
          <AffiliatesPanel
            affiliates={affiliates}
            payouts={affiliatePayouts}
            affiliateOrders={affiliateOrders}
          />
        )}
      </main>
    </div>
  )
}
