'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Calculator, Users, Check } from 'lucide-react'
import type { Product, StoreSettings } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav — FORMA style: fixed, blur, pill CTA */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background/85 px-4 py-4 backdrop-blur-[20px] sm:px-8 md:px-12">
        <div className="font-serif text-2xl font-normal tracking-tight text-foreground">
          {brandName}
        </div>
        <ul className="hidden items-center gap-10 sm:flex">
          <li>
            <a href="#programs" className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground">
              البرامج
            </a>
          </li>
          <li>
            <a href="#app" className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground">
              التطبيق
            </a>
          </li>
          <li>
            <a href="#shop" className="text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground">
              المتجر
            </a>
          </li>
        </ul>
        <Button asChild className="rounded-full px-6 transition-all hover:-translate-y-0.5">
          <Link href={APP_PATH}>انضم من التطبيق</Link>
        </Button>
      </nav>

      {/* Hero — full viewport, centered, badge + headline + subtitle + stats + scroll */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center sm:px-6">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          لياقة بسيطة وواضحة
        </span>
        <h1 className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] font-normal leading-[0.95] tracking-tight text-foreground">
          أقل ضجيجاً.
          <br />
          <em className="italic">نتائج أوضح.</em>
        </h1>
        <p className="mt-6 max-w-[28rem] text-lg font-light text-muted-foreground">
          برامج تمارين وغذاء مُختارة وأدوات تدريب ذكية لمن يقدّر البساطة والنتيجة.
        </p>
        <div className="mt-12 flex gap-12 sm:gap-16">
          {[
            { value: '+28,900', label: 'شخص بدأ رياضته معنا' },
            { value: '12', label: 'برنامج' },
            { value: '4.9', label: 'تقييم التطبيق' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">{stat.value}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs tracking-[0.1em] text-muted-foreground">
          <span>تمرير</span>
          <div className="h-10 w-px bg-gradient-to-b from-muted-foreground to-transparent" />
        </div>
      </section>

      {/* Programs — section header (label + title + desc) + card grid */}
      <section id="programs" className="bg-card px-4 py-20 sm:py-28 sm:px-8 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                برامج جاهزة للتحميل
              </p>
              <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl md:text-5xl">
                يثق بها آلاف الأشخاص. جاهزة عندما تكون أنت.
              </h2>
            </div>
            <p className="max-w-sm font-light text-muted-foreground">
              حمّل فوراً. تدرب فوراً. بدون تخمين أو زوائد — فقط نتائج مضمونة.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.length === 0 ? (
              <Card className="col-span-full flex min-h-[320px] items-center justify-center p-8">
                <p className="text-muted-foreground">لا توجد برامج متاحة حالياً.</p>
              </Card>
            ) : (
              products.map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-background transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  onClick={() => onSelectProduct(product)}
                >
                  <div className="relative h-[280px] overflow-hidden bg-gradient-to-br from-vp-beige/40 to-vp-cream">
                    {product.product_image_url ? (
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="size-full opacity-30"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide">
                      {product.before_price_sar != null && product.before_price_sar > product.price_sar ? 'خصم' : 'متاح'}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif text-xl font-normal tracking-tight">{product.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {product.description.replace(/^#+\s*/m, '').substring(0, 80)}
                      {product.description.length > 80 ? '...' : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Check className="size-3.5 text-primary" />
                        جدول تمارين
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Check className="size-3.5 text-primary" />
                        نظام غذائي
                      </span>
                    </div>
                    <div className="mt-6 border-t border-border pt-6 flex items-baseline gap-2">
                      <span className="font-serif text-2xl font-normal">
                        {product.price_sar.toFixed(0)} ر.س
                      </span>
                      {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.before_price_sar.toFixed(0)} ر.س
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">دفعة واحدة</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* App — dark section, two columns: content + phone mockup */}
      <section id="app" className="relative overflow-hidden bg-primary px-4 py-20 text-primary-foreground sm:py-28 sm:px-8 md:px-12">
        <div
          className="absolute -top-1/2 right-0 w-[80%] max-w-2xl -translate-y-1/2 rounded-full opacity-[0.03] pointer-events-none"
          style={{ paddingBottom: '100%', background: 'radial-gradient(ellipse at center, white 0%, transparent 70%)' }}
        />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
          <div className="lg:order-2">
            <p className="mb-3 text-xs uppercase tracking-[0.15em] text-primary-foreground/50">تطبيق فيجا باور</p>
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
              مدربك الذكي في جيبك.
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed text-primary-foreground/75">
              صمّم برامج مخصصة لأهدافك. احسب سعراتك بدقة. تتبع كل تمرين وكل إنجاز.
            </p>
            <div className="mt-10 space-y-6">
              {[
                { icon: Sparkles, title: 'بناء البرنامج بالذكاء الاصطناعي', desc: 'تمارين مخصصة حسب معداتك ووقتك وأهدافك' },
                { icon: Calculator, title: 'حاسبة السعرات الذكية', desc: 'تغذية تتكيف مع معدل الحرق والنشاط' },
                { icon: Users, title: 'المجتمع', desc: 'تواصل مع أشخاص يشاركونك نفس النهج البسيط' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                    <item.icon className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="mt-0.5 text-sm font-light text-primary-foreground/65">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              asChild
              className="mt-10 rounded-full bg-primary-foreground px-8 text-primary transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Link href={APP_PATH} className="gap-2">
                حمّل التطبيق
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
          </div>
          {/* Phone mockup */}
          <div className="flex justify-center lg:order-1">
            <div className="relative w-[280px] shrink-0 rounded-[40px] border-[12px] border-[#1a1a1a] bg-[#1a1a1a] p-2 shadow-2xl">
              <div className="absolute top-4 left-1/2 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />
              <div className="flex h-[556px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-vp-cream to-background">
                <div className="p-6 pt-12 text-center">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">صباح الخير</p>
                  <h3 className="font-serif mt-1 text-lg text-foreground">جاهز للتدريب؟</h3>
                </div>
                <div className="mx-3 flex gap-2">
                  {[1840, 142, 4].map((val, i) => (
                    <div key={i} className="flex-1 rounded-xl bg-card p-3 text-center">
                      <div className="font-serif text-lg text-foreground">{val}</div>
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {i === 0 ? 'سعرة' : i === 1 ? 'بروتين' : 'سلسلة'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mx-3 mt-3 rounded-2xl bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">تمرين اليوم</p>
                  <p className="font-serif text-sm text-foreground">الجزء العلوي • دفع</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-foreground" />
                  </div>
                </div>
                <div className="mt-auto p-3">
                  <div className="flex justify-around rounded-2xl bg-card py-2">
                    {[true, false, false, false].map((active, i) => (
                      <div
                        key={i}
                        className={cn('size-2 rounded-full', active ? 'bg-foreground' : 'bg-muted')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community — avatars + CTA */}
      <section id="community" className="bg-background px-4 py-20 text-center sm:py-24 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs uppercase tracking-[0.15em] text-muted-foreground">انضم للحركة</p>
          <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
            تدرب مع مجتمع يفهمك.
          </h2>
          <p className="mt-4 font-light text-muted-foreground">
            بدون ضجيج. أشخاص حقيقيون يحققون تقدماً حقيقياً بمنهج بسيط لللياقة.
          </p>
          <div className="mt-8 flex justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="-ml-3 size-12 rounded-full border-[3px] border-background bg-gradient-to-br from-vp-beige to-vp-cream first:ml-0"
                style={{ zIndex: 6 - i }}
              />
            ))}
            <div
              className="-ml-3 flex size-12 items-center justify-center rounded-full border-[3px] border-background bg-card text-xs font-semibold text-foreground"
              style={{ zIndex: 1 }}
            >
              +50
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">أكثر من 50,000 عضو</strong> وما زال العدد يرتفع
          </p>
          <Button size="lg" asChild className="mt-8 rounded-full">
            <Link href={APP_PATH} className="gap-2">
              انضم للمجتمع
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Shop anchor + optional compact list */}
      <section id="shop" className="bg-card border-t border-border px-4 py-16 sm:px-8 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted-foreground">المتجر</p>
              <h2 className="font-serif text-2xl font-normal tracking-tight sm:text-3xl">
                برامج رقمية جاهزة
              </h2>
            </div>
            <p className="text-sm font-light text-muted-foreground">اختر برنامجاً، حمّله فوراً وابدأ.</p>
          </div>
          {products.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 6).map((product) => (
                <Card
                  key={product.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                  onClick={() => onSelectProduct(product)}
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {product.product_image_url ? (
                      <Image
                        src={product.product_image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground/40">
                        <Sparkles className="size-10" />
                      </div>
                    )}
                    {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                      <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        -{Math.round(((product.before_price_sar - product.price_sar) / product.before_price_sar) * 100)}%
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-serif text-lg font-normal">{product.title}</h3>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="font-serif text-xl font-normal text-primary">
                        {product.price_sar.toFixed(0)} ر.س
                      </span>
                      {product.before_price_sar != null && product.before_price_sar > product.price_sar && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.before_price_sar.toFixed(0)} ر.س
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12 sm:px-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
          <div className="font-serif text-xl font-normal tracking-tight">{brandName}</div>
          <ul className="flex gap-8">
            <li>
              <a href="#programs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                البرامج
              </a>
            </li>
            <li>
              <a href="#app" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                التطبيق
              </a>
            </li>
            <li>
              <a href="#shop" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                المتجر
              </a>
            </li>
            <li>
              <Link href={APP_PATH} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                الدعم
              </Link>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brandName}. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  )
}
