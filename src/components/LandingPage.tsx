'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Download, Calculator, Users, ArrowLeft } from 'lucide-react'
import type { Product, StoreSettings } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import SiteHeader from '@/components/SiteHeader'
import { HeroSection } from '@/components/HeroSection'

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

      <HeroSection heroImageUrl={null} />

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

      {/* Programs */}
      <section id="programs" className="border-b bg-card/30 py-16 sm:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">برامج جاهزة للتحميل</h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              برامج تمارين ونظام غذائي مفصّلة. حمّلها مرة واحدة واستخدمها للأبد، مع دعم مستمر ونتائج مضمونة.
            </p>
          </div>
          <Card className="overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="flex min-h-[260px] items-center justify-center bg-muted/30 p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-xl bg-primary/10">
                    <Download className="size-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">صورة البرامج الجاهزة</p>
                  <p className="text-xs text-muted-foreground/80">أضف صورتك هنا</p>
                </div>
              </div>
              <CardContent className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                {[
                  'جدول تمارين مفصّل لكل يوم',
                  'نظام غذائي وسعرات محسوبة',
                  'فيديوهات شرح لكل تمرين',
                  'دعم مستمر ورد على استفساراتك',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="size-2 rounded-full bg-primary" />
                    </div>
                    {item}
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">توصيل فوري</Badge>
                  <Badge variant="secondary">دعم متواصل</Badge>
                  <Badge variant="secondary">نتائج مضمونة</Badge>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* App */}
      <section id="app" className="border-y bg-primary py-16 text-primary-foreground sm:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">تطبيق فيجا باور</h2>
            <p className="mt-3 text-primary-foreground/85">
              صمّم برنامجك، احسب سعراتك، وانضم لمجتمع يتابع معك.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Download,
                title: 'برنامجك الخاص',
                desc: 'صمّم برنامج تمارينك بنفسك داخل التطبيق حسب هدفك ومستواك.',
              },
              {
                icon: Calculator,
                title: 'سعراتك اليومية',
                desc: 'احسب احتياجك اليومي من السعرات باستخدام الذكاء الاصطناعي.',
              },
              {
                icon: Users,
                title: 'مجتمع التطبيق',
                desc: 'انضم لمجتمع الأعضاء، تابع التحديات واحصل على الدعم المستمر.',
              },
            ].map((item) => (
              <Card
                key={item.title}
                className={cn(
                  'border-primary-foreground/15 bg-primary-foreground/10 backdrop-blur-sm',
                  'transition-colors hover:bg-primary-foreground/15'
                )}
              >
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                    <item.icon className="size-6" />
                  </div>
                  <CardTitle className="text-primary-foreground">{item.title}</CardTitle>
                  <CardDescription className="text-primary-foreground/80">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Button size="lg" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href={APP_PATH} className="gap-2">
                انضم من التطبيق
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Shop */}
      <section id="shop" className="py-16 sm:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">برامج رقمية جاهزة</h2>
            <p className="mt-3 text-muted-foreground">اختر برنامجاً، حمّله فوراً وابدأ رحلتك.</p>
          </div>

          {products.length === 0 ? (
            <Card className="py-16">
              <p className="text-center text-muted-foreground">لا توجد برامج متاحة حالياً.</p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="group overflow-hidden transition-shadow hover:shadow-md cursor-pointer h-full">
                  <div className="relative aspect-[4/3] bg-muted">
                    {product.product_image_url ? (
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground/50">
                        <Download className="size-12" />
                      </div>
                    )}
                    {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                      <Badge className="absolute right-2 top-2">
                        -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-lg group-hover:text-primary">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description.replace(/^#+\s*/m, '').substring(0, 90)}
                      {product.description.length > 90 ? '...' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">
                          {product.price_sar.toFixed(0)} ر.س
                        </span>
                        {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.before_price_sar.toFixed(0)} ر.س
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-primary">
                        عرض التفاصيل
                        <ChevronLeft className="size-4" />
                      </Button>
                    </div>
                    {product.times_bought > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">{product.times_bought}+ عملية شراء</p>
                    )}
                  </CardContent>
                </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
