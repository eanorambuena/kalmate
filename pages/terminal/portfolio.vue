<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const { t } = useI18n()

const canonical = canonicalUrl('/terminal/portfolio')

useHead({
  title: computed(() => t('terminal.heading.portfolio')),
  meta: [
    { name: 'description', content: computed(() => t('landing.features.cards.portfolio.desc')) },
    { name: 'keywords', content: 'kalmate portfolio, portfolio tracker, investment tracking, real-time P&L, stock portfolio manager, crypto portfolio, free portfolio tracker' },
    { property: 'og:title', content: computed(() => t('terminal.heading.portfolio')) },
    { property: 'og:description', content: computed(() => t('landing.features.cards.portfolio.desc')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('terminal.heading.portfolio')) },
    { name: 'twitter:description', content: computed(() => t('landing.features.cards.portfolio.desc')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})
</script>

<template>
  <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans">{{ $t('terminal.heading.portfolio') }}</div>
  <PortfolioTable />
</template>
