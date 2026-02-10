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
    <div className="min-h-screen bg-white text-vp-dark">
      {/* Site Header */}
      <header className="sticky top-0 z-50 border-b border-vp-navy/10 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={brandName}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-vp-navy flex items-center justify-center text-white text-sm font-bold">
                {brandName.charAt(0)}
              </div>
            )}
            <span className="font-bold text-vp-navy text-lg">{brandName}</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#programs" className="text-vp-dark/80 hover:text-vp-navy transition-colors">
              البرامج
            </a>
            <a href="#app" className="text-vp-dark/80 hover:text-vp-navy transition-colors">
              التطبيق
            </a>
            <a href="#shop" className="text-vp-dark/80 hover:text-vp-navy transition-colors">
              المتجر
            </a>
            <a
              href={APP_PATH}
              className="bg-vp-navy text-white px-4 py-2 rounded-lg hover:bg-vp-navy/90 transition-colors"
            >
              انضم من التطبيق
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-vp-cream to-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-vp-navy font-semibold text-sm uppercase tracking-wider mb-4">
                علامة لياقة بسيطة وواضحة
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-vp-dark leading-tight mb-6">
                رياضتك أسهل
                <br />
                <span className="text-vp-navy">بين يدك</span>
              </h1>
              <p className="text-lg text-muted max-w-md mb-8 leading-relaxed">
                برامج تمارين وغذاء جاهزة يستخدمها آلاف الأشخاص، وتطبيق واحد يجمع بين التخطيط الذكي ومجتمع الدعم.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#shop"
                  className="inline-flex items-center justify-center gap-2 bg-vp-navy text-white font-semibold px-6 py-4 rounded-xl hover:bg-vp-navy/90 transition-colors shadow-lg shadow-vp-navy/20"
                >
                  تصفح البرامج
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </a>
                <a
                  href={APP_PATH}
                  className="inline-flex items-center justify-center gap-2 border-2 border-vp-navy text-vp-navy font-semibold px-6 py-4 rounded-xl hover:bg-vp-navy/5 transition-colors"
                >
                  التطبيق والمجتمع
                </a>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              {/* Hero image placeholder */}
              <div className="w-full max-w-md aspect-square rounded-2xl bg-gradient-to-br from-vp-beige to-vp-navy/10 flex items-center justify-center overflow-hidden border border-vp-navy/10">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/80 flex items-center justify-center">
                    <svg className="w-12 h-12 text-vp-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <p className="text-vp-navy/70 text-sm font-medium">صورة الهيرو</p>
                  <p className="text-vp-navy/50 text-xs mt-1">استبدلها بصورة علامتك</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-vp-navy/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-vp-navy">+28,900</div>
              <p className="text-sm text-muted mt-1">شخص بدأ رياضته معنا</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-vp-navy">98%</div>
              <p className="text-sm text-muted mt-1">نسبة الرضا</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-vp-navy">4.9</div>
              <p className="text-sm text-muted mt-1">تقييم العملاء</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-vp-navy">1000+</div>
              <p className="text-sm text-muted mt-1">تقييم إيجابي</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 sm:py-28 bg-vp-cream/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-vp-dark mb-4">
              برامج جاهزة للتحميل
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              برامج تمارين ونظام غذائي مفصّلة. حمّلها مرة واحدة واستخدمها للأبد، مع دعم مستمر ونتائج مضمونة.
            </p>
          </header>
          <div className="rounded-2xl overflow-hidden border border-vp-navy/10 bg-white shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-vp-beige/50 to-vp-cream flex items-center justify-center min-h-[280px]">
                <div className="text-center p-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-vp-navy/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-vp-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-vp-navy font-medium">صورة البرامج الجاهزة</p>
                  <p className="text-vp-navy/60 text-sm mt-1">أضف صورتك هنا</p>
                </div>
              </div>
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <ul className="space-y-4 text-muted">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-vp-navy/10 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-vp-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    جدول تمارين مفصّل لكل يوم
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-vp-navy/10 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-vp-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    نظام غذائي وسعرات محسوبة
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-vp-navy/10 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-vp-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    فيديوهات شرح لكل تمرين
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-vp-navy/10 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-vp-navy" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    دعم مستمر ورد على استفساراتك
                  </li>
                </ul>
                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-vp-navy/10">
                  <span className="text-xs font-medium text-vp-navy bg-vp-navy/10 px-3 py-1.5 rounded-lg">توصيل فوري</span>
                  <span className="text-xs font-medium text-vp-navy bg-vp-navy/10 px-3 py-1.5 rounded-lg">دعم متواصل</span>
                  <span className="text-xs font-medium text-vp-navy bg-vp-navy/10 px-3 py-1.5 rounded-lg">نتائج مضمونة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section id="app" className="py-20 sm:py-28 bg-vp-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              تطبيق فيجا باور
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              صمّم برنامجك، احسب سعراتك، وانضم لمجتمع يتابع معك.
            </p>
          </header>
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">برنامجك الخاص</h3>
              <p className="text-white/75 leading-relaxed">
                صمّم برنامج تمارينك بنفسك داخل التطبيق حسب هدفك ومستواك.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">سعراتك اليومية</h3>
              <p className="text-white/75 leading-relaxed">
                احسب احتياجك اليومي من السعرات باستخدام الذكاء الاصطناعي.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-5">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">مجتمع التطبيق</h3>
              <p className="text-white/75 leading-relaxed">
                انضم لمجتمع الأعضاء، تابع التحديات واحصل على الدعم المستمر.
              </p>
            </div>
          </div>
          <div className="text-center">
            <a
              href={APP_PATH}
              className="inline-flex items-center justify-center gap-2 bg-white text-vp-navy font-bold px-8 py-4 rounded-xl hover:bg-vp-cream transition-colors shadow-xl"
            >
              انضم من التطبيق
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Shop / Digital Products Section */}
      <section id="shop" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <header className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-vp-dark mb-4">
              برامج رقمية جاهزة
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              اختر برنامجاً، حمّله فوراً وابدأ رحلتك.
            </p>
          </header>

          {products.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-vp-navy/10 bg-vp-cream/30">
              <p className="text-muted">لا توجد برامج متاحة حالياً.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="group text-right rounded-2xl border border-vp-navy/10 bg-white overflow-hidden hover:shadow-xl hover:border-vp-navy/20 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] bg-vp-beige/30 overflow-hidden">
                    {product.product_image_url ? (
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-vp-navy/40">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                    {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                      <span className="absolute top-3 right-3 bg-vp-navy text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-vp-dark text-lg mb-2 group-hover:text-vp-navy transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-muted text-sm line-clamp-2 mb-4">
                      {product.description.replace(/^#+\s*/m, '').substring(0, 90)}
                      {product.description.length > 90 ? '...' : ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-vp-navy">
                          {product.price_sar.toFixed(0)} ر.س
                        </span>
                        {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                          <span className="text-sm text-muted line-through">
                            {product.before_price_sar.toFixed(0)} ر.س
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-vp-navy flex items-center gap-1">
                        عرض التفاصيل
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </span>
                    </div>
                    {product.times_bought > 0 && (
                      <p className="text-xs text-muted mt-2">
                        {product.times_bought}+ عملية شراء
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-vp-navy/10 bg-vp-cream/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {profileImageUrl ? (
                <Image src={profileImageUrl} alt="" width={28} height={28} className="rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-vp-navy flex items-center justify-center text-white text-xs font-bold">
                  {brandName.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-vp-dark">{brandName}</span>
            </div>
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} {brandName}. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}