import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/promo', '/sell'],
    },
    sitemap: 'https://binara.app/sitemap.xml',
  };
}
