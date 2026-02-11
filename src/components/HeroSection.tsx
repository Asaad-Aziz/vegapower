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
    let rafId: number
    let currentProgress = 0

    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = 400
      const targetProgress = Math.min(scrollY / maxScroll, 1)

      const smoothUpdate = () => {
        currentProgress += (targetProgress - currentProgress) * 0.1
        if (Math.abs(targetProgress - currentProgress) > 0.001) {
          setScrollProgress(currentProgress)
          rafId = requestAnimationFrame(smoothUpdate)
        } else {
          setScrollProgress(targetProgress)
        }
      }

      cancelAnimationFrame(rafId)
      smoothUpdate()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const easeOutQuad = (t: number) => t * (2 - t)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

  const scale = 1 - easeOutQuad(scrollProgress) * 0.15
  const borderRadius = easeOutCubic(scrollProgress) * 48
  const heightVh = 100 - easeOutQuad(scrollProgress) * 37.5

  return (
    <section className="pt-32 pb-12 px-4 sm:px-6 min-h-screen flex items-center relative overflow-hidden">
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

      {/* Content */}
      <div className="max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-12">
          <div
            className={`transition-all duration-1000 delay-[800ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 w-full px-4 max-w-4xl mx-auto text-balance">
              <AnimatedText text="رياضتك أسهل بين يدك" delay={0.3} />
            </h1>
          </div>
          <p
            className={`max-w-xl mx-auto text-lg text-muted-foreground transition-all duration-1000 delay-[1000ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            برامج تمارين وغذاء جاهزة يستخدمها آلاف الأشخاص، وتطبيق واحد يجمع بين التخطيط الذكي ومجتمع الدعم.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-8">
          <div
            className={`flex flex-wrap justify-center gap-3 transition-all duration-[1500ms] ease-out delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[400px]'}`}
          >
            <Button size="lg" asChild>
              <a href="#shop" className="gap-2">
                تصفح البرامج
                <ChevronLeft className="size-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
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
