/**
 * Generate sitemap.xml for SEO
 * Run this script to update sitemap when products change
 */

import { peptides } from '../data/peptides';
import { getProductSlug } from '../data/productContent';

export function generateSitemap(baseUrl: string = 'https://laminincollective.com'): string {
  const lastMod = new Date().toISOString().split('T')[0];

  // Static pages with their priorities
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/library', priority: '0.9', changefreq: 'daily' },
    { path: '/coa', priority: '0.7', changefreq: 'weekly' },
    { path: '/faq', priority: '0.6', changefreq: 'monthly' },
    { path: '/guarantee', priority: '0.5', changefreq: 'monthly' },
    { path: '/contact', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  ];

  // Product pages
  const productPages = peptides.map((peptide) => ({
    path: `/products/${getProductSlug(peptide.id)}`,
    priority: '0.8',
    changefreq: 'weekly' as const,
  }));

  const allPages = [...staticPages, ...productPages];

  const urls = allPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

// Generate and log sitemap (for manual copying to public/sitemap.xml)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(generateSitemap());
}
