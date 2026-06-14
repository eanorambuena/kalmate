<script setup lang="ts">
import { MAJOR_INDICES } from '../utils/constants'

interface IndexQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

const { data, pending, error: hasError } = await useAsyncData(
  'market-indices',
  async () => {
    const symbols = MAJOR_INDICES.map(i => i.symbol).join(',')
    const result = await $fetch(`/api/quote?symbols=${symbols}`)
    const arr = Array.isArray(result) ? result : [result]
    return arr.map((q: any) => {
      const info = MAJOR_INDICES.find(i => i.symbol === q.symbol)
      return {
        symbol: q.symbol,
        name: info?.name ?? q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
      }
    })
  },
  { default: () => [] }
)

const indices = computed(() => data.value)

onMounted(() => {
  const interval = setInterval(() => refresh(), 60000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="bg-[#111] border border-[#333] rounded p-3">
    <div class="text-xs text-[#aaa] mb-2 tracking-wider font-sans">MARKET INDICES</div>
    <div v-if="error" class="text-[#ff1744] text-xs">No data available</div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <NuxtLink
        v-for="idx in indices"
        :key="idx.symbol"
        :to="`/stock/${idx.symbol}`"
        class="block hover:bg-[#1a1a1a] rounded p-2 transition-colors"
      >
        <div class="text-xs text-[#bbb] font-sans">{{ idx.name }}</div>
        <div class="text-sm font-mono font-bold">
          {{ idx.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </div>
        <div
          class="text-xs font-mono"
          :class="(idx.change ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
        >
          {{ idx.change >= 0 ? '+' : '' }}{{ idx.change?.toFixed(2) }} ({{ idx.changePercent?.toFixed(2) }}%)
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
