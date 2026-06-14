<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <div class="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
    <TransitionGroup name="fade">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl backdrop-blur-xl border animate-slide-up whitespace-nowrap"
        :class="{
          'bg-[#00c853]/15 text-[#00c853] border-[#00c853]/30': t.type === 'success',
          'bg-[#ff1744]/15 text-[#ff1744] border-[#ff1744]/30': t.type === 'error',
          'bg-[#2979ff]/15 text-[#2979ff] border-[#2979ff]/30': t.type === 'info',
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg leading-none">{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'i' }}</span>
          <span>{{ t.message }}</span>
          <button class="ml-2 opacity-50 hover:opacity-100 transition-opacity text-xs" @click="remove(t.id)">✕</button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
