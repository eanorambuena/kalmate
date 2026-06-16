<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import { ALL_MARKETS } from '../../utils/constants'

const canonical = canonicalUrl('/terminal')

useHead({
  title: 'Market Dashboard — Real-Time Stock Quotes & Forex | Kalmate',
  meta: [
    { name: 'description', content: 'Browse real-time market quotes for equities, forex, bonds, commodities, and crypto on Kalmate financial terminal. Free stock tracker with live prices, charts, and news.' },
    { name: 'keywords', content: 'kalmate market dashboard, real-time stock quotes, forex tracker, crypto prices, commodity prices, financial terminal, live market data' },
    { property: 'og:title', content: 'Market Dashboard — Real-Time Stock Quotes & Forex | Kalmate' },
    { property: 'og:description', content: 'Browse real-time market quotes for equities, forex, bonds, commodities, and crypto on Kalmate financial terminal.' },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Market Dashboard | Kalmate' },
    { name: 'twitter:description', content: 'Browse real-time quotes for equities, forex, bonds, commodities, and crypto in Kalmate.' },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const categories = Object.entries(ALL_MARKETS).map(([title, symbols]) => ({
  title,
  symbols,
}))
</script>

<template>
  <div class="mb-6">
    <MarketOverview />
  </div>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div v-for="cat in categories" :key="cat.title">
      <MarketCategoryTable :title="cat.title" :symbols="cat.symbols" />
    </div>
  </div>
  <div class="mt-4">
    <NewsFeed />
  </div>
</template>
