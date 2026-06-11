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
      ],
    },
  },
})
