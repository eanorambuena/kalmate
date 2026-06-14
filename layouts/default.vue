<template>
  <div class="min-h-screen" style="background-color: var(--bg-primary); color: var(--text-primary);">
    <Header />
    <main class="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-6">
      <slot />
    </main>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import Toast from '../components/Toast.vue'
</script>
