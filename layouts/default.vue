<template>
  <div class="min-h-screen" style="background-color: var(--bg-primary); color: var(--text-primary);">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#00c853] focus:text-black focus:rounded-lg focus:outline-none focus:font-bold focus:text-sm">
      Skip to main content
    </a>
    <Header />
    <main id="main-content" class="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-6" role="main" :aria-label="pageLabel">
      <slot />
    </main>
    <AppFooter />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Toast from '../components/Toast.vue'

const route = useRoute()
const pageLabel = computed(() => {
  const path = route.path
  if (path.includes('/portfolio')) return 'Portfolio overview'
  if (path.includes('/alerts')) return 'Price alerts'
  if (path.includes('/screener')) return 'Stock screener'
  if (path.includes('/pipeline')) return 'Pipeline editor'
  if (path.includes('/pricing')) return 'Pricing plans'
  return 'Market data'
})
</script>
