'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ArrowLeft } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <SiteHeader brandName={brandName} profileImageUrl={profileImageUrl} />

      <HeroSection heroImageUrl="/app%20(1).png" />

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
      <section id="app" className="border-y bg-primary py-16 text-primary-foreground sm:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">تطبيقنا الجديد </h2>
            <p className="mt-3 text-primary-foreground/85">
              صمّم برنامجك، احسب سعراتك، وانضم لمجتمع يتابع معك.
            </p>
          </div>
          {/* Swipeable app screens - one card per image on mobile, all three on desktop */}
          <div
            className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 snap-x snap-mandatory touch-pan-x [scroll-behavior:auto]"
            style={{ WebkitOverflowScrolling: 'touch', contain: 'layout paint' }}
          >
            {['/4.png', '/6.png', '/5.png'].map((src) => (
              <div
                key={src}
                className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[calc(33.333%-1rem)] md:max-w-[280px] snap-start"
              >
                <div className="rounded-2xl overflow-hidden border border-primary-foreground/20 bg-primary-foreground/5 shadow-lg">
                  <Image
                    src={src}
                    alt=""
                    width={280}
                    height={560}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href={APP_PATH} className="gap-2">
                انشئ حسابك الآن
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ProgramsCarouselSection products={products} />

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
