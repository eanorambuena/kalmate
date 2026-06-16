<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const canonical = canonicalUrl('/terminal/portfolio')

useHead({
  title: 'Portfolio Tracker — Live P&L & Holdings | Kalmate',
  meta: [
    { name: 'description', content: 'Track your investment portfolio with real-time P&L, position monitoring, and performance analytics on Kalmate. Free portfolio tracker for stocks, ETFs, and crypto.' },
    { name: 'keywords', content: 'kalmate portfolio, portfolio tracker, investment tracking, real-time P&L, stock portfolio manager, crypto portfolio, free portfolio tracker' },
    { property: 'og:title', content: 'Portfolio Tracker — Live P&L & Holdings | Kalmate' },
    { property: 'og:description', content: 'Track your investment portfolio with real-time P&L, position monitoring, and performance analytics on Kalmate.' },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Portfolio | Kalmate' },
    { name: 'twitter:description', content: 'Track your holdings and performance with Kalmate portfolio tools.' },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans">PORTFOLIO</div>
  <PortfolioTable />
</template>
