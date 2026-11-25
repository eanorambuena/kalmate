<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-6xl h-[85vh] bg-[#0c0c0c] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="text-white text-sm font-semibold truncate flex-1">{{ title }}</h2>
          <span class="hidden sm:inline text-[10px] text-[#666]">Scroll to zoom · drag to pan · Esc to close</span>
          <button
            ref="closeBtn"
            type="button"
            class="w-7 h-7 flex items-center justify-center rounded text-[#aaa] hover:text-white hover:bg-[#222] text-lg leading-none"
            aria-label="Close"
            @click="emit('close')"
          >×</button>
        </div>
        <PipelineChart :lines="lines" :candles="candles" height="calc(85vh - 100px)" :initial-horizon="initialHorizon" :aria-label="title" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import PipelineChart, { type ChartLine } from './PipelineChart.vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  lines: ChartLine[]
  candles?: { timestamp: number; open: number; high: number; low: number; close: number }[] | null
  initialHorizon?: string
}>(), { candles: null, initialHorizon: '1Y' })

const emit = defineEmits<{ close: [] }>()
const closeBtn = ref<HTMLButtonElement>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
  }
}

watch(() => props.open, (v) => {
  if (v) {
    window.addEventListener('keydown', onKey, true)
    nextTick(() => closeBtn.value?.focus())
  } else {
    window.removeEventListener('keydown', onKey, true)
  }
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>
