'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Download } from 'lucide-react'
import type { Product } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProgramCardProps {
  product: Product
}

export function ProgramCard({ product }: ProgramCardProps) {
  const descriptionSnippet = product.description
    .replace(/^#+\s*/m, '')
    .substring(0, 90)
  const hasDiscount =
    product.before_price_sar != null && product.before_price_sar > product.price_sar
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.before_price_sar! - product.price_sar) / product.before_price_sar!) * 100
      )
    : 0

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg cursor-pointer h-full flex flex-col border bg-card">
        <div className="relative aspect-[4/3] bg-muted flex-shrink-0">
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
          {hasDiscount && (
            <Badge className="absolute right-2 top-2">
              -{discountPercent}%
            </Badge>
          )}
        </div>
        <CardHeader className="pb-2 flex-grow">
          <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
            {product.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {descriptionSnippet}
            {product.description.length > 90 ? '...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                {product.price_sar.toFixed(0)} ر.س
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.before_price_sar!.toFixed(0)} ر.س
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              عرض التفاصيل
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          {product.times_bought > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {product.times_bought}+ عملية شراء
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
