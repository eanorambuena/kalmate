export default defineEventHandler((event) => {
  const posts = [
    {
      title: 'What Is a Financial Terminal and Why Do You Need One?',
      slug: 'what-is-a-financial-terminal',
      date: '2026-06-15',
      description: 'Bloomberg costs $24K/year. Kalmate is free. Compare costs, explore 29 symbols across 6 asset classes, and see real-time AAPL data in action.',
      category: 'Education',
    },
    {
      title: 'Understanding Market Indicators: SMA, EMA, and Kalman Filters',
      slug: 'understanding-market-indicators',
      date: '2026-06-10',
      description: 'See SMA(3) vs EMA(3) calculated step by step with real numbers. Learn when to use each indicator and try them live in Kalmate\'s Pipeline.',
      category: 'Tutorial',
    },
    {
      title: 'How to Build a Diversified Portfolio in 2026',
      slug: 'build-diversified-portfolio',
      date: '2026-06-05',
      description: 'Step-by-step guide with real symbols: SPY, QQQ, ^TNX, GC=F, BTC-USD. Track your diversified portfolio live in Kalmate\'s free Portfolio Tracker.',
      category: 'Education',
    },
  ]

  const items = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>https://kalmate.pages.dev/blog/${post.slug}</link>
      <description>${post.description}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>https://kalmate.pages.dev/blog/${post.slug}</guid>
      <category>${post.category}</category>
    </item>
  `).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kalmate Blog</title>
    <link>https://kalmate.pages.dev/blog</link>
    <description>Market insights, tutorials, and financial education from Kalmate.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://kalmate.pages.dev/api/rss" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  return xml
})
