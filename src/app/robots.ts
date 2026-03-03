import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vegapower.store'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/app', '/app2', '/checkout', '/success', '/cancel'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
