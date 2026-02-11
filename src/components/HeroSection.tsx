'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { AnimatedText } from '@/components/AnimatedText'
import { Button } from '@/components/ui/button'

const APP_PATH = '/app'

interface HeroSectionProps {
  heroImageUrl?: string | null
}

export function HeroSection({ heroImageUrl }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let rafId: number | undefined
    let currentProgress = 0
    let ticking = false

    const updateProgress = () => {
      const scrollY = window.scrollY
      const maxScroll = 400
      const targetProgress = Math.min(scrollY / maxScroll, 1)
      currentProgress += (targetProgress - currentProgress) * 0.12
      setScrollProgress(currentProgress)
      ticking = false
      if (Math.abs(targetProgress - currentProgress) > 0.002) {
        rafId = requestAnimationFrame(updateProgress)
      }
    }

    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        rafId = requestAnimationFrame(updateProgress)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== undefined) cancelAnimationFrame(rafId)
    }
  }, [])

  const easeOutQuad = (t: number) => t * (2 - t)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const scale = 1 - easeOutQuad(scrollProgress) * 0.15
  const borderRadius = easeOutCubic(scrollProgress) * 48
  const heightVh = 100 - easeOutQuad(scrollProgress) * 37.5

  return (
    <section className="pt-32 pb-12 px-4 sm:px-6 min-h-screen flex items-end justify-center relative overflow-hidden">
      {/* Scroll-reactive visual layer */}
      <div className="absolute inset-0 top-0">
        <div
          className="w-full will-change-transform overflow-hidden relative"
          style={{
            transform: `scale(${scale})`,
            borderRadius: `${borderRadius}px`,
            height: `${heightVh}vh`,
          }}
        >
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-primary/10" />
          )}
        </div>
      </div>

      {/* Large wordmark that fades on scroll */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full overflow-hidden pointer-events-none z-[5] flex items-end justify-center"
        style={{
          transform: `translateY(${scrollProgress * 150}px)`,
          opacity: 1 - scrollProgress * 0.8,
          height: '100%',
        }}
      >
        <span
          className="block text-primary/30 font-bold text-[28vw] sm:text-[25vw] md:text-[22vw] lg:text-[20vw] tracking-tighter select-none text-center leading-none"
          style={{ marginBottom: 0 }}
          aria-hidden
        >
          رياضتك
        </span>
      </div>

      {/* Content - positioned lower in hero, with background layer for readability */}
      <div className="max-w-5xl mx-auto w-full relative z-10 pb-16 sm:pb-20 md:pb-24 px-2">
        <div className="rounded-2xl bg-black/50 backdrop-blur-md px-6 py-8 sm:px-8 sm:py-10 text-center">
          <div
            className={`transition-all duration-1000 delay-[800ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 w-full max-w-4xl mx-auto text-balance text-white">
              <AnimatedText text="رياضتك أسهل بين يدك" delay={0.3} />
            </h1>
          </div>
          <p
            className={`max-w-xl mx-auto text-lg text-white/90 transition-all duration-1000 delay-[1000ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            برامج تمارين وغذاء جاهزة يستخدمها آلاف الأشخاص، وتطبيق واحد يجمع بين التخطيط الذكي ومجتمع الدعم.
          </p>

          <div
            className={`flex flex-wrap justify-center gap-3 mt-8 transition-all duration-[1500ms] ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[400px]'}`}
          >
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
              <a href="#shop" className="gap-2">
                تصفح البرامج
                <ChevronLeft className="size-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground">
              <Link href={APP_PATH} className="gap-2">
                التطبيق والمجتمع
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
