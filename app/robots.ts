import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep thin/private flows out of the index so crawl budget focuses on public pages
        disallow: [
          '/api/',
          '/booking/',
          '/confirmation/',
          '/trading',
          '/watcher',
          '/account',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL.replace('https://', ''),
  }
}
