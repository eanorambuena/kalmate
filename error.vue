<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <div class="text-center">
      <div class="text-4xl font-bold text-[#ff1744] font-mono mb-2">{{ error.statusCode || 500 }}</div>
      <div class="text-[#aaa] text-sm font-sans">{{ error.statusMessage || error.message || $t('errorPage.heading') }}</div>
      <NuxtLink to="/terminal" class="inline-block mt-4 text-[#00c853] hover:underline text-sm font-sans">{{ $t('errorPage.backToTerminal') }}</NuxtLink>
    </div>
  </div>
</template>
