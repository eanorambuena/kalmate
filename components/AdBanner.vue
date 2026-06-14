<template>
  <div v-if="showAd" class="w-full">
    <!-- Google AdSense auto-ads script (injected once in head) -->
    <!-- Manual ad unit placeholder -->
    <div class="ad-container">
      <ins
        v-if="adUnitId"
        class="adsbygoogle"
        style="display:block"
        :data-ad-client="ads.googleAdSense.publisherId"
        :data-ad-slot="adUnitId"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  </div>
</template>

<script setup>
import { ads } from '../utils/ads'

const props = defineProps({
  adUnitId: {
    type: String,
    default: '',
  },
})

const showAd = computed(() => ads.googleAdSense.enabled && ads.googleAdSense.publisherId)

if (ads.googleAdSense.enabled && ads.googleAdSense.publisherId && ads.googleAdSense.autoAds) {
  useHead({
    script: [
      {
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.googleAdSense.publisherId}`,
        async: true,
        crossorigin: 'anonymous',
      },
    ],
  })
}
</script>

<style scoped>
.ad-container {
  min-height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  overflow: hidden;
}
</style>
