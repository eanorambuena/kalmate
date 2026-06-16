export default defineEventHandler((event) => {
  const siteUrl = 'https://kalmate.pages.dev'

  const urls = [
    { loc: '/', priority: '1.0', lastmod: '2026-06-16' },
    { loc: '/terminal', priority: '0.9', lastmod: '2026-06-16' },
    { loc: '/terminal/portfolio', priority: '0.7' },
    { loc: '/terminal/screener', priority: '0.7' },
    { loc: '/terminal/alerts', priority: '0.7' },
    { loc: '/terminal/pricing', priority: '0.6' },
    { loc: '/terminal/pipeline', priority: '0.6' },
    { loc: '/about', priority: '0.6', lastmod: '2026-06-16' },
    { loc: '/contact', priority: '0.6', lastmod: '2026-06-16' },
    { loc: '/privacy', priority: '0.5', lastmod: '2026-06-16' },
    { loc: '/terms', priority: '0.5', lastmod: '2026-06-16' },
    { loc: '/disclaimer', priority: '0.5', lastmod: '2026-06-16' },
    { loc: '/blog', priority: '0.8', lastmod: '2026-06-16' },
    { loc: '/blog/what-is-a-financial-terminal', priority: '0.7', lastmod: '2026-06-16' },
    { loc: '/blog/understanding-market-indicators', priority: '0.7', lastmod: '2026-06-10' },
    { loc: '/blog/build-diversified-portfolio', priority: '0.7', lastmod: '2026-06-05' },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${siteUrl}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return xml
})
