'use client'

import Image from 'next/image'
import type { Product, StoreSettings } from '@/types/database'

const APP_PATH = '/app'

interface LandingPageProps {
  products: Product[]
  storeSettings?: StoreSettings | null
  onSelectProduct: (product: Product) => void
}

export default function LandingPage({
  products,
  storeSettings,
  onSelectProduct,
}: LandingPageProps) {
  const brandName = storeSettings?.brand_name || products[0]?.brand_name || 'Vega Power'
  const profileImageUrl = storeSettings?.profile_image_url || products[0]?.profile_image_url || null

  return (
    <main className="min-h-screen bg-vp-cream text-vp-dark">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vp-beige/40 to-transparent" />
        <div className="relative max-w-2xl mx-auto text-center">
          {profileImageUrl ? (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border-2 border-vp-navy/10 shadow-lg">
              <Image
                src={profileImageUrl}
                alt={brandName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vp-beige flex items-center justify-center border border-vp-navy/10">
              <span className="text-2xl font-semibold text-vp-navy">
                {brandName.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-vp-navy tracking-tight mb-3">
            {brandName}
          </h1>
          <p className="text-lg text-muted max-w-md mx-auto">
            رياضتك أسهل بين يدك — علامة لياقة بسيطة وواضحة.
          </p>
        </div>
      </section>

      {/* Premade programs — used by thousands */}
      <section className="px-4 py-12 bg-white/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-vp-navy mb-2 text-center">
            برامج جاهزة للتحميل
          </h2>
          <p className="text-muted text-sm text-center mb-8 max-w-lg mx-auto">
            برامج تمارين وغذاء جاهزة، يستخدمها آلاف الأشخاص. حمّلها مرة واحدة واستخدمها للأبد.
          </p>
          <div className="rounded-2xl overflow-hidden border border-vp-navy/10 bg-vp-cream/50 aspect-[16/10] flex items-center justify-center">
            {/* Placeholder: replace with your image */}
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-vp-beige flex items-center justify-center">
                <svg className="w-8 h-8 text-vp-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <p className="text-sm text-muted">صورة توضيحية للبرامج الجاهزة</p>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-6 text-sm text-muted">
            <span>توصيل فوري</span>
            <span>دعم متواصل</span>
            <span>نتائج مضمونة</span>
          </div>
        </div>
      </section>

      {/* App CTA — create program, AI calories, community */}
      <section className="px-4 py-16 bg-vp-navy text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">تطبيق فيجا باور</h2>
          <p className="text-white/80 text-sm mb-10">
            صمّم برنامجك، احسب سعراتك، وانضم للمجتمع.
          </p>
          <div className="grid gap-6 sm:grid-cols-3 mb-10 text-right">
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">برنامجك الخاص</h3>
              <p className="text-white/70 text-sm">صمّم برنامج تمارينك بنفسك داخل التطبيق.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">سعراتك اليومية</h3>
              <p className="text-white/70 text-sm">احسب احتياجك من السعرات باستخدام الذكاء الاصطناعي.</p>
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">مجتمع التطبيق</h3>
              <p className="text-white/70 text-sm">انضم لمجتمع الأعضاء وتابع التحديات والدعم.</p>
            </div>
          </div>
          <a
            href={APP_PATH}
            className="inline-flex items-center justify-center gap-2 bg-white text-vp-navy font-semibold px-8 py-4 rounded-xl hover:bg-vp-cream transition-colors"
          >
            انضم من التطبيق
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Digital products — compact & clean */}
      <section className="px-4 py-14 bg-vp-cream">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-vp-navy mb-1 text-center">
            برامج رقمية جاهزة
          </h2>
          <p className="text-muted text-sm text-center mb-8">
            اختر برنامجاً، حمّله فوراً وابدأ رحلتك.
          </p>

          {products.length === 0 ? (
            <p className="text-center text-muted text-sm">لا توجد برامج متاحة حالياً.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="w-full text-right rounded-xl border border-vp-navy/10 bg-white p-4 flex gap-4 items-center hover:shadow-md hover:border-vp-navy/20 transition-all group"
                >
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-vp-beige/50">
                    {product.product_image_url ? (
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-vp-navy/50">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-vp-navy group-hover:text-vp-navy/90 truncate">
                      {product.title}
                    </h3>
                    <p className="text-muted text-xs line-clamp-2 mt-0.5">
                      {product.description.replace(/^#+\s*/m, '').substring(0, 80)}
                      {product.description.length > 80 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-vp-navy">
                        {product.price_sar.toFixed(0)} ر.س
                      </span>
                      {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                        <span className="text-xs text-muted line-through">
                          {product.before_price_sar.toFixed(0)} ر.س
                        </span>
                      )}
                      {product.times_bought > 0 && (
                        <span className="text-xs text-muted">
                          · {product.times_bought}+ عملية شراء
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-vp-navy">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted text-sm border-t border-vp-navy/10 bg-white/40">
        <p>© {new Date().getFullYear()} {brandName}</p>
      </footer>
    </main>
  )
}
