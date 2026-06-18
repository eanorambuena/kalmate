<script setup lang="ts">
import { useCurrency } from '~/composables/useCurrency'
const { formatPrice, formatChange, formatChangePercent } = useCurrency()

interface CategoryItem {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
}

const props = defineProps<{
  title: string
  symbols: { symbol: string; name: string }[]
}>()

const { data, pending, error, refresh } = await useAsyncData(
  `market-${props.title}`,
  async () => {
    const syms = props.symbols.map(s => s.symbol).join(',')
    const result = await $fetch(`/api/quote?symbols=${syms}`)
    return props.symbols.map((sym) => {
      const q = Array.isArray(result) ? (result as any[]).find((d: any) => d.symbol === sym.symbol) : (result as any) || {}
      return {
        symbol: sym.symbol,
        name: sym.name,
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent: q.regularMarketChangePercent ?? null,
      }
    })
  },
  { default: () => [] }
)

const items = computed(() => data.value || [])

onMounted(() => {
  const interval = setInterval(() => refresh(), 30000)
  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div>
    <div class="text-xs text-[#ccc] mb-2 tracking-wider font-sans flex items-center gap-2" :aria-label="`${title} market data`">
      <span>{{ title }}</span>
      <span v-if="pending" class="inline-block w-2 h-2 rounded-full bg-[#2979ff] animate-pulse" aria-label="Updating" />
    </div>
    <div v-if="error" role="alert" class="text-[#ff1744] text-xs py-8 text-center bg-[#111] border border-[#2a2a2a] rounded-xl">
      No data available
    </div>
    <div v-else-if="pending && items.length === 0" class="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden" aria-label="Loading data">
      <div class="p-3 space-y-2">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3">
          <div class="skeleton h-4 w-16" />
          <div class="skeleton h-4 flex-1 hidden sm:block" />
          <div class="skeleton h-4 w-20 ml-auto" />
          <div class="skeleton h-4 w-20" />
          <div class="skeleton h-4 w-16 hidden sm:block" />
        </div>
      </div>
    </div>
    <div v-else class="bg-[#111] border border-[#2a2a2a] rounded-xl overflow-hidden card-hover">
      <table class="w-full text-sm" :aria-label="`${title} quotes`" role="table">
        <thead>
          <tr class="border-b border-[#2a2a2a] text-[#ccc] text-xs">
            <th scope="col" class="text-left px-3 py-2.5 font-sans">SYMBOL</th>
            <th scope="col" class="text-left px-3 py-2.5 font-sans hidden sm:table-cell">NAME</th>
            <th scope="col" class="text-right px-3 py-2.5 font-sans">PRICE</th>
            <th scope="col" class="text-right px-3 py-2.5 font-sans">CHANGE</th>
            <th scope="col" class="text-right px-3 py-2.5 font-sans hidden sm:table-cell">CHANGE %</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, i) in items"
            :key="item.symbol"
            class="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors duration-150"
            :style="{ animationDelay: `${i * 30}ms` }"
          >
            <td class="px-3 py-2.5">
              <NuxtLink
                :to="`/stock/${item.symbol}`"
                class="text-[#00c853] font-mono font-bold hover:underline hover:text-[#00e060] transition-colors"
                :aria-label="`${item.symbol} - ${item.name}`"
              >
                {{ item.symbol }}
              </NuxtLink>
            </td>
            <td class="px-3 py-2.5 text-[#bbb] text-xs hidden sm:table-cell font-sans truncate max-w-[160px]">{{ item.name }}</td>
            <td class="px-3 py-2.5 text-right font-mono font-medium" aria-label="Price">
              {{ typeof item.price === 'number' ? formatPrice(item.price) : '...' }}
            </td>
            <td
              class="px-3 py-2.5 text-right font-mono font-medium"
              :class="(item.change ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              :aria-label="`Change: ${typeof item.change === 'number' ? formatChange(item.change) : '...'}`"
            >
              <span v-if="typeof item.change === 'number'" class="animate-count-up">
                {{ formatChange(item.change) }}
              </span>
              <span v-else>...</span>
            </td>
            <td
              class="px-3 py-2.5 text-right font-mono font-medium hidden sm:table-cell"
              :class="(item.changePercent ?? 0) >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'"
              :aria-label="`Percent change: ${typeof item.changePercent === 'number' ? formatChangePercent(item.changePercent) : '...'}`"
            >
              <span v-if="typeof item.changePercent === 'number'">
                {{ formatChangePercent(item.changePercent) }}
              </span>
              <span v-else>...</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
