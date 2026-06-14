<template>
  <div class="min-h-screen" style="background-color: var(--bg-primary); color: var(--text-primary);">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#00c853] focus:text-black focus:rounded-lg focus:outline-none focus:font-bold focus:text-sm">
      Skip to main content
    </a>
    <Header />
    <main id="main-content" class="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-6" role="main" aria-label="Market data">
      <slot />
    </main>
    <MonetizationFooter />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from '../components/Toast.vue'
</script>
