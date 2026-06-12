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
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, alerts, and professional charts. Powered by Yahoo Finance.' },
        { name: 'keywords', content: 'financial terminal, bloomberg alternative, stock market, real-time quotes, portfolio tracker, yahoo finance' },
        { property: 'og:title', content: 'Kalmate — Bloomberg-Style Financial Terminal' },
        { property: 'og:description', content: 'Free Bloomberg-style financial terminal with real-time market data, portfolio tracking, alerts, and professional charts.' },
        { property: 'og:type', content: 'website' },
      ],
    },
  },
})
