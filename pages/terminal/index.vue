<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'
import { ALL_MARKETS } from '../../utils/constants'
import { useQuotePoller } from '~/composables/useQuotePoller'

const { t } = useI18n()

const canonical = canonicalUrl('/terminal')

useHead({
  title: computed(() => t('terminal.heading.market')),
  meta: [
    { name: 'description', content: computed(() => t('landing.hero.subtext')) },
    { name: 'keywords', content: 'kalmate market dashboard, real-time stock quotes, forex tracker, crypto prices, commodity prices, financial terminal, live market data' },
    { property: 'og:title', content: computed(() => t('terminal.heading.market')) },
    { property: 'og:description', content: computed(() => t('landing.hero.subtext')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('terminal.heading.market')) },
    { name: 'twitter:description', content: computed(() => t('landing.hero.subtext')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const { categories, pending } = useQuotePoller(ALL_MARKETS, 60_000)

const indicesItems = computed(() => {
  const indices = categories.value.find(c => c.title === 'INDICES')
  return indices?.items ?? []
})
</script>

<template>
  <div class="mb-6">
    <MarketOverview :items="indicesItems" :loading="pending" />
  </div>
  <div class="mb-4">
    <ChileIndicators />
  </div>
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
    <div v-for="cat in categories" :key="cat.title">
      <MarketCategoryTable :title="cat.title" :items="cat.items" :loading="pending" />
    </div>
  </div>
  <div class="mt-4">
    <NewsFeed />
  </div>
</template>
