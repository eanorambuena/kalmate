<template>
  <div v-if="showAd" class="w-full px-4 py-2">
    <div class="ad-container text-center text-[#444] text-[10px]">
      <div ref="adSlot" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ads } from '../utils/ads'

const route = useRoute()
const isEditorialPage = computed(() => {
  return ads.googleAdSense.enabled && ads.googleAdSense.publisherId && !route.path.startsWith('/terminal')
})

const showAd = isEditorialPage

if (isEditorialPage.value) {
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
}
</style>
