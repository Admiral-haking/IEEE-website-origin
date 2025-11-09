import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const locales: Array<'en'|'fa'> = ['en', 'fa'];
  const paths = ['', '/solutions', '/capabilities', '/blog', '/case-studies', '/jobs', '/team', '/about', '/contact', '/privacy', '/terms'];
  const now = new Date();
  return locales.flatMap((l) => paths.map((p) => ({
    url: `${base}/${l}${p}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7
  })));
}
