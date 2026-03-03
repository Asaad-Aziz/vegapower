import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProductPageClient from './ProductPageClient'

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`~>-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

async function getData(id: string) {
  const supabase = createServerClient()
  const [productResult, storeSettingsResult] = await Promise.all([
    supabase.from('product').select('*').eq('id', id).single(),
    supabase.from('store_settings').select('*').limit(1).single(),
  ])
  return {
    product: productResult.data,
    storeSettings: storeSettingsResult.data ?? null,
    error: productResult.error,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data: product } = await supabase.from('product').select('*').eq('id', id).single()

  if (!product) {
    return { title: 'منتج غير موجود' }
  }

  const description = stripMarkdown(product.description).substring(0, 155)

  return {
    title: `${product.title} | Vega Power`,
    description,
    openGraph: {
      title: product.title,
      description,
      type: 'website',
      ...(product.product_image_url && {
        images: [{ url: product.product_image_url }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      ...(product.product_image_url && {
        images: [product.product_image_url],
      }),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { product, storeSettings, error } = await getData(id)

  if (error || !product) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: stripMarkdown(product.description).substring(0, 255),
    ...(product.product_image_url && { image: product.product_image_url }),
    offers: {
      '@type': 'Offer',
      price: product.price_sar,
      priceCurrency: 'SAR',
      availability: 'https://schema.org/InStock',
    },
    ...(product.times_bought > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.9,
        reviewCount: product.times_bought,
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPageClient
        product={product}
        storeSettings={storeSettings}
      />
    </>
  )
}
