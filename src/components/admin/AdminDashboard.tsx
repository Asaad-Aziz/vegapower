'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product, Order, AnalyticsEvent, Testimonial, FAQ, SocialLink } from '@/types/database'
import ProductEditor from './ProductEditor'
import OrdersTable from './OrdersTable'
import AnalyticsPanel from './AnalyticsPanel'

interface AdminDashboardProps {
  product: Product
  orders: Order[]
  analytics: AnalyticsEvent[]
}

type Tab = 'product' | 'orders' | 'analytics'

export default function AdminDashboard({ product, orders, analytics }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('product')
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'product', label: 'Product' },
    { id: 'orders', label: 'Orders' },
    { id: 'analytics', label: 'Analytics' },
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
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              View Store →
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-foreground transition-colors"
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
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-muted hover:text-neutral-600'
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
        {activeTab === 'product' && (
          <ProductEditor
            product={product}
            testimonials={product.testimonials as Testimonial[]}
            faqs={product.faqs as FAQ[]}
            socialLinks={product.social_links as SocialLink[]}
          />
        )}
        {activeTab === 'orders' && <OrdersTable orders={orders} />}
        {activeTab === 'analytics' && <AnalyticsPanel events={analytics} />}
      </main>
    </div>
  )
}

