'use client'

import { useRef, useEffect, useState } from 'react'
import type { Product } from '@/types/database'
import { ProgramCard } from '@/components/ProgramCard'
import { Card } from '@/components/ui/card'

interface ProgramsCarouselSectionProps {
  products: Product[]
}

export function ProgramsCarouselSection({ products }: ProgramsCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const positionRef = useRef(0)
  const animationRef = useRef<number | undefined>(undefined)

  const duplicatedProducts =
    products.length > 0 ? [...products, ...products, ...products] : []

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer || duplicatedProducts.length === 0) return

    const speed = isHovered ? 0.3 : 1
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      positionRef.current += speed * (deltaTime / 16)

      const totalWidth = scrollContainer.scrollWidth / 3

      if (positionRef.current >= totalWidth) {
        positionRef.current = 0
      }

      scrollContainer.style.transform = `translateX(-${positionRef.current}px)`
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isHovered, duplicatedProducts.length])

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
    <section id="shop" className="py-16 sm:py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">برامج رقمية جاهزة</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          اختر برنامجاً، حمّله فوراً وابدأ رحلتك.
        </p>
      </div>

      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={scrollRef} className="flex gap-6" style={{ width: 'fit-content' }}>
          {duplicatedProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 w-[85vw] sm:w-[60vw] lg:w-[400px]"
            >
              <ProgramCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
