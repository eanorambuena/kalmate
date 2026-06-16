<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const canonical = canonicalUrl('/terminal/portfolio')

useHead({
  title: 'Portfolio | Kalmate',
  meta: [
    { name: 'description', content: 'Track your holdings and performance with Kalmate portfolio tools.' },
    { property: 'og:title', content: 'Portfolio | Kalmate' },
    { property: 'og:description', content: 'Track your holdings and performance with Kalmate portfolio tools.' },
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
