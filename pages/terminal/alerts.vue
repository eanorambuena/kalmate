<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const { t } = useI18n()

const canonical = canonicalUrl('/terminal/alerts')

useHead({
  title: computed(() => t('terminal.heading.alerts')),
  meta: [
    { name: 'description', content: computed(() => t('landing.features.cards.alerts.desc')) },
    { name: 'keywords', content: 'kalmate alerts, price alerts, stock price notifications, real-time alerts, crypto alerts, forex alerts, browser notifications, free stock alerts' },
    { property: 'og:title', content: computed(() => t('terminal.heading.alerts')) },
    { property: 'og:description', content: computed(() => t('landing.features.cards.alerts.desc')) },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: computed(() => t('terminal.heading.alerts')) },
    { name: 'twitter:description', content: computed(() => t('landing.features.cards.alerts.desc')) },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const { startPolling, isPolling, refreshKey } = useAlerts()
onMounted(() => startPolling(30000))
</script>

<template>
  <div class="text-xs text-[#ccc] mb-3 flex items-center gap-2">
    <span class="font-sans">{{ $t('terminal.heading.alerts') }}</span>
    <span class="text-[#888] text-[10px] flex items-center gap-1">
      <span :class="isPolling ? 'text-[#00c853]' : 'text-[#888]'" class="text-xs">●</span>
      {{ isPolling ? $t('terminal.alerts.live') : $t('terminal.alerts.off') }}
    </span>
  </div>
  <AlertForm :refresh-key="refreshKey" />
</template>
