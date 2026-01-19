'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Product, FitnessGoal } from '@/types/database'

interface ProductCatalogProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
  brandName: string
  bio: string
  profileImageUrl: string | null
}

const goals: { id: FitnessGoal; label: string; emoji: string }[] = [
  { id: 'all', label: 'الكل', emoji: '🎯' },
  { id: 'fat_loss', label: 'خسارة دهون', emoji: '🔥' },
  { id: 'muscle_gain', label: 'زيادة عضل', emoji: '💪' },
  { id: 'body_toning', label: 'شد الجسم', emoji: '✨' },
]

export default function ProductCatalog({ 
  products, 
  onSelectProduct, 
  brandName, 
  bio, 
  profileImageUrl 
}: ProductCatalogProps) {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>('all')

  const filteredProducts = selectedGoal === 'all' 
    ? products 
    : products.filter(p => p.goal === selectedGoal)

  return (
    <div className="min-h-screen pb-32">
      {/* Hero Section */}
      <section className="pt-12 pb-6 px-4 animate-fade-in">
        <div className="max-w-lg mx-auto text-center">
          {/* Profile Image */}
          {profileImageUrl ? (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <Image
                src={profileImageUrl}
                alt={brandName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-3xl font-semibold text-neutral-500">
                {brandName.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Brand Name */}
          <h1 className="text-xl font-semibold mb-2">{brandName}</h1>
          
          {/* Bio */}
          <p className="text-muted text-sm leading-relaxed">{bio}</p>
        </div>
      </section>

      {/* Goal Selection Header */}
      <section className="px-4 mb-2">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-lg font-semibold mb-1">اختر هدفك 🎯</h2>
          <p className="text-sm text-muted">حدد هدفك ونوصيك بأفضل برنامج</p>
        </div>
      </section>

      {/* Floating Goal Pills */}
      <section className="sticky top-0 z-40 py-4 px-4 bg-gradient-to-b from-white via-white to-transparent">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-center gap-2 flex-wrap">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                  flex items-center gap-1.5 whitespace-nowrap
                  ${selectedGoal === goal.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:border-green-300 hover:bg-green-50'
                  }
                `}
              >
                <span>{goal.emoji}</span>
                <span>{goal.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">لا توجد برامج لهذا الهدف حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="glass-card overflow-hidden animate-fade-in cursor-pointer group hover:shadow-xl transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onSelectProduct(product)}
                >
                  {/* Product Image */}
                  {product.product_image_url && (
                    <div className="relative w-full aspect-video overflow-hidden">
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Goal Badge */}
                      {product.goal && product.goal !== 'all' && (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                          {goals.find(g => g.id === product.goal)?.emoji} {goals.find(g => g.id === product.goal)?.label}
                        </div>
                      )}
                      {/* Discount Badge */}
                      {product.before_price_sar && product.before_price_sar > product.price_sar && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-green-600 transition-colors">
                      {product.title}
                    </h3>
                    
                    {/* Short Description */}
                    <p className="text-sm text-muted line-clamp-2 mb-3">
                      {product.description.substring(0, 100)}...
                    </p>
                    
                    {/* Price Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-green-600">
                          {product.price_sar.toFixed(0)} ر.س
                        </span>
                        {product.before_price_sar && product.before_price_sar > product.price_sar && (
                          <span className="text-sm text-muted line-through">
                            {product.before_price_sar.toFixed(0)} ر.س
                          </span>
                        )}
                      </div>
                      
                      {/* View Button */}
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
                        <span>عرض التفاصيل</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results Count */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
        {filteredProducts.length} برنامج متاح
      </div>
    </div>
  )
}
