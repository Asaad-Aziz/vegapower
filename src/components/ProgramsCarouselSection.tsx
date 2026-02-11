'use client'

import type { Product } from '@/types/database'
import { ProgramCard } from '@/components/ProgramCard'
import { Card } from '@/components/ui/card'

interface ProgramsCarouselSectionProps {
  products: Product[]
}

export function ProgramsCarouselSection({ products }: ProgramsCarouselSectionProps) {
  if (products.length === 0) {
    return (
      <section id="shop" className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">برامج رقمية جاهزة</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            اختر برنامجاً، حمّله فوراً وابدأ رحلتك.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-4">
          <Card className="py-16">
            <p className="text-center text-muted-foreground">لا توجد برامج متاحة حالياً.</p>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section id="shop" className="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">برامج رقمية جاهزة</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          اختر برنامجاً، حمّله فوراً وابدأ رحلتك. اسحب أو مرّر لرؤية كل البرامج.
        </p>
      </div>

      <div
        role="region"
        aria-label="برامج للتصفح"
        className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-proximity overscroll-x-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          touchAction: 'pan-x',
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[400px] snap-start"
          >
            <ProgramCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
