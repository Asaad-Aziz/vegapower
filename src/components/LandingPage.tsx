'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ArrowLeft, Gift } from 'lucide-react'
import type { Product, StoreSettings } from '@/types/database'
import { Button } from '@/components/ui/button'
import SiteHeader from '@/components/SiteHeader'
import { HeroSection } from '@/components/HeroSection'
import { ProgramsCarouselSection } from '@/components/ProgramsCarouselSection'

const APP_PATH = '/app'

interface LandingPageProps {
  products: Product[]
  storeSettings?: StoreSettings | null
}

export default function LandingPage({
  products,
  storeSettings,
}: LandingPageProps) {
  const brandName = storeSettings?.brand_name || products[0]?.brand_name || 'Vega Power'
  const profileImageUrl = storeSettings?.profile_image_url || products[0]?.profile_image_url || null
  const freeProducts = products.filter((p) => p.price_sar === 0)
  const paidProducts = products.filter((p) => p.price_sar > 0)

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <SiteHeader brandName={brandName} profileImageUrl={profileImageUrl} />

      <HeroSection heroImageUrl="/hero1.png" />

      {/* Free Offer Banner */}
      {freeProducts.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="container mx-auto max-w-5xl px-4">
            {freeProducts.map((freeProduct) => (
              <Link key={freeProduct.id} href={`/product/${freeProduct.id}`} className="block group">
                <div className="relative overflow-hidden rounded-2xl border-2 border-green-500/30 bg-gradient-to-l from-green-50 via-emerald-50/50 to-background shadow-lg transition-all hover:shadow-xl hover:border-green-500/50">
                  {/* Glow effect */}
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-400/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl" />
                  
                  <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-6">
                    {/* Product Image */}
                    {freeProduct.product_image_url && (
                      <div className="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white shadow-md">
                        <Image
                          src={freeProduct.product_image_url}
                          alt={freeProduct.title}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 text-center sm:text-right min-w-0">
                      <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-2">
                        <Gift className="size-3.5" />
                        عرض مجاني
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5 line-clamp-1">
                        {freeProduct.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {freeProduct.description.replace(/^#+\s*/m, '').substring(0, 120)}
                        {freeProduct.description.length > 120 ? '...' : ''}
                      </p>
                      {freeProduct.times_bought > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {freeProduct.times_bought}+ شخص حصل عليه
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                      <div className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all group-hover:shadow-lg group-hover:shadow-green-600/25 flex items-center gap-2 text-sm sm:text-base">
                        احصل عليه مجاناً
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About Us */}
      <section className="py-14 sm:py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-primary tracking-wide mb-3">قصتنا</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              من ملفات رقمية إلى تطبيق متكامل
            </h2>
          </div>
          <div className="space-y-6 text-center text-muted-foreground leading-relaxed">
            <p>
              بدأنا بحلم بسيط: نوصل اللياقة لكل شخص بطريقة سهلة وواضحة.
              كانت البداية ببرامج تمارين وتغذية جاهزة للتحميل — ملفات رقمية
              ساعدت آلاف الأشخاص يبدأون رحلتهم الصحية من أول يوم.
            </p>
            <p>
              مع الوقت، تطورنا وبنينا تطبيق متكامل يجمع بين التمارين الذكية،
              حساب السعرات بالذكاء الاصطناعي، ومجتمع داعم يتابع معك كل خطوة.
              صرنا جزء من رحلة أكثر من <span className="font-semibold text-primary">28,000</span> شخص
              حققوا أهدافهم الصحية معنا.
            </p>
            <div className="h-px w-16 bg-primary/30 mx-auto my-2" />
            <p className="text-foreground font-medium text-lg">
              مهمتنا أن نستمر في النمو كمجتمع واحد — نلهم بعض، نحفّز بعض،
              ونساعد كل شخص يوصل لأفضل نسخة من نفسه.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '+28,900', label: 'شخص بدأ رياضته معنا' },
              { value: '98%', label: 'نسبة الرضا' },
              { value: '4.9', label: 'تقييم العملاء' },
              { value: '1000+', label: 'تقييم إيجابي' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App */}
      <section id="app" className="border-y bg-primary py-10 text-primary-foreground sm:py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">تطبيقنا الجديد</h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              صمّم برنامجك، احسب سعراتك، وانضم لمجتمع يتابع معك.
            </p>
          </div>
          {/* App screens */}
          <div
            role="region"
            aria-label="لقطات التطبيق"
            className="flex justify-center gap-6 sm:gap-8 overflow-x-auto overflow-y-hidden pb-3 snap-x snap-proximity overscroll-x-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {['/4.png', '/6.png', '/5.png'].map((src) => (
              <div
                key={src}
                className="flex-shrink-0 w-[50vw] sm:w-[35vw] md:w-[200px] snap-start"
              >
                <div className="rounded-xl overflow-hidden border border-primary-foreground/20 bg-primary-foreground/5 shadow-md aspect-[9/19]">
                  <Image
                    src={src}
                    alt=""
                    width={200}
                    height={422}
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 35vw, 200px"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button size="lg" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base py-4 px-6 h-auto" asChild>
              <Link href={APP_PATH} className="gap-2">
                انشئ حسابك الآن
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ProgramsCarouselSection products={paidProducts} />

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2">
            {profileImageUrl ? (
              <Image src={profileImageUrl} alt="" width={24} height={24} className="size-6 rounded-full object-cover" />
            ) : (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {brandName.charAt(0)}
              </div>
            )}
            <span className="font-medium text-foreground">{brandName}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandName}. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  )
}
