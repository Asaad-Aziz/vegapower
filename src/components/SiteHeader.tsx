'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const APP_PATH = '/app'

interface SiteHeaderProps {
  brandName: string
  profileImageUrl: string | null
  backHref?: string
}

export default function SiteHeader({ brandName, profileImageUrl, backHref }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={backHref}>
                <ChevronRight className="size-4" aria-hidden />
                الرئيسية
              </Link>
            </Button>
          ) : (
            <>
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {brandName.charAt(0)}
                </div>
              )}
            </>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#programs">البرامج</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#app">التطبيق</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#shop">المتجر</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={APP_PATH}>انضم من التطبيق</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
