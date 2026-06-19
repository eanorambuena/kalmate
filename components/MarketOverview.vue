<script setup lang="ts">
import { MAJOR_INDICES } from '../utils/constants'
import { useCurrency } from '~/composables/useCurrency'
import type { CategoryItem } from '~/utils/quotePoller'
const { formatPrice } = useCurrency()

interface IndexDisplay {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
}

const props = withDefaults(defineProps<{
  items?: CategoryItem[]
  loading?: boolean
}>(), { items: () => [], loading: false })

const indices = computed<IndexDisplay[]>(() => {
  if (props.items.length > 0) {
    return props.items
  }
  return MAJOR_INDICES.map(idx => ({
    symbol: idx.symbol,
    name: idx.name,
    price: null,
    change: null,
    changePercent: null,
  }))
})
</script>

<template>
  <div class="bg-[#111] border border-[#2a2a2a] rounded-xl p-3 card-hover">
    <div class="text-xs text-[#ccc] mb-3 tracking-wider font-sans flex items-center gap-2" aria-live="polite" aria-label="Market indices">
      <span>MARKET INDICES</span>
      <span v-if="pending" class="inline-block w-2 h-2 rounded-full bg-[#2979ff] animate-pulse" aria-label="Updating" />
    </div>
    <div v-if="error" role="alert" class="text-[#ff1744] text-xs py-4 text-center">No data available</div>
    <div v-else-if="pending && indices.length === 0" class="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Loading indices">
      <div v-for="i in 4" :key="i" class="rounded-lg p-3">
        <div class="skeleton h-3 w-16 mb-2" />
        <div class="skeleton h-5 w-24 mb-1" />
        <div class="skeleton h-3 w-20" />
      </div>
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Market index values">
      <NuxtLink
        v-for="idx in indices"
        :key="idx.symbol"
        :to="`/stock/${idx.symbol}`"
        class="block rounded-lg p-3 transition-all duration-200 hover:bg-[#1a1a1a] hover:scale-[1.02] active:scale-[0.98]"
        :style="(idx.change ?? 0) >= 0 ? { '--glow': 'var(--glow-green)' } : { '--glow': 'var(--glow-red)' }"
        :aria-label="`${idx.name}: ${idx.price?.toFixed(2)} ${(idx.change ?? 0) >= 0 ? 'up' : 'down'} ${Math.abs(idx.change ?? 0).toFixed(2)}`"
      >
        <div class="text-xs text-[#bbb] font-sans font-medium">{{ idx.name }}</div>
        <div class="text-lg font-mono font-bold mt-0.5 tracking-tight">
          {{ formatPrice(idx.price) }}
        </div>
        <div
          class="text-xs font-mono font-medium mt-0.5"
          :class="(idx.change ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
        >
          <span v-if="(idx.change ?? 0) >= 0" aria-hidden="true">▲</span>
          <span v-else aria-hidden="true">▼</span>
          {{ Math.abs(idx.change ?? 0).toFixed(2) }} ({{ Math.abs(idx.changePercent ?? 0).toFixed(2) }}%)
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
