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
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>('fat_loss')

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

      {/* Social Proof Stats */}
      <section className="px-4 mb-6 animate-fade-in">
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            {/* Main Stat */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-600 mb-1">+28,900</div>
              <p className="text-sm text-neutral-600">شخص بدأ رياضته مع برامجنا</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-white/60 rounded-xl">
                <div className="text-xl font-bold text-neutral-800">98%</div>
                <p className="text-[10px] text-muted">نسبة الرضا</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-xl">
                <div className="text-xl font-bold text-neutral-800">4.9</div>
                <p className="text-[10px] text-muted">تقييم العملاء</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-xl">
                <div className="text-xl font-bold text-neutral-800">1000+</div>
                <p className="text-[10px] text-muted">تقييم إيجابي</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                توصيل فوري
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                دعم متواصل
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                نتائج مضمونة
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="px-4 mb-6 animate-fade-in">
        <div className="max-w-lg mx-auto">
          <h2 className="text-lg font-semibold mb-3 text-center">ماذا ستحصل؟ 📦</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <div className="text-2xl mb-1">📋</div>
              <h4 className="font-medium text-sm mb-0.5">جدول تمارين</h4>
              <p className="text-[10px] text-muted">مفصّل لكل يوم</p>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-2xl mb-1">🍽️</div>
              <h4 className="font-medium text-sm mb-0.5">نظام غذائي</h4>
              <p className="text-[10px] text-muted">سعرات محسوبة</p>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-2xl mb-1">🎥</div>
              <h4 className="font-medium text-sm mb-0.5">فيديوهات</h4>
              <p className="text-[10px] text-muted">شرح كل تمرين</p>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-2xl mb-1">💬</div>
              <h4 className="font-medium text-sm mb-0.5">دعم مستمر</h4>
              <p className="text-[10px] text-muted">رد على استفساراتك</p>
            </div>
          </div>
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
                    <div className="relative w-full overflow-hidden">
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                        style={{ width: '100%', height: 'auto' }}
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
                    {/* Purchases Badge */}
                    {product.times_bought > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 mb-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span>{product.times_bought}+ عملية شراء</span>
                      </div>
                    )}

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
