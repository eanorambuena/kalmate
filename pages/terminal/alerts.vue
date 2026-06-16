<script setup lang="ts">
import { canonicalUrl } from '../../utils/seo'

const canonical = canonicalUrl('/terminal/alerts')

useHead({
  title: 'Price Alerts — Real-Time Stock Notifications | Kalmate',
  meta: [
    { name: 'description', content: 'Set custom price alerts for stocks, crypto, and forex on Kalmate. Get real-time browser notifications when prices hit your targets. Free price alert system.' },
    { name: 'keywords', content: 'kalmate alerts, price alerts, stock price notifications, real-time alerts, crypto alerts, forex alerts, browser notifications, free stock alerts' },
    { property: 'og:title', content: 'Price Alerts — Real-Time Stock Notifications | Kalmate' },
    { property: 'og:description', content: 'Set custom price alerts for stocks, crypto, and forex on Kalmate. Get real-time browser notifications when prices hit your targets.' },
    { property: 'og:url', content: canonical },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Price Alerts | Kalmate' },
    { name: 'twitter:description', content: 'Set up stock price alerts and monitor market moves with Kalmate.' },
  ],
  link: [{ rel: 'canonical', href: canonical }],
})

const { startPolling, isPolling, refreshKey } = useAlerts()
onMounted(() => startPolling(30000))
</script>

<template>
  <div class="text-xs text-[#ccc] mb-3 flex items-center gap-2">
    <span class="font-sans">ALERTS</span>
    <span class="text-[#888] text-[10px] flex items-center gap-1">
      <span :class="isPolling ? 'text-[#00c853]' : 'text-[#888]'" class="text-xs">●</span>
      {{ isPolling ? 'LIVE' : 'OFF' }}
    </span>
  </div>
  <AlertForm :refresh-key="refreshKey" />
</template>
