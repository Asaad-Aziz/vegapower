'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, ArrowUpRight, ArrowRight, ChevronRight } from 'lucide-react'

const APP_PATH = '/app'

const NAV_SECTIONS = [
  { id: 'programs', label: 'البرامج' },
  { id: 'app', label: 'التطبيق' },
  { id: 'shop', label: 'المتجر' },
] as const

interface SiteHeaderProps {
  brandName: string
  profileImageUrl: string | null
  backHref?: string
}

export default function SiteHeader({ brandName, profileImageUrl, backHref }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (typeof window === 'undefined') return
    if (window.location.pathname !== '/') {
      return // let default link navigate to /#section
    }
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 100
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!backHref && typeof window !== 'undefined') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setIsOpen(false)
    }
  }

  const scrolledStyles = isScrolled
    ? 'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border-zinc-200 dark:border-zinc-800'
    : 'bg-background/90 backdrop-blur-md border-border'
  const textScrolled = isScrolled ? 'text-zinc-600 dark:text-zinc-400 hover:text-foreground' : 'text-muted-foreground hover:text-foreground'
  const borderScrolled = isScrolled ? 'border-zinc-200 dark:border-zinc-800' : 'border-border'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'px-4 pt-4' : ''}`}>
      <div
        className={`max-w-5xl mx-auto transition-all duration-300 rounded-2xl border px-6 py-3 ${scrolledStyles}`}
      >
        <div className="flex items-center justify-between">
          {/* Logo or Back */}
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link
                href={backHref}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                <ChevronRight className="size-4" aria-hidden />
                الرئيسية
              </Link>
            ) : (
              <a
                href="/"
                onClick={handleLogoClick}
                className="flex items-center gap-2 cursor-pointer"
              >
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {brandName.charAt(0)}
                  </div>
                )}
              </a>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`/#${id}`}
                onClick={(e) => handleSmoothScroll(e, id)}
                className={`text-sm transition-colors cursor-pointer ${textScrolled}`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link
              href={APP_PATH}
              className="relative flex items-center gap-0 border rounded-full pl-5 pr-1 py-1.5 transition-all duration-300 group overflow-hidden border-primary/30 hover:border-primary"
            >
              <span className="absolute inset-0 rounded-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 bg-primary" />
              <span className="text-sm pr-3 relative z-10 transition-colors duration-300 text-primary group-hover:text-primary-foreground">
                انضم من التطبيق
              </span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center relative z-10 bg-primary/10 group-hover:bg-transparent">
                <ArrowRight className="w-4 h-4 text-primary group-hover:opacity-0 absolute transition-opacity duration-300" />
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary-foreground" />
              </span>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-2 transition-colors text-foreground hover:text-foreground/80"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <nav className={`md:hidden mt-6 pb-6 flex flex-col gap-4 border-t pt-6 ${borderScrolled}`}>
            {NAV_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`/#${id}`}
                onClick={(e) => handleSmoothScroll(e, id)}
                className={`text-sm transition-colors cursor-pointer ${textScrolled}`}
              >
                {label}
              </a>
            ))}
            <div className={`flex flex-col gap-3 mt-4 pt-4 border-t ${borderScrolled}`}>
              <Link
                href={APP_PATH}
                className="relative flex items-center gap-0 border rounded-full pl-5 pr-1 py-1.5 w-fit transition-all duration-300 group overflow-hidden border-primary/30"
              >
                <span className="absolute inset-0 rounded-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 bg-primary" />
                <span className="text-sm pr-3 relative z-10 transition-colors duration-300 text-primary group-hover:text-primary-foreground">
                  انضم من التطبيق
                </span>
                <span className="w-8 h-8 rounded-full flex items-center justify-center relative z-10">
                  <ArrowRight className="w-4 h-4 text-primary group-hover:opacity-0 absolute transition-opacity duration-300" />
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-primary-foreground" />
                </span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
