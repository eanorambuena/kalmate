<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl font-bold text-[#ff1744] font-mono mb-2">{{ error.statusCode || 500 }}</div>
      <div class="text-[#aaa] text-sm font-sans">{{ error.statusMessage || error.message || 'Something went wrong' }}</div>
      <div class="flex items-center justify-center gap-3 mt-4">
        <NuxtLink to="/terminal" class="text-[#00c853] hover:underline text-sm font-sans">Back to Terminal</NuxtLink>
        <span class="text-[#333]">|</span>
        <button class="text-[#00c853] hover:underline text-sm font-sans cursor-pointer" @click="window.location.reload()">Retry</button>
      </div>
    </div>
  </div>
</template>
