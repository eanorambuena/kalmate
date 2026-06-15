export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  nitro: {
    preset: 'cloudflare-pages',
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kalmate is a free, open-source Bloomberg-style financial terminal. Track real-time stock quotes, forex, commodities, crypto, and indices. Manage your portfolio with live P&L, set price alerts with browser notifications, screen stocks by filters, and view professional candlestick charts. No API key required. Powered by Yahoo Finance.' },
        { name: 'keywords', content: 'financial terminal, bloomberg terminal alternative, free stock market tracker, real-time stock quotes, portfolio tracker, stock screener, price alerts, candlestick charts, forex tracker, crypto tracker, yahoo finance, open source finance' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://kalmate.pages.dev' },
        { property: 'og:title', content: 'Kalmate — Free Bloomberg-Style Financial Terminal' },
        { property: 'og:description', content: 'Free, open-source financial terminal with real-time stock quotes, portfolio tracking with live P&L, price alerts, stock screener, and professional charts. No API key needed.' },
        { property: 'og:image', content: 'https://kalmate.pages.dev/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:site_name', content: 'Kalmate' },
        { property: 'og:locale', content: 'en_US' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Kalmate — Free Bloomberg-Style Financial Terminal' },
        { name: 'twitter:description', content: 'Free, open-source financial terminal. Track stocks, forex, crypto with live charts and portfolio management.' },
        { name: 'twitter:image', content: 'https://kalmate.pages.dev/og-image.png' },

        // SEO
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { name: 'googlebot', content: 'index, follow' },
        { name: 'revisit-after', content: '1 day' },
        { name: 'application-name', content: 'Kalmate' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'msapplication-TileColor', content: '#0a0a0a' },
        { name: 'google-adsense-account', content: 'ca-pub-5127016522335908' },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Kalmate',
            url: 'https://kalmate.pages.dev',
            description: 'Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, price alerts, stock screener, and professional candlestick charts.',
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Market Dashboard', item: 'https://kalmate.pages.dev/terminal' },
              { '@type': 'ListItem', position: 2, name: 'Portfolio', item: 'https://kalmate.pages.dev/terminal/portfolio' },
              { '@type': 'ListItem', position: 3, name: 'Price Alerts', item: 'https://kalmate.pages.dev/terminal/alerts' },
              { '@type': 'ListItem', position: 4, name: 'Stock Screener', item: 'https://kalmate.pages.dev/terminal/screener' },
            ],
          }),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: 'Kalmate',
            description: 'Open-source Bloomberg-style financial terminal built with Nuxt 3, Vue 3, and Tailwind CSS.',
            codeRepository: 'https://github.com/eanorambuena/kalmate',
            programmingLanguage: 'TypeScript',
          }),
        },
      ],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
  },
})
